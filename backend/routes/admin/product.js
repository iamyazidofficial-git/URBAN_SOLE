const express = require("express")
const router = express.Router()
const upload = require("../../middleware/admin/upload")
const { addProductController, getProductController, getSingleProductController,editProductController ,toggleStatusController,deleteProductController} = require("../../controllers/admin/product")

router.post("/addProduct", upload.any(), addProductController)
router.get("/getProducts", getProductController)
router.get("/getProduct/:id", getSingleProductController)
router.put("/editProduct/:id", upload.any(), editProductController)
router.patch("/toggleStatus/:id", toggleStatusController)
router.patch("/deleteProduct/:id", deleteProductController)

module.exports = router