const express=require("express")
const router=express.Router()
const {getOrder,trackOrder,cancelOrder,cancelProduct,returnOrder,returnProduct}=require("../../controllers/user/order")

router.get("/getOrder",getOrder)
router.get("/trackOrder/:orderId",trackOrder)
router.patch("/cancelOrder/:orderId/:reason",cancelOrder)
router.patch("/cancelProduct/:orderId/:productId/:reason",cancelProduct)
router.patch("/returnOrder/:orderId",returnOrder)
router.patch("/returnProduct/:orderId/:productId",returnProduct)

module.exports=router