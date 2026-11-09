const Coupon=require("../models/coupon")
const Product = require("../models/product")
const Address=require("../models/address.js")
const User=require("../models/user.js")
const Order=require("../models/order.js")
const Variant=require("../models/variant.js")

const fetchCheckoutService=async(productData,selectedCoupon)=>{

    let subTotal=0
    let tax
    let taxPercentage=18
    let shippingCharge=0
    let totalAmount
    let couponDiscount
 
    for (let item of productData){
        let itemPrice=item.price
        console.log("item",item)
        if(item?.offer){
            console.log("Haii")
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

    if(selectedCoupon){
         readyCoupon=await Coupon.findOne({_id:selectedCoupon})
    }

    
   totalAmount=subTotal+tax


    if(readyCoupon && subTotal>readyCoupon?.minCart){
      if(readyCoupon.discountType=="Percentage"){
        const discount=(totalAmount*readyCoupon.discountValue)/100

        readyCoupon.maxDiscount<discount?couponDiscount=readyCoupon.maxDiscount:couponDiscount=discount
        totalAmount=totalAmount-couponDiscount
      }
      else{
        totalAmount=totalAmount-readyCoupon.discountValue
        couponDiscount=readyCoupon.discountValue
      }
    }

   console.log("JJJJJJJJJ",{ subTotal:subTotal,
        taxPercentage:taxPercentage,
        tax:tax,
        totalAmount:totalAmount,
        shippingCharge:shippingCharge,
        items:productData})


     return{
        subTotal:subTotal,
        taxPercentage:taxPercentage,
        tax:tax,
        totalAmount:totalAmount,
        shippingCharge:shippingCharge,
        couponDiscount:couponDiscount,
        items:productData
    }
}



const placeOrderService=async(orderData)=>{
   

const {productData,payment,address,coupon,userId}=orderData

console.log("HIIII",orderData)


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
if(coupon){
    couponObject=await Coupon.findOne({coupon})
    if(!couponObject){
 throw new Error("Coupon is unavailable")
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
    const discount = (couponObject.discountValue * subTotal) / 100
    couponDiscount = Math.min(discount, couponObject.maxDiscount || discount)
  } else {
    couponDiscount = couponObject.discountValue
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

   const itemVariant = await Variant.findOne({ colour: item.colour });

    const productId = item.product || item._id;
    const productName = item.productName || item.name;
    const productImage = item.image || item.img;

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
    payment:{
        method:payment.trim().toUpperCase()
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

await Order.create(orderedData)

const orderDetails={
    orderId:orderId,
    estimatedDelivery:formattedDate
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
    
    const orderData=await Order.findOne({_id:orderId})

     if(!orderId){
        throw new Error("orderId is not passed")
    }
    if(!orderData){
        throw new Error("order is not found")
    }

    return orderData
}



const orderDetailsService=async(params)=>{

     const orderId=params?.id

     console.log("Haiai;",orderId)

    const orderData=await Order.findOne({_id:orderId})

     if(!orderId){
        throw new Error("orderId is not passed")
    }
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

    }

    if(status=="RETURNED"){
   const date=new Date() 
   order.returnInfo.returnedAt=date 
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

console.log("NFHFHFHF",body)

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

   if(!order.orderStatus=="DELIVERED"){
    throw new Error("Order is not delivered")
   }


   if(["RETURN_REQUESTED","RETURN_REJECTED","RETURNED"].includes(order.orderStatus)){
    throw new Error("This Order Allready requested for Return")
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
console.log("BJJ",body)
console.log("PAA",params)
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


module.exports={fetchCheckoutService,placeOrderService,getOrderService,trackOrderService,orderDetailsService,toggleStatusService,cancelOrderService,cancelProductService,toggleItemService,returnOrderService,returnProductService}