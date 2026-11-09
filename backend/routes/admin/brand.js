const express = require("express")
const router = express.Router()
const {addBrand,getBrand,editBrand,toggleStatus,deleteBrand} = require("../../controllers/admin/brand")

router.post("/addBrand", addBrand)
router.get("/getBrand", getBrand)
router.put("/editBrand/:_id", editBrand)
router.patch("/toggleStatus/:id", toggleStatus)
router.patch("/deleteBrand/:id", deleteBrand)

module.exports = router