const express = require("express");
const router = express.Router();
const { addToCart, getCart, increaseQuantity, decreaseQuantity, deleteItem } = require("../../controllers/user/cart");

router.post("/addToCart", addToCart);
router.get("/getCart", getCart);
router.delete("/deleteItem/:_id", deleteItem); 
router.patch("/increaseQuantity/:_id", increaseQuantity);
router.patch("/decreaseQuantity/:_id", decreaseQuantity); 

module.exports = router;