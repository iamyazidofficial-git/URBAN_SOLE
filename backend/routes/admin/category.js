const express=require("express")
const router=express.Router()
const {addCategory,getCategory,editCategory,toggleStatus,deleteCategory}=require("../../controllers/admin/category")

router.post("/addCategory",addCategory)
router.get("/getCategory",getCategory)
router.put("/editCategory/:_id",editCategory)
router.patch("/toggleStatus/:id",toggleStatus)
router.patch("/deleteCategory/:id",deleteCategory)

module.exports=router