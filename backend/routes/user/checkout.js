const express=require("express")
const router=express.Router()
const {fetchCheckout,placeOrder}=require("../../controllers/user/checkout")

router.get("/fetchCheckout/",fetchCheckout)
router.post("/placeOrder",placeOrder)
module.exports=router