/***************************************IMPORTS*****************************************/

const Brand = require("../models/brand")
const Product = require("../models/product")

/*--------------------------------ADD BRAND---------------------------------*/

const addBrandService = async (brandData) => {
  const { name, description, offer, offerExpiry, status } = brandData

    /*******************Validations*******************/

  const cleanName = name?.trim()
  const cleanDescription = description?.trim()

  if (!cleanName || cleanName === "") {
    throw new Error("Name is required")
  }
  if ((cleanName.match(/[a-zA-Z]/g) || []).length < 2) {
    throw new Error("Name must contain at least 2 characters")
  }
  if (!/^[a-zA-Z0-9 ]+$/.test(cleanName)) {
    throw new Error("Name must contain only letters, numbers, and spaces")
  }
  if (cleanDescription?.length > 200) {
    throw new Error("Description must be below 200 characters")
  }
  if (offer && !/^\s*\d+\s*$/.test(offer)) {
    throw new Error("Offer must be a number")
  }
  if (offer && (Number(offer) < 10 || Number(offer) > 90)) {
    throw new Error("Offer Minimum 10 and Maximum 90")
  }
  if (offer && !offerExpiry) {
    throw new Error("Select an Expiry Date")
  }

const existingBrand = await Brand.findOne({ 
    name: { $regex: new RegExp(`^${cleanName}$`, 'i') } 
})
  if (existingBrand) {
    throw new Error("Brand Already exists")
  }

    /*******************Main Part*******************/

  await Brand.create({
    name: cleanName,
    description: cleanDescription || "",
    offer: offer || 0,
    offerExpiry: offerExpiry ? new Date(offerExpiry) : null,
    status: status || "Active"
  })

  return {
    success: true,
    message: "Brand Added Successfully",
  }
}




/*--------------------------------GET BRAND---------------------------------*/

const getBrandService = async (query) => {
    const search = query.search
    const page = Math.max(parseInt(query.page) || 1, 1)
    const limit = Math.max(parseInt(query.limit) || 8, 1)
    const skip = (page - 1) * limit

    let findQuery = { isDeleted: false }

    if (search) {
        findQuery.$or = [{
            name: {
                $regex: search,
                $options: "i"
            }
        }]
    }


  const totalBrands = await Brand.countDocuments(findQuery)
  const totalPages = Math.ceil(totalBrands / limit)

    /*******************Main Part*******************/

  const brands = await Brand.find(findQuery).sort({ createdAt: -1 }).skip(skip).limit(limit)
  console.log("bran",brands)

   if (!brands) {
    throw new Error("Failed to fetch brands")
  }

 const brandData = await Promise.all(
    brands.map(async (item) => {
      const totalProducts = await Product.countDocuments({
        brand: item._id
      });

      return {
        ...item.toObject(),
        totalProducts
      };
    })
  );

 
  return {
    success: true,
    message: "Brands Fetched Successfully",
    data: brandData,
    totalPages: totalPages,
    totalBrands: totalBrands
  }
}




/*--------------------------------EDIT BRAND---------------------------------*/

const editBrandService = async (brandData, params) => {
  const brandId = params?._id
  const { name, description, offer, offerExpiry, status } = brandData

    /*******************Validations*******************/

  const cleanName = name?.trim()
  const cleanDescription = description?.trim()

  if (!cleanName || cleanName === "") {
    throw new Error("Name is required")
  }
  if ((cleanName.match(/[a-zA-Z]/g) || []).length < 2) {
    throw new Error("Name must contain at least 2 characters")
  }
  if (!/^[a-zA-Z0-9 ]+$/.test(cleanName)) {
    throw new Error("Name must contain only letters, numbers, and spaces")
  }
  if (cleanDescription?.length > 200) {
    throw new Error("Description must be below 200 characters")
  }
  if (offer && !/^\s*\d+\s*$/.test(offer)) {
    throw new Error("Offer must be a number")
  }
  if (offer && (Number(offer) < 10 || Number(offer) > 90)) {
    throw new Error("Offer Minimum 10 and Maximum 90")
  }
  if (offer && !offerExpiry) {
    throw new Error("Select an Expiry Date")
  }

const existingBrand = await Brand.findOne({ 
    _id: { $ne: brandId }, 
    name: { $regex: `^${cleanName}$`, $options: "i" } 
})

  if (existingBrand) {
    throw new Error("Brand Already exists")
  }

    /*******************Main Part*******************/

  await Brand.updateOne({ _id: brandId }, {
    $set: {
      name: cleanName,
      description: cleanDescription || "",
      offer: offer || 0,
      offerExpiry: offerExpiry ? new Date(offerExpiry) : null,
      status: status
    }
  })

  return {
    success: true,
    message: "Brand updated successfully"
  }
}




/*--------------------------------TOGGLE BRAND---------------------------------*/

const toggleStatusService = async (params) => {

    /*******************Validations*******************/

    const brandId = params.id
    if (!brandId) {
        throw new Error("Brand id not passed")
    }
    const existingBrand = await Brand.findOne({ _id: brandId })
    if (!existingBrand) {
        throw new Error("Brand not exists")
    }

    if (existingBrand.status === "Active") {
        existingBrand.status = "InActive"
     
          /*******************Main Part*******************/

        await Product.updateMany({brand:existingBrand._id},{$set:{status:"InActive"}})
        await existingBrand.save()
    } else {
        existingBrand.status = "Active"
    }

    await existingBrand.save()

    return {
        success: true,
        message: "Toggled brand status successfully"
    }
}





/*--------------------------------DELETE BRAND---------------------------------*/

const deleteBrandService = async (params) => {

    /*******************Validations*******************/

    const brandId = params.id

    if (!brandId) {
        throw new Error("Brand id not passed")
    }
    const existingBrand = await Brand.findOne({ _id: brandId })
    if (!existingBrand) {
        throw new Error("Brand not exists")
    }

      /*******************Main Part*******************/

    existingBrand.isDeleted = true
    await Product.updateMany({brand:existingBrand._id},{$set:{isListed:false,status:"InActive"}})
    await existingBrand.save()
    return {
        success: true,
        message: "Brand deleted Successfully"
    }
}


module.exports = {
  addBrandService,
  getBrandService,
  editBrandService,
  toggleStatusService,
  deleteBrandService
}