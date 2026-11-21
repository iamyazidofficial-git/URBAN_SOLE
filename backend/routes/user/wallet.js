const express = require("express");
const router = express.Router();
const authMiddleware= require("../../middleware/user/auth.js");
const auth = authMiddleware.userAuth 
const { getWalletDetails, getTransactions, createOrder, verifyTopup } =require("../../controllers/user/wallet.js")


router.get("/getWallet", auth, getWalletDetails);
router.get("/getTransactions", auth, getTransactions);
router.post("/createOrder", auth, createOrder); 
router.post("/verify-topup", auth, verifyTopup);

module.exports = router;