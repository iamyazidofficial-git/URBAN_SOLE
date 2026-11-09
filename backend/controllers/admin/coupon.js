const {addCouponService,getCouponService,editCouponService,deleteCouponService}=require("../../service/coupon")

const addCoupon=async (req,res)=>{
    try{
        const response=await addCouponService(req.body)
        return res.status(200).json({
            success:true,
            message:"Coupon addedd successfully"
        })
    }catch(error){
        console.log("Add coupon:-",error)
        return res.status(400).json({
            success:false,
            message:error?.message||"Something went wrong"
        })
    }
}

const getCoupon=async(req,res)=>{
    try{
        const response=await getCouponService("admin")
        return res.status(200).json({
            success:true,
            data:response,
            message:"Fetched succcessfully"
        })
    }catch(error){
        console.log("Get coupon:-",error)
       return res.status(200).json({
            success:true,
            message:error?.message
        })
    }
}

const editCoupon=async(req,res)=>{
    try{
        console.log("YYYYY",req.body)
        const response=await editCouponService(req.params?._id,req.body)
        return res.status(200).json({
            success:true,
            message:"Edit successfully"
        })
    }catch(error){
         console.log("Edit coupon:-",error)
       return res.status(200).json({
            success:false,
            message:error?.message||"Something went wrong"
        })
    }
}

const deleteCoupon=async(req,res)=>{
    try{
        const response=await deleteCouponService(req.params._id)
        return res.status(200).json({
            success:true,
            message:"Coupon Deleted successfully"
        })
    }catch(error){
        return res.status(400).json({
            success:false,
            message:error?.message||"Something went wrong"
        })
    }
}

module.exports={addCoupon,getCoupon,editCoupon,deleteCoupon}