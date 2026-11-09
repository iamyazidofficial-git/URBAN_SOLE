const express = require("express");
const router = express.Router();
const { 
    getWishlist, 
    addToWishlist, 
    removeFromWishlist 
} = require("../../controllers/user/wishlist");

router.get("/getWishlist", getWishlist);
router.post("/addToWishlist", addToWishlist); // ഇവിടെ /addToWishlist എന്ന് തന്നെയാണോ എന്ന് നോക്കുക
router.post("/removeFromWishlist", removeFromWishlist);

module.exports = router;