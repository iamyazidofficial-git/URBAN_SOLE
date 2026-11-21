const Coupon=require("../models/coupon")
const Product = require("../models/product")
const Address=require("../models/address.js")
const User=require("../models/user.js")
const Order=require("../models/order.js")
const Variant=require("../models/variant.js")
const jwt=require("jsonwebtoken")
const Cart=require("../models/cart.js")
const Wallet=require("../models/wallet.js")
const WalletTransaction=require("../models/walletTransaction.js")
const { processWalletTransactionService } = require("../service/wallet.js")
const mongoose=require("mongoose")
const nodeCrypto = require("crypto");

const Razorpay = require("razorpay");
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const fetchCheckoutService=async(productData,selectedCoupon,type)=>{

    let subTotal=0
    let tax
    let taxPercentage=18
    let shippingCharge=0
    let totalAmount
    let couponDiscount

    for (let item of productData){
        let itemPrice=item.price
        if(item?.offer){
            const offerDiscount=(itemPrice*item?.offer)/100
            itemPrice-=parseInt(offerDiscount)
        }
        const productTotal=itemPrice*item.quantity
        subTotal+=productTotal
    }

    tax=(subTotal*taxPercentage)/100
    
    if(subTotal<4000){
        if(subTotal<1000){
            shippingCharge=90
        }
        else if(subTotal<2000){
            shippingCharge=70
        }
        else if(subTotal<300){
            shippingCharge=50
        }
        else{
            shippingCharge=40
        }
    }


    let readyCoupon

    if (selectedCoupon) {
    readyCoupon = await Coupon.findOne({ _id: selectedCoupon });
  }

    
   totalAmount=subTotal+tax


    if (readyCoupon && subTotal >= readyCoupon?.minCart) {
    if (readyCoupon.discountType === "Percentage") {
      const discount = (subTotal * readyCoupon.discountValue) / 100;
      couponDiscount = readyCoupon.maxDiscount < discount ? readyCoupon.maxDiscount : discount;
    } else {
      couponDiscount = readyCoupon.discountValue;
    }
      totalAmount-=couponDiscount

  }

  totalAmount += shippingCharge
  totalAmount = Number(totalAmount.toFixed(2));
  couponDiscount = Number((couponDiscount || 0).toFixed(2))


     return{
        subTotal:subTotal,
        taxPercentage:taxPercentage,
        tax:tax,
        totalAmount:totalAmount,
        shippingCharge:shippingCharge,
        couponDiscount:couponDiscount,
        items:productData,
        type:type||"single"
    }
}



const placeOrderService=async(orderData)=>{
   

const {productData,payment,address,coupon,userId,type}=orderData

console.log("DDD",productData)

const inActiveProducts = await Product.find({
    _id: { $in: productData.map(item => item.product) },
    status: "InActive"
});

if (inActiveProducts.length > 0) {
    throw new Error("This order contains inactive products");
}

if(!userId){
    throw new Error("Session expired please login")
}

const user=await User.findOne({_id:userId})

if(!user){
    throw new Error("Session expired please login")
}

if(!address){
    throw new Error("Address is required")
}
if(!payment){

  throw new Error("please select an payment method")

}
if(!["CASHONDELIVERY","RAZORPAY","WALLET"].includes(payment.trim().toUpperCase())){

    throw new Error("please select an payment method")

}
if(!productData){

     throw new Error("please select order products")

}

let couponObject
if (coupon) {
    couponObject = await Coupon.findOne({ _id: coupon });
    if (!couponObject) {
      throw new Error("Coupon is unavailable");
    }
  }



    let subTotal=0
    let tax
    let taxPercentage=18
    let shippingCharge=0
    let totalAmount=0
    let totalProducts=productData.length
    let couponDiscount
    let orderItems=[]


productData.forEach(item => {
  if (item.offer) {
    item.price -= (item.price * item.offer) / 100
  }
})

subTotal=productData.reduce((acc,item)=>{
acc+=item.price
return acc
},0)

    
    if(subTotal<6000){
        if(subTotal<1000){
            shippingCharge=90
        }
        else if(subTotal<3000){
            shippingCharge=70
        }
        else if(subTotal<5000){
            shippingCharge=50
        }
        else{
            shippingCharge=40
        }
    }


if (couponObject && subTotal >= couponObject.minCart) {
    if (couponObject.discountType === "Percentage") {
      const discount = (couponObject.discountValue * subTotal) / 100;
      couponDiscount = Math.min(discount, couponObject.maxDiscount || discount);
    } else {
      couponDiscount = couponObject.discountValue;
    }
  }


if (couponDiscount) {

  productData.forEach(item => {
    const discount = (item.price / subTotal) * couponDiscount

    const finalDiscount = Number(discount.toFixed(2))

    item.itemTotal = Number(
      (item.price - finalDiscount).toFixed(2)
    )
  })

}

tax=(subTotal*taxPercentage)/100

productData.forEach(item => {
  const productTax = (item.price / subTotal) *tax

  item.tax = Number(productTax.toFixed(2))

  item.itemTotal = Number(
    (item.price + item.tax).toFixed(2)
  )
})


for(const item of productData){


    const productId = item.product || item._id;
    const productName = item.productName || item.name;
    const productImage = item.image || item.img;

    const product = await Product.findOne({ _id: productId })
    if (!product) {
        throw new Error("Product not found");
    }

    const itemVariant = await Variant.findOne({ 
        _id: { $in: product.vartiant }, 
        colour: item.colour 
    })

    if (!itemVariant) {
        throw new Error("Product variant not found");
    }


const itemSize = Number(item.size);
const itemQuantity = Number(item.quantity);

const updatedVariant = await Variant.findOneAndUpdate(
    {
        _id: itemVariant._id,
        inventory: {
            $elemMatch: {
                size: itemSize,                   
                quantity: { $gte: itemQuantity }  
            }
        }
    },
    {
        $inc: { "inventory.$.quantity": -itemQuantity }
    }
);


if (!updatedVariant) {
    throw new Error(`${item.productName} is out of stock for size ${item.size}`);
}


    orderItems.push({
        product: productId,
        productName: productName,
        variant: itemVariant ? itemVariant._id : null,
        colour: item.colour,
        image: productImage,
        size: item.size,
        price: item.price,
        itemTotal: item.itemTotal,
        quantity: item.quantity,
        status: "PENDING",
    });

totalAmount+=Number(item.itemTotal)
}


const shippingAddress=await Address.findOne({_id:address}).select("fullName phoneNumber streetAddress apartment city state postalCode addressType")

if(!shippingAddress){
    throw new Error("Address not found")
}


const generateOrderId = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");

    const randomNumber = Math.floor(100000 + Math.random() * 900000);

    return `US-${date}-${randomNumber}`;
}

const orderId=generateOrderId ()



const orderDate = new Date();
const estimatedDelivery = new Date(orderDate);

estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

const startDay = String(orderDate.getDate()).padStart(2, '0');

const endDay = String(estimatedDelivery.getDate()).padStart(2, '0');

const month = estimatedDelivery
    .toLocaleString('en-US', { month: 'short' })
    .toUpperCase();

const year = estimatedDelivery.getFullYear();

const formattedDate = `${startDay}–${endDay} ${month} ${year}`;

console.log(formattedDate);


const orderedData={
    orderId:orderId,
    user:user?._id,
    customerSnapshot:{
        name:user?.name,
        email:user?.email
    },
    items:orderItems,
    shippingAddress:shippingAddress,
     payment: {
        method: payment.trim().toUpperCase(),
        status: payment.trim().toUpperCase() === "WALLET" ? "PAID" : "PENDING"
    },
    pricing:{
        subTotal:subTotal,
        tax:tax,
        taxPercentage:taxPercentage,
        shippingCharge:shippingCharge?shippingCharge:0,
        discount:couponDiscount||0,
        totalAmount:Number(totalAmount)
    }
}

if (payment.trim().toUpperCase() === "WALLET") {
    userWallet = await Wallet.findOne({ user: userId });
    
    if (!userWallet || userWallet.balance < totalAmount) {
        throw new Error("Insufficient wallet balance");
    }
}



if (payment.trim().toUpperCase() === "WALLET" || payment.trim().toUpperCase() === "CASHONDELIVERY") {
    orderedData["orderStatus"] = "PLACED";
    orderedData.items.forEach(item => { item.status = "PLACED"; });
} else {
    orderedData["orderStatus"] = "PENDING";
    orderedData.items.forEach(item => { item.status = "PENDING"; });
}


if (payment.trim().toUpperCase() === "WALLET") {
    userWallet.balance -= totalAmount;
    await userWallet.save();

    await WalletTransaction.create({
        wallet: userWallet._id,
        user: user._id,
        type: "DEBIT",
        source: "ORDER_PAYMENT",
        amount: totalAmount,
        order: orderData.orderId, 
        description: `Payment for order ${orderId}`,
        referenceId: orderId
    });
}
else if(payment.trim().toUpperCase()=="CASHONDELIVERY"){
    orderedData["orderStatus"]="PLACED"
 orderedData.items.forEach(item => {
        item.status = "PLACED";
    })
}
else if(payment.trim().toUpperCase()=="RAZORPAY"){
    orderedData["orderStatus"]="PENDING"
 orderedData.items.forEach(item => {
        item.status = "PENDING";
    })
}


let razorpayOrder = null

if (payment.trim().toUpperCase() === "RAZORPAY") {
    const options = {
        amount: Math.round(totalAmount * 100), 
        currency: "INR",
        receipt: orderId,
    };
    
    try {
        razorpayOrder = await razorpayInstance.orders.create(options);
    } catch (error) {
        console.error("Razorpay API Error Details:", error);
        throw new Error("Payment Failed");
    }
}

const newOrder=await Order.create(orderedData)


for (item of productData){
    
    const productId = item.product || item._id;
    const productName = item.productName || item.name;
    const productImage = item.image || item.img;

    const product = await Product.findOne({ _id: productId })
    if (!product) {
        throw new Error("Product not found");
    }

    const itemVariant = await Variant.findOne({ 
        _id: { $in: product.vartiant }, 
        colour: item.colour 
    })

    if (!itemVariant) {
        throw new Error("Product variant not found");
    }


    const itemSize = Number(item.size);
const itemQuantity = Number(item.quantity);

const updatedVariant = await Variant.findOneAndUpdate(
    {
        _id: itemVariant._id,
        inventory: {
            $elemMatch: {
                size: itemSize,                   
                quantity: { $gte: itemQuantity }  
            }
        }
    },
    {
        $inc: { "inventory.$.quantity": -(itemQuantity-1) }
    }
);


if (!updatedVariant) {
    throw new Error(`${item.productName || 'Product'} is out of stock for size ${item.size}`);
}
}



if(type=="cart"){
    const cart=await Cart.findOne({user:user._id})

    cart.items=[]
    await cart.save()
}



const orderDetails={
    orderId:orderId,
    estimatedDelivery:formattedDate,
    razorpayOrder:razorpayOrder,
    _id:newOrder._id
}

return orderDetails

}







const getOrderService=async (role="user",userId,query)=>{

    console.log(role)


    if(role=="user"){
    const orders=await Order.find({user:userId})
    return orders||[]
    }
    if(role=="admin"){

        console.log("Haii",query)

        let searchCondition={}

        if(query.search?.trim()!=""){
            const matchedUsers=await User.find({name:{$regex:query.search?.trim(),$options:"i"}})
            searchCondition={$or:[
                {user:{$in:matchedUsers.map(i=>i._id)}},
                {orderId:{$regex:query.search?.trim(),$options:"i"}}
            ]}
        }

        const page=Math.max(1,parseInt(query.page)||1)
        const limit=Math.max(1,parseInt(query.limit)||8)
        const skip=(page-1)*limit
        const count=await Order.countDocuments(searchCondition)
        const totalPages=Math.ceil(count/limit)
        const totalOrders=count

        const orders=await Order.find(searchCondition).sort({createdAt:-1}).limit(limit).skip(skip).populate("user")


        const OrderData={
            orders:orders,
            totalPages:totalPages,
            totalOrders:totalOrders,
            currentPage:page
        }


        return OrderData

    }
  
}


const trackOrderService=async(params)=>{
    const orderId=params?.orderId

    
     if(!orderId){
        throw new Error("orderId is not passed")
    }
    
    const orderData=await Order.findOne({_id:orderId})

    if(!orderData){
        throw new Error("order is not found")
    }

    return orderData
}



const orderDetailsService=async(params)=>{

     const orderId=params?.id

      if(!orderId){
        throw new Error("orderId is not passed")
    }

    const orderData=await Order.findOne({_id:orderId})

    
    if(!orderData){
        throw new Error("order is not found")
    }

    return orderData
}



const toggleStatusService=async(params,body)=>{
    const orderId=params.id
    const status=body?.status?.trim()
    const reason=body?.reason.trim()


    console.log(body,params)


    if(!orderId){
        throw new Error("OrderId is not passed")
    }
    if(!status){
        throw new Error("Status is not passed")
    }
   

    const order=await Order.findOne({_id:orderId})

    if (!order) {
        throw new Error("Order is not found");
    }


    const currentStatus = order.orderStatus;

    if (["DELIVERED", "RETURNED", "CANCELLED", "RETURN_REJECTED"].includes(currentStatus)) {
        throw new Error(`Order is already in ${currentStatus} state. Status cannot be changed.`);
    }

    if (currentStatus === "PLACED") {
        if (!["SHIPPED", "OUT_OF_DELIVERY", "CANCELLED"].includes(status)) {
            throw new Error("Invalid status transition. From PLACED, you can only change to SHIPPED, OUT_OF_DELIVERY, or CANCELLED.");
        }
    } 
    else if (currentStatus === "SHIPPED") {
        if (!["OUT_OF_DELIVERY", "CANCELLED"].includes(status)) {
            throw new Error("Invalid status transition. From SHIPPED, you can only change to OUT_OF_DELIVERY or CANCELLED.");
        }
    } 
    else if (currentStatus === "OUT_OF_DELIVERY") {
        if (!["DELIVERED", "CANCELLED"].includes(status)) {
            throw new Error("Invalid status transition. From OUT_OF_DELIVERY, you can only change to DELIVERED or CANCELLED.");
        }
    } 
    else if (currentStatus === "RETURN_REQUESTED") {
        if (!["RETURN_APPROVED", "RETURN_REJECTED"].includes(status)) {
            throw new Error("Invalid status transition. From RETURN_REQUESTED, you can only change to RETURN_APPROVED or RETURN_REJECTED.");
        }
    } 
    else if (currentStatus === "RETURN_APPROVED") {
        if (status !== "RETURNED") {
            throw new Error("Invalid status transition. From RETURN_APPROVED, you can only change to RETURNED.");
        }
    }

    if(status=="CANCELLED"){

         if(!reason ||reason==""){
        throw new Error("Reason is not passed")
    }

  const date=new Date()
        
   order.cancellation.reason=reason
   order.cancellation.at=date
   order.cancellation.by="USER"

    }


     if(status=="RETURN_REJECTED"){

         if(!reason ||reason==""){
        throw new Error("Reason is not passed")
    }

  const date=new Date()
        
   order.returnInfo.rejectionReason=reason
   order.returnInforequestedAt=date

    }

     if(status=="RETURN_APPROVED"){

  const date=new Date()
        
   order.returnInfo.approvedAt=date

   const requestedItems=order.items.filter(item=>item.status=="RETURN_REQUESTED")

   requestedItems.forEach(item=>item.status="RETURN_APPROVED")

    }

    if (status == "RETURNED") {
        const date = new Date();
        order.returnInfo.returnedAt = date;

        const returnItem=order.items.filter(item=>item.status=="RETURN_APPROVED")

        const returnPrice=returnItem.reduce((acc,item)=>{
            acc+=item.itemTotal
            return acc
        },0)

        if(order.deliveryCharge>0){
            returnPrice-=order.deliveryCharge
        }


            await processWalletTransactionService({
                userId: order.user,
                amount: returnPrice,
                type: "CREDIT",
                source: "ORDER_REFUND",
                orderId: order._id,
                description: `Refund for returned order ${order.orderId}`
            });
        
    }
    

    const items = order.items.filter(item =>
  !["RETURNED", "RETURN_REQUESTED", "RETURN_REJECTED", "CANCELLED"].includes(item.status)
)

    order.orderStatus=status

    items.map(item=>item.status=status)


    await order.save()

    return{
        success:true
    }
}



const cancelOrderService=async(params)=>{
   const orderId=params.orderId
   const reason=params?.reason?.trim()

   if(!orderId){
    throw new Error("Order Id is not passed")
   }

   const order=await Order.findOne({_id:orderId})

   if(!order){
    throw new Error("Order is not found")
   }
   if(!reason){
    throw new Error("Reason is not passed")
   }

   const allowedStatusesForCancellation = ["PLACED", "SHIPPED", "OUT_OF_DELIVERY"];

    if (!allowedStatusesForCancellation.includes(order.orderStatus)) {
        throw new Error(`Order cancellation is not allowed in this time`);
    }

   if(order.orderStatus=="PENDING"){
    throw new Error("Order is not placed")
   }

   if(order.orderStatus==("DELIVERED"||"RETURNED")){
    throw new Error("This Order allready Delivered")
   }

   if(order.orderStatus=="CANCELLED"){
    throw new Error("This Order allready Cancelled")
   }

   const items=order.items?.filter(item=>item.status!="CANCELLED")

   console.log("items",items)
   items.map(item=>item.status="CANCELLED")

   order.orderStatus="CANCELLED"

   const date=new Date()
    
   order.cancellation.at=date
   order.cancellation.reason=reason

   await order.save()

   return{
    success:true
   }

}



const cancelProductService=async(params,body)=>{
const orderId=params.orderId
const productId=params.productId
const reason=body?.reason?.trim()

if(!orderId){
    throw new Error("OrderId is not passed")
}
if(!productId){
    throw new Error("ProductId is not passed")
}

const order=await Order.findOne({_id:orderId})

if(!order){
    throw new Error("Order is not found")
}
 if(order.orderStatus=="PENDING"){
    throw new Error("Order is not placed")
   }

   if(order.orderStatus==("DELIVERED"||"RETURNED")){
    throw new Error("This Order allready Delivered")
   }

   const item=order.items.find(item=>item.product==productId)

   if(!item){
    throw new Error("Item not found in this order")
   }

   const allowedStatusesForCancellation = ["PLACED", "SHIPPED", "OUT_OF_DELIVERY"];

    if (!allowedStatusesForCancellation.includes(item.status)) {
        throw new Error(`Cancellation is not allowed for this time`);
    }

   if(item.status=="CANCELLED"){
    throw new Error("This Item allready cancelled")
   }

   const date=new Date()

   item.status="CANCELLED"
   item.cancellation.reason=reason
   item.cancellation.at=date
   item.cancellation.by="USER"

   await order.save()

   return {
    success:true
   }
}










const returnOrderService=async(params,body)=>{
   const orderId=params.orderId
   const reason=body?.reason?.trim()
   if(!orderId){
    throw new Error("Order Id is not passed")
   }

   if(!reason){
    throw new Error("Reason is not passed")
   }
   const order=await Order.findOne({_id:orderId})

   if(!order){
    throw new Error("Order is not found")
   }

   if(!order.orderStatus=="DELIVERED"){
    throw new Error("Order is not delivered")
   }


   if(["RETURN_REQUESTED","RETURN_REJECTED","RETURN_APPROVED","RETURNED"].includes(order.orderStatus)){
    throw new Error("This Order Allready requested for Return")
   }

   const items=order.items?.filter(item=>item.status!="RETURN_REQUESTED")


   console.log("items",items)

   items.map(item=>item.status="RETURN_REQUESTED")

   const date=new Date()

   order.orderStatus="RETURN_REQUESTED"
   order.returnInfo = { ...order.returnInfo, reason: reason,requestedAt:date}
   await order.save()

   return{
    success:true
   }

}



const returnProductService=async(params,body)=>{
const orderId=params.orderId
const productId=params.productId
const reason=body?.reason?.trim()


if(!orderId){
    throw new Error("OrderId is not passed")
}
if(!productId){
    throw new Error("ProductId is not passed")
}

const order=await Order.findOne({_id:orderId})


   if(!order){
    throw new Error("Order is not found")
   }


   if(["RETURN_REQUESTED","RETURN_REJECTED","RETURNED"].includes(order.orderStatus)){
    throw new Error("This Order Allready requested for Return")
   }

   if(!order.orderStatus=="DELIVERED"){
    throw new Error("Order is not delivered")
   }

   const item=order.items.find(item=>item.product==productId)

   if(!item){
    throw new Error("Item not found in this order")
   }

   if(["RETURN_REQUESTED","RETURN_REJECTED","RETURN_APPROVED","RETURNED"].includes(item.status)){
    throw new Error("This Item allready Requested for Return")
   }

   const date=new Date()

   item.status="RETURN_REQUESTED"
   item.returnInfo.reason=reason
   item.returnInfo.requestedAt=date

   await order.save()

   return {
    success:true
   }
}









const toggleItemService=async(params,body)=>{

    const orderId=params.orderId
    const itemId=params.itemId
    const status=body?.status?.trim()
    const reason=body?.reason?.trim()

    console.log(status,"STTU")
    

    if(!orderId){
        throw new Error("OrderId is not passed")
    }
    if(!status){
        throw new Error("Status is not passed")
    }
   

    const order=await Order.findOne({_id:orderId})

    if(!order){
        throw new Error("Order is not found")
    }

    const item=order.items.find(item=>item.product==itemId)

    if (!item) {
        throw new Error("Item is not found in this order");
    }

    const currentStatus = item.status;

    if (currentStatus === "DELIVERED" || currentStatus === "RETURNED" || currentStatus === "CANCELLED" || currentStatus === "RETURN_REJECTED") {
        throw new Error(`Item is already in ${currentStatus} state. Status cannot be changed.`);
    }
    if (currentStatus === "PLACED") {
        if (!["SHIPPED", "OUT_OF_DELIVERY", "CANCELLED"].includes(status)) {
            throw new Error("Invalid status transition. From PLACED, you can only change to SHIPPED, OUT_OF_DELIVERY, or CANCELLED.");
        }
    } 
    else if (currentStatus === "SHIPPED") {
        if (!["OUT_OF_DELIVERY", "CANCELLED"].includes(status)) {
            throw new Error("Invalid status transition. From SHIPPED, you can only change to OUT_OF_DELIVERY or CANCELLED.");
        }
    } 
    else if (currentStatus === "OUT_OF_DELIVERY") {
        if (!["DELIVERED", "CANCELLED"].includes(status)) {
            throw new Error("Invalid status transition. From OUT_OF_DELIVERY, you can only change to DELIVERED or CANCELLED.");
        }
    } 
    else if (currentStatus === "RETURN_REQUESTED") {
        if (!["RETURN_APPROVED", "RETURN_REJECTED"].includes(status)) {
            throw new Error("Invalid status transition. From RETURN_REQUESTED, you can only change to RETURN_APPROVED or RETURN_REJECTED.");
        }
    } 
    else if (currentStatus === "RETURN_APPROVED") {
        if (status !== "RETURNED") {
            throw new Error("Invalid status transition. From RETURN_APPROVED, you can only change to RETURNED.");
        }
    }

    if(status=="CANCELLED"){

         if(!reason ||reason==""){
        throw new Error("Reason is not passed")
    }

  const date=new Date()
        
   item.cancellation.reason=reason
   item.cancellation.at=date
   item.cancellation.by="USER"
    }



    
    if(status=="RETURN_REJECTED"){

         if(!reason ||reason==""){
        throw new Error("Reason is not passed")
    }

  const date=new Date()
        
   item.returnInfo.rejectionReason=reason
   item.returnInfo.rejectedAt=date
    }




 if(status=="RETURN_APPROVED"){


  const date=new Date()
        
   item.returnInfo.approvedAt=date
    }

    console.log("YAZZZ",status)

item.status=status
console.log("IN",item)


await order.save()

    return{
        success:true
    }
}





const verifyPaymentService = async (body) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body;

    console.log("OOORR", orderId);

    if (!orderId) {
        throw new Error("Order ID is required");
    }

    const hmac = nodeCrypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");

    if (generated_signature !== razorpay_signature) {
        throw new Error("Payment verification failed: Invalid signature");
    }

    const order = await Order.findOne({
        $or: [
            ...(mongoose.Types.ObjectId.isValid(orderId) ? [{ _id: orderId }] : []),
            { orderId: orderId }
        ]
    });

    if (!order) {
        throw new Error("Order not found");
    }

    order.orderStatus = "PLACED";
    order.payment.status = "PAID";
    order.payment.razorpayPaymentId = razorpay_payment_id;
    order.payment.razorpaySignature = razorpay_signature;

    if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
            item.status = "PLACED";
        });
    }

    await order.save();

    return { success: true, message: "Payment verified and order placed successfully" };
};





const retryPaymentService = async ({ orderId, _id } = {}) => {
    const lookupId = _id || orderId;

    if (!lookupId) {
        throw new Error("Order ID is required");
    }

    const order = await Order.findOne({
        $or: [
            ...(mongoose.Types.ObjectId.isValid(lookupId) ? [{ _id: lookupId }] : []),
            { orderId: lookupId }
        ]
    });

    if (!order) {
        throw new Error("Order not found");
    }

    if (order.payment?.status === "PAID" || order.orderStatus === "PLACED") {
        throw new Error("This order is already paid");
    }

    const options = {
        amount: Math.round(order.pricing.totalAmount * 100),
        currency: "INR",
        receipt: order.orderId || order._id.toString(),
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    return {
        razorpayOrder,
        _id: order._id,
        orderId: order.orderId,
        customerSnapshot: order.customerSnapshot,
        shippingAddress: order.shippingAddress
    };
};

module.exports={fetchCheckoutService,placeOrderService,getOrderService,trackOrderService,orderDetailsService,toggleStatusService,cancelOrderService,cancelProductService,toggleItemService,returnOrderService,returnProductService,verifyPaymentService,retryPaymentService}