const {fetchCheckoutService,placeOrderService}=require("../../service/order")
const {getCouponService}=require("../../service/coupon")
const jwt=require("jsonwebtoken")

const fetchCheckout=async(req,res)=>{
    try{
        console.log("kkkkkkkkkkkkkkkk")
        const productData = req.query.productData ? JSON.parse(req.query.productData) : null;
        const selectedCoupon=req.query.selectedCoupon || ""
       const response=await fetchCheckoutService(productData,selectedCoupon)
       const coupons=await getCouponService("user",response?.totalAmount)

       
       return res.status(200).json({
        success:true,
        message:"Checkout fetched successfully",
        data:response,
        coupons:coupons
       })
    }catch(error){
        console.log("fetchCheckout:-",error)
        return res.status(400).json({
            success:false,
            message:"Failed to fetch checkout"
        })
    }
}


const placeOrder=async(req,res)=>{
    try{
        const token = req.headers.authorization.split(" ")[1];
        const user= jwt.verify(token, process.env.JWT_SECRET_KEY);

        
         if (!token) {
         return res.status(400).json({ success: false, message: "UnAuthorized" })
        }
        
        const userId=user._id

        req.body.userId=userId
    
        const response=await placeOrderService(req.body)

        return res.status(200).json({
            success:true,
            data:response
        })
    }catch(error){
        console.log(error)
        return res.status(400).json({
            success:false,
            message:error?.response?.message
        })
    }
}

module.exports={
    fetchCheckout,placeOrder
}