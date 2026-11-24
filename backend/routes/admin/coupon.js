const express = require("express");
const router = express.Router();
const {
  addCoupon,
  getCoupon,
  editCoupon,
  deleteCoupon,
  toggleCouponStatus,
} = require("../../controllers/admin/coupon");

router.post("/addCoupon", addCoupon);
router.get("/getCoupon", getCoupon);
router.put("/editCoupon/:_id", editCoupon);
router.delete("/deleteCoupon/:_id", deleteCoupon);
router.patch("/toggleStatus/:_id", toggleCouponStatus);

module.exports = router;
