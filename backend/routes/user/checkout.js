const express=require("express")
const router=express.Router()
const {fetchCheckout,placeOrder,verifyPayment,retryPayment}=require("../../controllers/user/checkout")

router.get("/fetchCheckout/",fetchCheckout)
router.post("/placeOrder",placeOrder)
router.post("/verify-payment", verifyPayment)
router.post("/retry-payment", retryPayment);
module.exports=router