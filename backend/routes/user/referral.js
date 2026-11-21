const express = require("express")
const router = express.Router()
const { getReferralDetails } = require("../../controllers/user/referral");
const { userAuth } = require("../../middleware/user/auth")

router.get("/getDetails", userAuth, getReferralDetails)

module.exports = router