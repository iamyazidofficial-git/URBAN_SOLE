const express = require("express")
const router = express.Router()

const {getOrder,orderDetails,toggleStatus,toggleItem}=require("../../controllers/admin/order")

router.get("/getOrder",getOrder)
router.get("/orderDetails/:id",orderDetails)
router.patch("/toggleStatus/:id",toggleStatus)
router.patch("/toggleItem/:orderId/:itemId",toggleItem)

module.exports = router