/*******************************************IMPORTS***********************************************/

const {addCategoryService,getCategoryService,editCategoryService,toggleStatusService,deleteCategoryService}=require("../../service/category")

/*--------------------------------------ADD CATEGORY----------------------------------------*/

const addCategory=async (req,res)=>{
    try{
    
        const result=await addCategoryService(req.body)
        res.status(200).json({
            success:result.success,
            message:result.message
        })
        
    }catch(error){
        console.log("Add Category Controller:-",error?.message)
        res.status(400).json({
            success:false,
            message:error?.message||"Something went wrong"
        })
    }
}




/*--------------------------------------GET CATEGORY----------------------------------------*/

const getCategory=async(req,res)=>{

    try{
        const result=await getCategoryService(req.query)
        return res.status(200).json({
            success:true,
            message:"Categories Fetched Successfully",
            data:result.data,
            totalPages:result.totalPages,
            totalCategories:result.totalCategories
        })
    }catch(error){
        return res.status(400).json({
            success:false,
            message:error?.message||"Something went wrong"
        })
    }
}






/*--------------------------------------EDIT CATEGORY----------------------------------------*/

const editCategory=async(req,res)=>{

    try{
        const result=await editCategoryService(req.body,req.params)
        return res.status(200).json({
            success:result.success,
            message:result.message
        })

    }catch(error){
        console.log("EditCategoryController:-",error)
        res.status(400).json({
            success:false,
            message:error?.message||"Failed to edit"
        })
    }
}





/*--------------------------------------TOGGLE CATEGORY----------------------------------------*/

const toggleStatus=async(req,res)=>{
    try{
        const result=await toggleStatusService(req.params)
        return res.status(200).json({
            success:result?.success,
            message:result?.message
        })
    }catch(error){
        return res.status(400).json({
            success:false,
            message:error?.message||"Failed to toggle"
        })
    }
}





/*--------------------------------------DELETE CATEGORY----------------------------------------*/

const deleteCategory=async (req,res)=>{
    try{
        const result=await deleteCategoryService(req.params)
        
        return res.status(200).json({
            success:result.success,
            message:result.message
        })
    }catch(error){
        console.log("Delete Category",error?.message)
        return res.status(400).json({
            success:false,
            message:error?.message
        })
    }
}


module.exports={
    addCategory,
    getCategory,
    editCategory,
    toggleStatus,
    deleteCategory
}