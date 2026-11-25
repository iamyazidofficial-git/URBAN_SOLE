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

const getRazorpayCredentials = () => {
    const key_id = (process.env.RAZORPAY_KEY_ID || "rzp_test_TyBdnHhmwVXFOs").trim();
    const key_secret = (process.env.RAZORPAY_KEY_SECRET || "rwAFwm44CXcHLRcGpIUWI6Bs").trim();
    return { key_id, key_secret };
};

const getRazorpayInstance = () => {
    const { key_id, key_secret } = getRazorpayCredentials();
    return new Razorpay({ key_id, key_secret });
};

const findCoupon = async (selectedCoupon, userId = null) => {
    if (!selectedCoupon) return null;
    const identifier = String(selectedCoupon).trim();
    if (!identifier) return null;

    let coupon = null;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
        coupon = await Coupon.findById(identifier);
    }
    if (!coupon) {
        coupon = await Coupon.findOne({ code: identifier.toUpperCase(), status: "Active" });
    }
    if (!coupon) return null;

    const now = new Date();
    if (new Date(coupon.expiryDate) < now || (coupon.usageCount && coupon.usedCount >= coupon.usageCount)) {
        await Coupon.deleteOne({ _id: coupon._id });
        return null;
    }

    if (userId && coupon.usedBy && coupon.usedBy.some(u => u?.toString() === userId?.toString())) {
        return null;
    }

    return coupon;
};



const calculateOrderPricing = (productData, readyCoupon) => {
    let subTotal = 0;
    const taxPercentage = 18;

    console.log("PRRROR",productData)

    const processedItems = (productData || []).map((rawItem) => {
        let unitPrice = Number(rawItem.price) || 0;
        const offer = Number(rawItem.offer) || 0;
        if (offer > 0) {
            unitPrice = Math.round(unitPrice - (unitPrice * offer) / 100);
        }
        unitPrice = Number(unitPrice.toFixed(2));
        const qty = Math.max(1, Number(rawItem.quantity) || 1);
        const lineTotal = Number((unitPrice * qty).toFixed(2));
        subTotal += lineTotal;

        return {
            ...rawItem,
            price: Number(rawItem.price) || unitPrice,
            offer: offer,
            effectivePrice: unitPrice,
            quantity: qty,
            lineTotal: lineTotal
        };
    });

    subTotal = Number(subTotal.toFixed(2));

    let couponDiscount = 0;
    if (readyCoupon) {
        const minCart = Number(readyCoupon.minCart) || 0;
        if (subTotal >= minCart) {
            const isPercentage = (readyCoupon.discountType || "").trim().toLowerCase() === "percentage";
            if (isPercentage) {
                const calculated = (subTotal * Number(readyCoupon.discountValue)) / 100;
                if (readyCoupon.maxDiscount && Number(readyCoupon.maxDiscount) > 0) {
                    couponDiscount = Math.min(calculated, Number(readyCoupon.maxDiscount));
                } else {
                    couponDiscount = calculated;
                }
            } else {
                couponDiscount = Number(readyCoupon.discountValue) || 0;
            }
            couponDiscount = Math.min(couponDiscount, subTotal);
        }
    }
    couponDiscount = Number(couponDiscount.toFixed(2));

    const taxableAmount = Math.max(0, subTotal - couponDiscount);
    const tax = Number(((taxableAmount * taxPercentage) / 100).toFixed(2));

    let shippingCharge = 0;
    if (subTotal < 4000) {
        if (subTotal < 1000) {
            shippingCharge = 90;
        } else if (subTotal < 2000) {
            shippingCharge = 70;
        } else {
            shippingCharge = 40;
        }
    }

    const totalAmount = Number((taxableAmount + tax + shippingCharge).toFixed(2));

    processedItems.forEach((item) => {
        const proportion = subTotal > 0 ? (item.lineTotal / subTotal) : 0;
        const itemDiscount = Number((couponDiscount * proportion).toFixed(2));
        const itemTax = Number((tax * proportion).toFixed(2));
        item.tax = itemTax;
        item.discount = itemDiscount;
        item.itemTotal = Number((item.lineTotal - itemDiscount + itemTax).toFixed(2));
    });

    return {
        subTotal,
        taxPercentage,
        tax,
        shippingCharge,
        couponDiscount,
        totalAmount,
        processedItems
    };
};

const fetchCheckoutService=async(productData,selectedCoupon,type,userId=null)=>{
    let itemsToProcess = Array.isArray(productData) ? [...productData] : [];

    if (itemsToProcess.length > 0) {
        const productIds = itemsToProcess.map(i => i.product || i._id).filter(Boolean);
        if (productIds.length > 0) {
            const dbProducts = await Product.find({ _id: { $in: productIds } }).select("price offer").lean();
            const dbProductMap = new Map(dbProducts.map(p => [p._id.toString(), p]));

            itemsToProcess = itemsToProcess.map(item => {
                const pId = (item.product || item._id)?.toString();
                const dbProd = dbProductMap.get(pId);
                const offer = (item.offer !== undefined && item.offer !== null && Number(item.offer) > 0)
                    ? Number(item.offer)
                    : (dbProd?.offer || 0);
                const price = Number(item.price) || Number(dbProd?.price) || 0;

                return {
                    ...item,
                    price,
                    offer
                };
            });
        }
    }

    const readyCoupon = await findCoupon(selectedCoupon, userId);
    const pricing = calculateOrderPricing(itemsToProcess, readyCoupon);

    return {
        subTotal: pricing.subTotal,
        taxPercentage: pricing.taxPercentage,
        tax: pricing.tax,
        totalAmount: pricing.totalAmount,
        shippingCharge: pricing.shippingCharge,
        couponDiscount: pricing.couponDiscount,
        couponId: readyCoupon ? readyCoupon._id : null,
        couponCode: readyCoupon ? readyCoupon.code : null,
        items: pricing.processedItems,
        type: type || "single"
    };
}



const placeOrderService=async(orderData)=>{
    const {productData,payment,address,coupon,userId,type}=orderData

    console.log("DDD",productData)

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
        throw new Error("Please select a payment method")
    }
    const paymentMethod = payment.trim().toUpperCase();
    if(!["CASHONDELIVERY","RAZORPAY","WALLET"].includes(paymentMethod)){
        throw new Error("Please select a valid payment method")
    }
    if(!productData || !Array.isArray(productData) || productData.length === 0){
        throw new Error("Please select order products")
    }

    const inActiveProducts = await Product.find({
        _id: { $in: productData.map(item => item.product || item._id).filter(Boolean) },
        status: "InActive"
    });

    if (inActiveProducts.length > 0) {
        throw new Error("This order contains inactive products");
    }

    let couponObject = null;
    if (coupon) {
        couponObject = await findCoupon(coupon, userId);
        if (!couponObject) {
            throw new Error("Coupon is unavailable or invalid");
        }
    }

    let itemsToProcess = Array.isArray(productData) ? [...productData] : [];
    if (itemsToProcess.length > 0) {
        const productIds = itemsToProcess.map(i => i.product || i._id).filter(Boolean);
        if (productIds.length > 0) {
            const dbProducts = await Product.find({ _id: { $in: productIds } }).select("price offer").lean();
            const dbProductMap = new Map(dbProducts.map(p => [p._id.toString(), p]));

            itemsToProcess = itemsToProcess.map(item => {
                const pId = (item.product || item._id)?.toString();
                const dbProd = dbProductMap.get(pId);
                const offer = (item.offer !== undefined && item.offer !== null && Number(item.offer) > 0)
                    ? Number(item.offer)
                    : (dbProd?.offer || 0);
                const price = Number(item.price) || Number(dbProd?.price) || 0;

                return {
                    ...item,
                    price,
                    offer
                };
            });
        }
    }

    const pricing = calculateOrderPricing(itemsToProcess, couponObject);

    // Verify wallet balance upfront before altering inventory
    let userWallet = null;
    if (paymentMethod === "WALLET") {
        userWallet = await Wallet.findOne({ user: userId });
        if (!userWallet || userWallet.balance < pricing.totalAmount) {
            throw new Error("Insufficient wallet balance");
        }
    }

    const orderItems = [];

    // Check and deduct inventory exactly once
    for (const item of pricing.processedItems) {
        const productId = item.product || item._id;
        const productName = item.productName || item.name;
        const productImage = item.image || item.img;

        const product = await Product.findOne({ _id: productId });
        if (!product) {
            throw new Error(`Product not found: ${productName || productId}`);
        }

        const itemVariant = await Variant.findOne({ 
            _id: { $in: product.vartiant }, 
            colour: item.colour 
        });

        if (!itemVariant) {
            throw new Error(`Product variant not found for ${productName || 'Product'} (${item.colour})`);
        }

        const itemSize = Number(item.size);
        const itemQuantity = Number(item.quantity) || 1;

        if (paymentMethod === "CASHONDELIVERY" || paymentMethod === "WALLET") {
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
                throw new Error(`${productName || 'Product'} is out of stock for size ${item.size}`);
            }
        } else {
            // For RAZORPAY (pending payment), verify stock availability without deducting yet
            const invItem = itemVariant.inventory?.find(i => Number(i.size) === itemSize);
            if (!invItem || invItem.quantity < itemQuantity) {
                throw new Error(`${productName || 'Product'} is out of stock for size ${item.size}`);
            }
        }

        orderItems.push({
            product: productId,
            productName: productName,
            variant: itemVariant ? itemVariant._id : null,
            colour: item.colour,
            image: productImage,
            size: item.size,
            price: item.effectivePrice,
            itemTotal: item.itemTotal,
            quantity: itemQuantity,
            status: (paymentMethod === "WALLET" || paymentMethod === "CASHONDELIVERY") ? "PLACED" : "PENDING",
        });
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


    // Razorpay order creation
    let razorpayOrder = null;
    if (paymentMethod === "RAZORPAY") {
        const options = {
            amount: Math.round(pricing.totalAmount * 100), 
            currency: "INR",
            receipt: orderId,
        };
        
        try {
            const rzp = getRazorpayInstance();
            razorpayOrder = await rzp.orders.create(options);
        } catch (error) {
            console.error("Razorpay API Error Details:", error);
            throw new Error(error?.error?.description || error?.message || "Payment Failed");
        }
    }

    const orderedData = {
        orderId: orderId,
        user: user._id,
        customerSnapshot: {
            name: user.name,
            email: user.email
        },
        items: orderItems,
        shippingAddress: shippingAddress,
        payment: {
            method: paymentMethod,
            status: paymentMethod === "WALLET" ? "PAID" : "PENDING",
            razorpayOrderId: razorpayOrder ? razorpayOrder.id : undefined
        },
        appliedCoupon: couponObject ? {
            coupon: couponObject._id,
            code: couponObject.code,
            discountPercentage: couponObject.discountValue || 0,
            discountAmount: pricing.couponDiscount
        } : undefined,
        pricing: {
            subTotal: pricing.subTotal,
            tax: pricing.tax,
            taxPercentage: pricing.taxPercentage,
            shippingCharge: pricing.shippingCharge,
            discount: pricing.couponDiscount,
            totalAmount: pricing.totalAmount
        },
        orderStatus: (paymentMethod === "WALLET" || paymentMethod === "CASHONDELIVERY") ? "PLACED" : "PENDING"
    };

    // Deduct wallet if wallet payment
    if (paymentMethod === "WALLET" && userWallet) {
        userWallet.balance = Number((userWallet.balance - pricing.totalAmount).toFixed(2));
        await userWallet.save();

        await WalletTransaction.create({
            wallet: userWallet._id,
            user: user._id,
            type: "DEBIT",
            source: "ORDER_PAYMENT",
            amount: pricing.totalAmount,
            description: `Payment for order ${orderId}`,
            referenceId: orderId
        });
    }

    const newOrder = await Order.create(orderedData);

    // If coupon used in COD/WALLET (order placed immediately), update coupon
    if (couponObject && (paymentMethod === "CASHONDELIVERY" || paymentMethod === "WALLET")) {
        const uId = userId?._id || userId;
        const exists = couponObject.usedBy?.some(u => u?.toString() === uId?.toString());
        if (!exists) {
            await Coupon.updateOne(
                { _id: couponObject._id },
                { 
                    $inc: { usedCount: 1 },
                    $push: { usedBy: uId }
                }
            );
            const updatedCoupon = await Coupon.findById(couponObject._id);
            if (updatedCoupon && updatedCoupon.usageCount && updatedCoupon.usedCount >= updatedCoupon.usageCount) {
                await Coupon.deleteOne({ _id: couponObject._id });
            }
        }
    }



if(type=="cart"){
    const cart=await Cart.findOne({user:user._id})
    if (cart) {
        cart.items=[]
        await cart.save()
    }
}



const orderDetails={
    orderId:orderId,
    estimatedDelivery:formattedDate,
    razorpayOrder:razorpayOrder,
    razorpayKeyId: getRazorpayCredentials().key_id,
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



const restoreItemStock = async (item) => {
    try {
        const itemSize = Number(item.size);
        const itemQuantity = Number(item.quantity) || 1;

        if (item.variant) {
            await Variant.findOneAndUpdate(
                {
                    _id: item.variant,
                    "inventory.size": itemSize
                },
                {
                    $inc: { "inventory.$.quantity": itemQuantity }
                }
            );
        } else if (item.product) {
            const product = await Product.findById(item.product);
            if (product && product.vartiant) {
                await Variant.findOneAndUpdate(
                    {
                        _id: { $in: product.vartiant },
                        colour: item.colour,
                        "inventory.size": itemSize
                    },
                    {
                        $inc: { "inventory.$.quantity": itemQuantity }
                    }
                );
            }
        }
    } catch (err) {
        console.error("Error restoring stock for item:", item.productName || item._id, err);
    }
};

const getItemReturnRefundAmount = (order, item) => {
    const subTotal = Number(order.pricing?.subTotal) || 0;
    const totalCouponDiscount = Number(order.pricing?.discount) || 0;
    const totalTax = Number(order.pricing?.tax) || 0;
    const lineTotal = Number(item.price) * (Number(item.quantity) || 1);

    if (subTotal > 0) {
        const proportion = lineTotal / subTotal;
        const itemCouponDiscount = totalCouponDiscount * proportion;
        const itemTax = totalTax * proportion;
        // item price + distributed tax - distributed coupon discount (shipping charge excluded)
        const netAmount = Math.max(0, lineTotal - itemCouponDiscount + itemTax);
        return Number(netAmount.toFixed(2));
    }

    if (item.itemTotal && Number(item.itemTotal) > 0) {
        return Number(Number(item.itemTotal).toFixed(2));
    }

    return Number(lineTotal.toFixed(2));
};

const checkAndSyncOrderStatus = (order) => {
    if (!order.items || order.items.length === 0) return;

    // Case 3: if all items are "CANCELLED", the order status must be "CANCELLED"
    const allCancelled = order.items.every(item => item.status === "CANCELLED");
    if (allCancelled) {
        order.orderStatus = "CANCELLED";
        if (!order.cancellation) order.cancellation = {};
        if (!order.cancellation.at) order.cancellation.at = new Date();
        return;
    }

    // Case 2: if all items are "RETURNED", the order status must be "RETURNED"
    const allReturned = order.items.every(item => item.status === "RETURNED");
    const allRemainingReturned = order.items.every(item => item.status === "RETURNED" || item.status === "CANCELLED") && order.items.some(item => item.status === "RETURNED");
    if (allReturned || allRemainingReturned) {
        order.orderStatus = "RETURNED";
        if (!order.returnInfo) order.returnInfo = {};
        if (!order.returnInfo.returnedAt) order.returnInfo.returnedAt = new Date();
        return;
    }

    // Case 1: if all items are "DELIVERED", the order status must be "DELIVERED"
    const allDelivered = order.items.every(item => item.status === "DELIVERED");
    const allRemainingDelivered = order.items.every(item => item.status === "DELIVERED" || item.status === "CANCELLED") && order.items.some(item => item.status === "DELIVERED");
    if (allDelivered || allRemainingDelivered) {
        order.orderStatus = "DELIVERED";
        if (!order.deliveredAt) order.deliveredAt = new Date();
        return;
    }

    const allShipped = order.items.every(item => item.status === "SHIPPED" || item.status === "CANCELLED") && order.items.some(item => item.status === "SHIPPED");
    if (allShipped && order.orderStatus === "PLACED") {
        order.orderStatus = "SHIPPED";
        return;
    }

    const allOutOfDelivery = order.items.every(item => item.status === "OUT_OF_DELIVERY" || item.status === "CANCELLED") && order.items.some(item => item.status === "OUT_OF_DELIVERY");
    if (allOutOfDelivery && ["PLACED", "SHIPPED"].includes(order.orderStatus)) {
        order.orderStatus = "OUT_OF_DELIVERY";
        return;
    }
};

const toggleStatusService = async (params, body) => {
    const orderId = params.id;
    const status = body?.status?.trim();
    const reason = (body?.reason || "").trim();

    console.log(body, params);

    if (!orderId) {
        throw new Error("OrderId is not passed");
    }
    if (!status) {
        throw new Error("Status is not passed");
    }

    const order = await Order.findOne({ _id: orderId });

    if (!order) {
        throw new Error("Order is not found");
    }

    const currentStatus = order.orderStatus;

    if (["DELIVERED", "RETURNED", "CANCELLED", "RETURN_REJECTED"].includes(currentStatus)) {
        throw new Error(`Order is already in ${currentStatus} state. Status cannot be changed.`);
    }

    if (currentStatus === "PLACED") {
        if (!["SHIPPED", "CANCELLED"].includes(status)) {
            throw new Error("Invalid status transition. From PLACED, you can only change to SHIPPED or CANCELLED.");
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

    const date = new Date();

    if (status === "CANCELLED") {
        if (!reason || reason.length < 8) {
            throw new Error("Cancellation reason must be at least 8 characters");
        }

        order.cancellation = order.cancellation || {};
        order.cancellation.reason = reason;
        order.cancellation.at = date;
        order.cancellation = order.cancellation || {};
        order.cancellation.reason = reason;
        order.cancellation.at = date;
        order.cancellation.by = "ADMIN";

        const cleanMethod = (order.payment?.method || "").replace(/[^a-zA-Z]/g, "").toUpperCase();
        const isCashOnDelivery = cleanMethod === "CASHONDELIVERY" || cleanMethod === "COD";
        const isPrepaidOrWallet = cleanMethod === "RAZORPAY" || cleanMethod === "WALLET";
        const isPaid = order.payment?.status === "PAID";

        // Reupdate stock while cancelling items
        for (const item of order.items) {
            if (item.status !== "CANCELLED") {
                await restoreItemStock(item);
                item.status = "CANCELLED";
                item.cancellation = { reason, at: date, by: "ADMIN" };
                item.refundStatus = (isPrepaidOrWallet && isPaid) ? "REFUNDED" : "NONE";
                if (isPrepaidOrWallet && isPaid) {
                    item.refundedAmount = (item.itemTotal !== undefined && Number(item.itemTotal) > 0)
                        ? Number(item.itemTotal)
                        : getItemReturnRefundAmount(order, item);
                } else {
                    item.refundedAmount = 0;
                }
            }
        }

        // Refund if Razorpay or Wallet and order is paid
        if (isPrepaidOrWallet && isPaid) {
            const alreadyRefunded = Number(order.payment?.refundedAmount) || 0;
            const refundAmount = Math.max(0, Number((order.pricing.totalAmount - alreadyRefunded).toFixed(2)));
            if (refundAmount > 0) {
                await processWalletTransactionService({
                    userId: order.user,
                    amount: refundAmount,
                    type: "CREDIT",
                    source: "ORDER_REFUND",
                    orderId: order._id,
                    description: `Refund for cancelled order ${order.orderId}`
                });
                order.payment.refundedAmount = Number((alreadyRefunded + refundAmount).toFixed(2));
                order.payment.status = "REFUNDED";
                order.refundStatus = "REFUNDED";
            }
        } else {
            // CASH_ON_DELIVERY or unpaid: no refund
            order.refundStatus = "NONE";
            order.payment.refundedAmount = 0;
        }
        order.orderStatus = "CANCELLED";
    }
    else if (status === "RETURN_REJECTED") {
        if (!reason || reason.length < 8) {
            throw new Error("Rejection reason must be at least 8 characters");
        }

        order.returnInfo = order.returnInfo || {};
        order.returnInfo.rejectionReason = reason;
        order.returnInfo.rejectedAt = date;

        const requestedItems = order.items.filter(item => item.status === "RETURN_REQUESTED");
        requestedItems.forEach(item => {
            item.status = "RETURN_REJECTED";
            item.returnInfo = item.returnInfo || {};
            item.returnInfo.rejectionReason = reason;
            item.returnInfo.rejectedAt = date;
        });
        order.orderStatus = "RETURN_REJECTED";
    }
    else if (status === "RETURN_APPROVED") {
        order.returnInfo = order.returnInfo || {};
        order.returnInfo.approvedAt = date;

        const requestedItems = order.items.filter(item => item.status === "RETURN_REQUESTED");
        requestedItems.forEach(item => {
            item.status = "RETURN_APPROVED";
            item.returnInfo = item.returnInfo || {};
            item.returnInfo.approvedAt = date;
        });
        order.orderStatus = "RETURN_APPROVED";
        // NOTE: Refund only after the status "RETURNED"!
    }
    else if (status === "RETURNED") {
        order.returnInfo = order.returnInfo || {};
        order.returnInfo.returnedAt = date;

        let returnItems = order.items.filter(item => item.status === "RETURN_APPROVED");
        if (returnItems.length === 0 && currentStatus === "RETURN_APPROVED") {
            returnItems = order.items.filter(item => item.status !== "CANCELLED" && item.status !== "RETURNED");
        }

        let totalReturnRefund = 0;
        for (const item of returnItems) {
            item.status = "RETURNED";
            item.returnInfo = item.returnInfo || {};
            item.returnInfo.returnedAt = date;

            // Re-update stock after "RETURNED"
            await restoreItemStock(item);

            // Refund price: All item price + distributed tax amount (without shipping charge and without coupon discount)
            if (item.refundStatus !== "REFUNDED") {
                const itemRefund = getItemReturnRefundAmount(order, item);
                totalReturnRefund += itemRefund;
                item.refundStatus = "REFUNDED";
                item.refundedAmount = itemRefund;
            }
        }

        totalReturnRefund = Number(totalReturnRefund.toFixed(2));
        if (totalReturnRefund > 0) {
            await processWalletTransactionService({
                userId: order.user,
                amount: totalReturnRefund,
                type: "CREDIT",
                source: "ORDER_RETURN",
                orderId: order._id,
                description: `Refund for returned order ${order.orderId}`
            });

            const alreadyRefunded = Number(order.payment?.refundedAmount) || 0;
            order.payment.refundedAmount = Number((alreadyRefunded + totalReturnRefund).toFixed(2));
            const maxRefundable = order.pricing.totalAmount - (order.pricing.shippingCharge || 0);
            order.payment.status = order.payment.refundedAmount >= maxRefundable ? "REFUNDED" : "PARTIALLY_REFUNDED";
            order.refundStatus = "REFUNDED";
        }

        order.orderStatus = "RETURNED";
    }
    else {
        order.orderStatus = status;
        if (status === "DELIVERED") {
            order.deliveredAt = date;
        }

        const items = order.items.filter(item =>
            !["RETURNED", "RETURN_REQUESTED", "RETURN_REJECTED", "CANCELLED", "RETURN_APPROVED"].includes(item.status)
        );

        items.forEach(item => {
            item.status = status;
            if (!item.statusTimeline) item.statusTimeline = [];
            item.statusTimeline.push({ status, at: date });
        });
    }

    checkAndSyncOrderStatus(order);
    await order.save();

    return {
        success: true
    };
};

const cancelOrderService = async (params, body) => {
    const orderId = params.orderId;
    const reason = (body?.reason || params?.reason || "").trim();

    if (!orderId) {
        throw new Error("Order Id is not passed");
    }
    if (!reason) {
        throw new Error("Reason is not passed");
    }

    const order = await Order.findOne({ _id: orderId });
    if (!order) {
        throw new Error("Order is not found");
    }

    const allowedStatusesForCancellation = ["PLACED", "SHIPPED", "OUT_OF_DELIVERY"];
    if (!allowedStatusesForCancellation.includes(order.orderStatus)) {
        throw new Error("Order cancellation is not allowed in this state");
    }

    if (order.orderStatus === "PENDING") {
        throw new Error("Order is not placed");
    }
    if (order.orderStatus === "DELIVERED" || order.orderStatus === "RETURNED") {
        throw new Error("This Order is already delivered or returned");
    }
    if (order.orderStatus === "CANCELLED") {
        throw new Error("This Order is already cancelled");
    }

    const date = new Date();

    const cleanMethod = (order.payment?.method || "").replace(/[^a-zA-Z]/g, "").toUpperCase();
    const isCashOnDelivery = cleanMethod === "CASHONDELIVERY" || cleanMethod === "COD";
    const isPrepaidOrWallet = cleanMethod === "RAZORPAY" || cleanMethod === "WALLET";
    const isPaid = order.payment?.status === "PAID";

    // Reupdate stock while cancelling items or order
    for (const item of order.items) {
        if (item.status !== "CANCELLED") {
            await restoreItemStock(item);
            item.status = "CANCELLED";
            item.cancellation = { reason, at: date, by: "USER" };
            item.refundStatus = (isPrepaidOrWallet && isPaid) ? "REFUNDED" : "NONE";
            if (isPrepaidOrWallet && isPaid) {
                item.refundedAmount = (item.itemTotal !== undefined && Number(item.itemTotal) > 0)
                    ? Number(item.itemTotal)
                    : getItemReturnRefundAmount(order, item);
            } else {
                item.refundedAmount = 0;
            }
        }
    }

    // If Razorpay or Wallet, refund fullAmount to wallet
    if (isPrepaidOrWallet && isPaid) {
        const alreadyRefunded = Number(order.payment?.refundedAmount) || 0;
        const refundAmount = Math.max(0, Number((order.pricing.totalAmount - alreadyRefunded).toFixed(2)));
        if (refundAmount > 0) {
            await processWalletTransactionService({
                userId: order.user,
                amount: refundAmount,
                type: "CREDIT",
                source: "ORDER_REFUND",
                orderId: order._id,
                description: `Refund for cancelled order ${order.orderId}`
            });
            order.payment.refundedAmount = Number((alreadyRefunded + refundAmount).toFixed(2));
            order.payment.status = "REFUNDED";
            order.refundStatus = "REFUNDED";
        }
    } else {
        // CASH_ON_DELIVERY or unpaid: no refund
        order.refundStatus = "NONE";
        order.payment.refundedAmount = 0;
    }

    order.orderStatus = "CANCELLED";
    order.cancellation = { reason, at: date, by: "USER" };

    await order.save();

    return {
        success: true
    };
};

const cancelProductService = async (params, body) => {
    const orderId = params.orderId;
    const productId = params.productId;
    const reason = (body?.reason || params?.reason || "").trim();

    if (!orderId) {
        throw new Error("OrderId is not passed");
    }
    if (!productId) {
        throw new Error("ProductId is not passed");
    }
    if (!reason) {
        throw new Error("Reason is not passed");
    }

    const order = await Order.findOne({ _id: orderId });
    if (!order) {
        throw new Error("Order is not found");
    }

    if (order.orderStatus === "PENDING") {
        throw new Error("Order is not placed");
    }

    if (["DELIVERED", "RETURNED", "RETURN_APPROVED", "RETURN_REQUESTED"].includes(order.orderStatus)) {
        throw new Error("Product cancellation is not allowed in this order state");
    }

    const item = order.items.find(item => 
        item.product?.toString() === productId?.toString() || item._id?.toString() === productId?.toString()
    );

    if (!item) {
        throw new Error("Item not found in this order");
    }

    const allowedStatusesForCancellation = ["PLACED", "SHIPPED", "OUT_OF_DELIVERY"];
    if (!allowedStatusesForCancellation.includes(item.status) || item.status === "RETURN_APPROVED") {
        throw new Error("Cancellation is not allowed for this item status");
    }

    if (item.status === "CANCELLED") {
        throw new Error("This Item is already cancelled");
    }

    const date = new Date();

    // Reupdate stock while cancelling items
    await restoreItemStock(item);

    const cleanMethod = (order.payment?.method || "").replace(/[^a-zA-Z]/g, "").toUpperCase();
    const isCashOnDelivery = cleanMethod === "CASHONDELIVERY" || cleanMethod === "COD";
    const isPrepaidOrWallet = cleanMethod === "RAZORPAY" || cleanMethod === "WALLET";
    const isPaid = order.payment?.status === "PAID";

    // If Razorpay or Wallet, refund to wallet
    if (isPrepaidOrWallet && isPaid && item.refundStatus !== "REFUNDED") {
        const alreadyRefunded = Number(order.payment?.refundedAmount) || 0;
        const remainingUnrefunded = Math.max(0, Number((order.pricing.totalAmount - alreadyRefunded).toFixed(2)));
        const otherActiveItems = order.items.filter(i => 
            i._id.toString() !== item._id.toString() && i.status !== "CANCELLED"
        );
        const itemTotal = (item.itemTotal !== undefined && Number(item.itemTotal) > 0) 
            ? Number(item.itemTotal) 
            : getItemReturnRefundAmount(order, item);
        const shippingCharge = Number(order.pricing?.shippingCharge) || 0;
        const finalWithShipping = Number((itemTotal + shippingCharge).toFixed(2));

        // Each item cancellation refunds that itemTotal, and if all items cancelled refund final itemTotal + shippingCharge
        const refundAmount = (otherActiveItems.length === 0) 
            ? (remainingUnrefunded > 0 ? remainingUnrefunded : finalWithShipping) 
            : Math.min(itemTotal, remainingUnrefunded);

        if (refundAmount > 0) {
            await processWalletTransactionService({
                userId: order.user,
                amount: refundAmount,
                type: "CREDIT",
                source: "ORDER_REFUND",
                orderId: order._id,
                description: `Refund for cancelled item: ${item.productName} (Order: ${order.orderId})`
            });
            item.refundStatus = "REFUNDED";
            item.refundedAmount = refundAmount;
            order.payment.refundedAmount = Number((alreadyRefunded + refundAmount).toFixed(2));
            order.payment.status = order.payment.refundedAmount >= order.pricing.totalAmount ? "REFUNDED" : "PARTIALLY_REFUNDED";
        }
    } else {
        // CASH_ON_DELIVERY or unpaid: no refund
        item.refundStatus = "NONE";
        item.refundedAmount = 0;
    }

    item.status = "CANCELLED";
    item.cancellation = { reason, at: date, by: "USER" };

    checkAndSyncOrderStatus(order);
    await order.save();

    return {
        success: true
    };
};

const returnOrderService = async (params, body) => {
    const orderId = params.orderId;
    const reason = (body?.reason || params?.reason || "").trim();

    if (!orderId) {
        throw new Error("Order Id is not passed");
    }
    if (!reason) {
        throw new Error("Reason is not passed");
    }

    const order = await Order.findOne({ _id: orderId });
    if (!order) {
        throw new Error("Order is not found");
    }

    if (order.orderStatus !== "DELIVERED") {
        throw new Error("Order must be delivered before requesting return");
    }

    if (["RETURN_REQUESTED", "RETURN_REJECTED", "RETURN_APPROVED", "RETURNED"].includes(order.orderStatus)) {
        throw new Error("This Order is already requested for return");
    }

    const date = new Date();
    const items = order.items?.filter(item => 
        !["RETURN_REQUESTED", "RETURN_APPROVED", "RETURNED", "CANCELLED"].includes(item.status)
    );

    items.forEach(item => {
        item.status = "RETURN_REQUESTED";
        item.returnInfo = item.returnInfo || {};
        item.returnInfo.reason = reason;
        item.returnInfo.requestedAt = date;
    });

    order.orderStatus = "RETURN_REQUESTED";
    order.returnInfo = { ...order.returnInfo, reason, requestedAt: date };

    // NOTE: Refund only after the status "RETURNED" (by Admin)
    checkAndSyncOrderStatus(order);
    await order.save();

    return {
        success: true
    };
};

const returnProductService = async (params, body) => {
    const orderId = params.orderId;
    const productId = params.productId;
    const reason = (body?.reason || params?.reason || "").trim();

    if (!orderId) {
        throw new Error("OrderId is not passed");
    }
    if (!productId) {
        throw new Error("ProductId is not passed");
    }
    if (!reason) {
        throw new Error("Reason is not passed");
    }

    const order = await Order.findOne({ _id: orderId });
    if (!order) {
        throw new Error("Order is not found");
    }

    const item = order.items.find(item => 
        item.product?.toString() === productId?.toString() || item._id?.toString() === productId?.toString()
    );

    if (!item) {
        throw new Error("Item not found in this order");
    }

    if (["RETURN_REQUESTED", "RETURN_REJECTED", "RETURN_APPROVED", "RETURNED"].includes(item.status)) {
        throw new Error("This Item is already requested for return");
    }

    const date = new Date();
    item.status = "RETURN_REQUESTED";
    item.returnInfo = item.returnInfo || {};
    item.returnInfo.reason = reason;
    item.returnInfo.requestedAt = date;

    // NOTE: Refund only after the status "RETURNED" (by Admin)
    checkAndSyncOrderStatus(order);
    await order.save();

    return {
        success: true
    };
};

const toggleItemService = async (params, body) => {
    const orderId = params.orderId;
    const itemId = params.itemId;
    const status = body?.status?.trim();
    const reason = (body?.reason || "").trim();

    console.log(status, "STTU");

    if (!orderId) {
        throw new Error("OrderId is not passed");
    }
    if (!status) {
        throw new Error("Status is not passed");
    }

    const order = await Order.findOne({ _id: orderId });
    if (!order) {
        throw new Error("Order is not found");
    }

    const item = order.items.find(item => 
        item.product?.toString() === itemId.toString() || item._id?.toString() === itemId.toString()
    );

    if (!item) {
        throw new Error("Item is not found in this order");
    }

    const currentStatus = item.status;

    if (["DELIVERED", "RETURNED", "CANCELLED", "RETURN_REJECTED"].includes(currentStatus)) {
        throw new Error(`Item is already in ${currentStatus} state. Status cannot be changed.`);
    }

    if (currentStatus === "PLACED") {
        if (!["SHIPPED", "CANCELLED"].includes(status)) {
            throw new Error("Invalid status transition. From PLACED, you can only change to SHIPPED or CANCELLED.");
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

    const date = new Date();

    if (status === "CANCELLED") {
        if (!reason || reason.length < 8) {
            throw new Error("Cancellation reason must be at least 8 characters");
        }

        item.cancellation = item.cancellation || {};
        item.cancellation.reason = reason;
        item.cancellation.at = date;
        item.cancellation.by = "ADMIN";

        // Reupdate stock while cancelling items
        await restoreItemStock(item);

        const cleanMethod = (order.payment?.method || "").replace(/[^a-zA-Z]/g, "").toUpperCase();
        const isCashOnDelivery = cleanMethod === "CASHONDELIVERY" || cleanMethod === "COD";
        const isPrepaidOrWallet = cleanMethod === "RAZORPAY" || cleanMethod === "WALLET";
        const isPaid = order.payment?.status === "PAID";

        // If Razorpay or Wallet, refund to wallet
        if (isPrepaidOrWallet && isPaid && item.refundStatus !== "REFUNDED") {
            const alreadyRefunded = Number(order.payment?.refundedAmount) || 0;
            const remainingUnrefunded = Math.max(0, Number((order.pricing.totalAmount - alreadyRefunded).toFixed(2)));
            const otherActiveItems = order.items.filter(i => 
                i._id.toString() !== item._id.toString() && i.status !== "CANCELLED"
            );
            const itemTotal = (item.itemTotal !== undefined && Number(item.itemTotal) > 0) 
                ? Number(item.itemTotal) 
                : getItemReturnRefundAmount(order, item);
            const shippingCharge = Number(order.pricing?.shippingCharge) || 0;
            const finalWithShipping = Number((itemTotal + shippingCharge).toFixed(2));

            // Each item cancellation refunds that itemTotal, and if all items cancelled refund final itemTotal + shippingCharge
            const refundAmount = (otherActiveItems.length === 0) 
                ? (remainingUnrefunded > 0 ? remainingUnrefunded : finalWithShipping) 
                : Math.min(itemTotal, remainingUnrefunded);

            if (refundAmount > 0) {
                await processWalletTransactionService({
                    userId: order.user,
                    amount: refundAmount,
                    type: "CREDIT",
                    source: "ORDER_REFUND",
                    orderId: order._id,
                    description: `Refund for cancelled item: ${item.productName} (Order: ${order.orderId})`
                });
                item.refundStatus = "REFUNDED";
                item.refundedAmount = refundAmount;
                order.payment.refundedAmount = Number((alreadyRefunded + refundAmount).toFixed(2));
                order.payment.status = order.payment.refundedAmount >= order.pricing.totalAmount ? "REFUNDED" : "PARTIALLY_REFUNDED";
            }
        } else {
            // CASH_ON_DELIVERY or unpaid: no refund
            item.refundStatus = "NONE";
            item.refundedAmount = 0;
        }
    }
    else if (status === "RETURN_REJECTED") {
        if (!reason || reason.length < 8) {
            throw new Error("Rejection reason must be at least 8 characters");
        }
        item.returnInfo = item.returnInfo || {};
        item.returnInfo.rejectionReason = reason;
        item.returnInfo.rejectedAt = date;
    }
    else if (status === "RETURN_APPROVED") {
        item.returnInfo = item.returnInfo || {};
        item.returnInfo.approvedAt = date;
        // NOTE: Refund ONLY happens after the status is "RETURNED"!
    }
    else if (status === "RETURNED") {
        item.returnInfo = item.returnInfo || {};
        item.returnInfo.returnedAt = date;

        // Reupdate stock after "RETURNED"
        await restoreItemStock(item);

        // Single product refund: item price + distributed tax amount (without shipping charge and without coupon discount)
        if (item.refundStatus !== "REFUNDED") {
            const refundAmount = getItemReturnRefundAmount(order, item);
            if (refundAmount > 0) {
                await processWalletTransactionService({
                    userId: order.user,
                    amount: refundAmount,
                    type: "CREDIT",
                    source: "ORDER_RETURN",
                    orderId: order._id,
                    description: `Refund for returned item: ${item.productName} (Order: ${order.orderId})`
                });
                item.refundStatus = "REFUNDED";
                item.refundedAmount = refundAmount;

                const alreadyRefunded = Number(order.payment?.refundedAmount) || 0;
                order.payment.refundedAmount = Number((alreadyRefunded + refundAmount).toFixed(2));
                const maxRefundable = order.pricing.totalAmount - (order.pricing.shippingCharge || 0);
                order.payment.status = order.payment.refundedAmount >= maxRefundable ? "REFUNDED" : "PARTIALLY_REFUNDED";
            }
        }
    }

    item.status = status;
    if (!item.statusTimeline) item.statusTimeline = [];
    item.statusTimeline.push({ status, at: date });

    checkAndSyncOrderStatus(order);
    await order.save();

    return {
        success: true
    };
};




const verifyPaymentService = async (body) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body;

    console.log("OOORR", orderId);

    if (!orderId) {
        throw new Error("Order ID is required");
    }

    const { key_secret } = getRazorpayCredentials();
    const hmac = nodeCrypto.createHmac("sha256", key_secret);
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

    // Decrement inventory for all items in order since payment is verified and order is placed
    for (const item of (order.items || [])) {
        const itemSize = Number(item.size);
        const itemQuantity = Number(item.quantity) || 1;
        await Variant.findOneAndUpdate(
            {
                _id: item.variant,
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
    }

    // Update coupon if order has applied coupon
    if (order.appliedCoupon && order.appliedCoupon.coupon) {
        const cpn = await Coupon.findById(order.appliedCoupon.coupon);
        if (cpn && !cpn.usedBy?.some(u => u?.toString() === order.user?.toString())) {
            await Coupon.updateOne(
                { _id: order.appliedCoupon.coupon },
                {
                    $inc: { usedCount: 1 },
                    $push: { usedBy: order.user }
                }
            );
            const updatedCoupon = await Coupon.findById(order.appliedCoupon.coupon);
            if (updatedCoupon && updatedCoupon.usageCount && updatedCoupon.usedCount >= updatedCoupon.usageCount) {
                await Coupon.deleteOne({ _id: order.appliedCoupon.coupon });
            }
        }
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

    const rzp = getRazorpayInstance();
    const razorpayOrder = await rzp.orders.create(options);

    return {
        razorpayOrder,
        razorpayKeyId: getRazorpayCredentials().key_id,
        _id: order._id,
        orderId: order.orderId,
        customerSnapshot: order.customerSnapshot,
        shippingAddress: order.shippingAddress
    };
};

module.exports={fetchCheckoutService,placeOrderService,getOrderService,trackOrderService,orderDetailsService,toggleStatusService,cancelOrderService,cancelProductService,toggleItemService,returnOrderService,returnProductService,verifyPaymentService,retryPaymentService}