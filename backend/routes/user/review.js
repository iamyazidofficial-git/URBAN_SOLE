const express = require("express");
const router = express.Router();
const {addReview,getReview,getProductReview,deleteReview} = require("../../controllers/user/review")
const {userAuth}=require("../../middleware/user/auth")

router.post("/addReview",userAuth,addReview) 
router.get("/getReview",userAuth,getReview)
router.get("/getProductReview/:productId",userAuth,getProductReview)
router.delete("/deleteReview/:reviewId",userAuth,deleteReview)

module.exports = router