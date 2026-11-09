const express=require("express")
const router=express.Router()

const {signup,login,forgottPassword,resetPassword, googleLogin}=require("../../controllers/user/auth")
const {verifyOTP, generateOTP}=require("../../controllers/user/OTP")
const { userAuth } = require("../../middleware/user/auth")

router.post("/signup",signup)
router.post("/login",login)
router.post("/generateOTP",generateOTP)
router.post("/verifyOTP",verifyOTP)
router.post("/forgottPassword",forgottPassword)
router.post("/resetPassword",resetPassword)
router.post("/google",googleLogin)

module.exports=router