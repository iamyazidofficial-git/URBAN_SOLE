const express=require("express")
const router=express.Router()
const {getAddresses,addAddress,editAddress,deleteAddress}=require("../../controllers/user/address")
const { userAuth } = require("../../middleware/user/auth")

router.get("/getAddresses",userAuth,getAddresses);
router.post("/addAddress",userAuth,addAddress);
router.put("/editAddress/:id",userAuth,editAddress);
router.delete("/deleteAddress/:id", userAuth, deleteAddress);

module.exports=router