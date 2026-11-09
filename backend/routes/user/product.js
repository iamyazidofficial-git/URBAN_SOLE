const express = require('express');
const router = express.Router();
const { 
  getProducts, 
  getSingleProduct
} = require('../../controllers/user/product');

router.get("/getProducts", getProducts);

router.get("/getProduct/:id", getSingleProduct);

module.exports = router;