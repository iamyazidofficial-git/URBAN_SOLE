/***************************************IMPORTS*****************************************/

const Category = require("../models/category")
const Product=require("../models/product")

/*--------------------------------ADD CATEGORY---------------------------------*/

const addCategoryService = async (categoryData) => {
  const { name, description, offer, offerExpiry, status } = categoryData

  /*******************Validations*******************/

  const cleanName = name?.trim()
  const cleanDescription = description?.trim()

  if (!cleanName || cleanName == "") {
    throw new Error("Name is required")
  }
  if ((cleanName.match(/[a-zA-Z]/g) || []).length < 4) {
    throw new Error("Name must contain at least 4 Charecters")
  }

  if (!/^[a-zA-Z ]+$/.test(cleanName)) {
    throw new Error("Name must contains only letters")
  }
  if (cleanDescription?.length > 200) {
    throw new Error("Description must below 100 words")
  }
  if (offer && !/^\s*\d+\s*$/.test(offer)) {
    throw new Error("Offer must be a number")
  }
  if (offer && (Number(offer) < 10 || Number(offer) > 90)) {
    throw newError("Offer Minimum 10 and Maximum 90")
  }
  if (offer && !offerExpiry) {
    throw new Error("Select a Expiry Date")
  }

const existingCategory = await Category.findOne({ 
    name: { $regex: `^${name.trim()}$`, $options: "i" } 
})
  if (existingCategory) {
    throw new Error("Category Allready exists")
  }

   /*******************Main Part*******************/

  const newCategory = await Category.create({
    name: name,
    description: cleanDescription || "",
    offer:offer || 0,
    offerExpiry: offerExpiry ? new Date(offerExpiry) : null,
    status:status
  })

  return {
    success: true,
    message: "Category Added Successfully",
  }
}




/*--------------------------------GET CATEGORY---------------------------------*/

const getCategoryService = async (query) => {
    const search=query.search
    const page=Math.max(parseInt(query.page)||1,1)
    const limit=Math.max(parseInt(query.limit)||8,1)
    const skip=(page-1)*limit

   let findQuery = {isDeleted:false}

if (search) {
    findQuery.$or = [{
        name: {
            $regex: search,
            $options: "i"
        }
    }]
}

  /*******************Main Part*******************/

  const totalCategories=await Category.countDocuments(findQuery)
  const totalPages = Math.ceil(totalCategories / limit)
  const categories = await Category.find(findQuery).sort({createdAt:-1}).skip(skip).limit(limit)

  if (!categories) {
    throw new Error("Failed to fetch customers")
  }

   const categoryData = await Promise.all(
    categories.map(async (item) => {
      const totalProducts = await Product.countDocuments({
        category: item._id
      });

      return {
        ...item.toObject(),
        totalProducts
      };
    })
  )

  return {
    success: true,
    message: "Customers Fetched Successfully",
    data: categoryData,
    totalPages:totalPages,
    totalCategories:totalCategories
  }
}




/*--------------------------------EDIT CATEGORY---------------------------------*/

const editCategoryService = async (categoryData,params) => {
  const categoryId = params?._id

  const { name, description, offer, offerExpiry, status } = categoryData

    /*******************Validations*******************/

  const cleanName = name?.trim()
  const cleanDescription = description?.trim()

  if (!cleanName || cleanName == "") {
    throw new Error("Name is required")
  }
  if ((cleanName.match(/[a-zA-Z]/g) || []).length < 4) {
    throw new Error("Name must contain at least 4 Charecters")
  }

  if (!/^[a-zA-Z ]+$/.test(cleanName)) {
    throw new Error("Name must contains only letters")
  }
  if (cleanDescription?.length > 200) {
    throw new Error("Description must below 100 words")
  }
  if (offer && !/^\s*\d+\s*$/.test(offer)) {
    throw new Error("Offer must be a number")
  }
  if (offer && (Number(offer) < 10 || Number(offer) > 90)) {
    throw newError("Offer Minimum 10 and Maximum 90")
  }
  if (offer && !offerExpiry) {
    throw new Error("Select a Expiry Date")
  }

const existingCategory = await Category.findOne({ 
    _id: { $ne: categoryId }, 
    name: { $regex: `^${cleanName}$`, $options: "i" } 
})

  if(existingCategory){
    throw new Error("Category Allready exists")
  }

    /*******************Main Part******************/

  const editedCategory=await Category.updateOne({_id:categoryId},{$set:{
     name: cleanName,
    description: cleanDescription || "",
    offer: offer || 0,
    offerExpiry: offerExpiry ? new Date(offerExpiry) : null,
    status,status
  }})

  return{
    success:true,
    message:"Category updated successfully"
  }
}





/*--------------------------------TOGGLE---------------------------------*/

const toggleStatusService=async(params)=>{

    /*******************Validations*******************/


    const categoryId=params.id
    console.log("CCC",categoryId)
     if(!categoryId){
        throw new Error("Category id not passed")
    }
    const existingCategory=await Category.findOne({_id:categoryId})
    if(!existingCategory){
        throw new Error("Category not exists")
    }

      /*******************Main Part*******************/

    if(existingCategory.status=="Active"){
        existingCategory.status="InActive"
        await existingCategory.save()
        await Product.updateMany({category:existingCategory._id},{$set:{status:"InActive"}})
    }
    else{
        existingCategory.status="Active"
    }

    await existingCategory.save()

    return{
        success:true,
        message:"Toggled user successfully"
    }
}





/*----------------------------DELETE CATEGORY--------------------------------*/

const deleteCategoryService=async (params)=>{

    /*******************Validations*******************/

    const categoryId=params.id

    if(!categoryId){
        throw new Error("Category id not passed")
    }
    const existingCategory=await Category.findOne({_id:categoryId})
    if(!existingCategory){
        throw new Error("Category not exists")
    }

      /*******************Main Part*******************/

    existingCategory.isDeleted=true
    await Product.updateMany({category:categoryId},{$set:{isListed:false,status:"InActive"}})
    await existingCategory.save()
    return{
        success:true,
        message:"Category deleted Successfully"
    }
}


module.exports = {
  addCategoryService,
  getCategoryService,
  editCategoryService,
  toggleStatusService,
  deleteCategoryService
}
