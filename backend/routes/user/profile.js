const express=require("express")
const router=express.Router()
const { userAuth } = require("../../middleware/user/auth")
const upload = require("../../middleware/user/upload")

const {getUser, editUser}=require("../../controllers/user/profile")

router.get("/getUser",userAuth,getUser)
router.put("/editUser",userAuth,upload.single("profileImage"),editUser)

module.exports=router