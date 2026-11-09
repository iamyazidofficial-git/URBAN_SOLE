const { STATUS_CODES } = require("../../constants/statusCodes")
const {getOrderService,orderDetailsService,toggleStatusService,toggleItemService}=require("../../service/order")

const getOrder=async(req,res)=>{
    console.log("HELLO")
    try{
        const response=await getOrderService("admin","",req.query)
        return res.status(STATUS_CODES.OK).json({
            success:true,
            message:"Succesfully",
            data:response
        })

    }catch(error){
        console.log(error)
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success:false,
            message:error?.message||"Something went wrong"
        })
    }
}

const orderDetails=async(req,res)=>{
    try{
        const response=await orderDetailsService(req.params)
        return res.status(STATUS_CODES.OK).json({
            success:true,
            message:"Order details fetched",
            data:response
        })
    }catch(error){
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success:false,
            message:"Order details fetched failed"
        })
    }
}


const toggleStatus=async(req,res)=>{
    try{
         const response=await toggleStatusService(req.params,req.body)
        return res.status(STATUS_CODES.OK).json({
            success:true,
            message:"Order Status Changed"
        })
    }catch(error){
           return res.status(STATUS_CODES.BAD_REQUEST).json({
            success:false,
            message:error?.message||"Something went wrong"
        })
    }
}



const toggleItem=async(req,res)=>{
    try{

         const response=await toggleItemService(req.params,req.body)
        return res.status(STATUS_CODES.OK).json({
            success:true,
            message:"Item Status Changed"
        })
    }catch(error){
           return res.status(STATUS_CODES.BAD_REQUEST).json({
            success:false,
            message:error?.message||"Something went wrong"
        })
    }
}


module.exports={getOrder,orderDetails,toggleStatus,toggleItem}
