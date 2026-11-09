const express = require("express")
const router = express.Router()
const {addCoupon,getCoupon,editCoupon,deleteCoupon}=require("../../controllers/admin/coupon")

router.post("/addCoupon",addCoupon)
router.get("/getCoupon",getCoupon)
router.put("/editCoupon/:_id",editCoupon)
router.delete("/deleteCoupon/:_id",deleteCoupon)

module.exports=router