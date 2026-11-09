/***************************************IMPORTS*****************************************/

const Product = require("../models/product")
const Brand = require("../models/brand")
const Variant = require("../models/variant")
const SubCategory = require("../models/category")
const cloudinary = require("../config/cloudinary")
const streamifier = require('streamifier')

/*--------------------------------UPLOAD PHOTO---------------------------------*/

const uploadPhotoService = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'ecommerce-products' },
      (error, result) => {
        if (result) {
          resolve(result.secure_url)
        } else {
          reject(error)
        }
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream)
  });
};




/*---------------------------------ADD PRODUCT------------------------------*/

const addProductService = async (productData, files) => {

  const { name, description, regularPrice, status, category, subCategory, countryOfOrgin, brand, offer, offerExpiry } = productData

  const variants = typeof productData.variants === 'string' 
    ? JSON.parse(productData.variants) 
    : productData.variants

  const cleanName = name?.trim()
  const cleanDescription = description?.trim()
  const cleanCategory = category?.trim() 
  const cleanSubCategory = subCategory?.trim()
  const cleanCountryOfOrgin = countryOfOrgin?.trim()
  const cleanBrand = brand?.trim()

  /**********************Validations*******************/

  if (!cleanName) throw new Error("Name is required")
  if ((cleanName.match(/[a-zA-Z]/g) || []).length < 4) throw new Error("Name must contain at least 4 letters")
  if (!/^[a-zA-Z0-9 ]+$/.test(cleanName)) throw new Error("Name must contain only letters and numbers")

  if (!cleanDescription || cleanDescription.replace(/\s/g, '').length < 25) {
    throw new Error("Description must contain at least 25 characters")
  }

  const priceNum = Number(regularPrice)
  if (!regularPrice || isNaN(priceNum) || priceNum < 1 || priceNum > 10000000) {
    throw new Error("Price must be between 1 and 10,000,000")
  }

  if (!cleanCategory || !['Men', 'Women'].includes(cleanCategory)) throw new Error("Valid category is required");
  if (!cleanSubCategory) throw new Error("Sub Category is required");
  if (!cleanBrand) throw new Error("Brand is required");

  if (!cleanCountryOfOrgin || cleanCountryOfOrgin.length < 3 || !/^[A-Za-z ]+$/.test(cleanCountryOfOrgin)) {
    throw new Error("Origin must contain at least 3 letters");
  }

  if (offer !== undefined && offer !== null && Number(offer)!==0 && String(offer).trim() !== '') {
    const offerNum = Number(offer)
    if (isNaN(offerNum) || offerNum < 10 || offerNum > 90) {
      throw new Error("Offer percentage must be between 10 and 90")
    }
    if (!offerExpiry || offerExpiry === "null") {
      throw new Error("Add Offer Expiry")
    }
    const expiryDate = new Date(offerExpiry) 
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (expiryDate < today) {
      throw new Error("Expiry date cannot be in the past")
    }
  }

  if (files && files.length > 0) {
const invalidFile = files.find(file => !file.mimetype.startsWith('image/'))
if (invalidFile) {
throw new Error("Only image files are allowed.")
}
}

  if (!variants || !Array.isArray(variants) || variants.length === 0) {
    throw new Error("First variant is required")
  }

  const colorSet = new Set()
  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i]
    const trimmedColor = variant.colour?.trim()

   const colorRegex = /^[A-Za-z]+( [A-Za-z]+)*$/
if (!trimmedColor || !colorRegex.test(trimmedColor) || trimmedColor.length < 3) {
throw new Error(`Variant ${i + 1}: Colour name must contain atleast 3 letters`)
}

    const lowerColor = trimmedColor.toLowerCase();
    if (colorSet.has(lowerColor)) {
      throw new Error(`Duplicate color "${trimmedColor}" found. Duplicate colors are not allowed.`)
    }
    colorSet.add(lowerColor)

    const existingImagesCount = variant.images ? variant.images.length : 0
    const variantFiles = files ? files.filter(
      file => file.fieldname === `variants[${i}][images]` || file.fieldname === 'images'
    ) : []

    const totalVariantImages = existingImagesCount + variantFiles.length
    if (totalVariantImages !== 4) {
      throw new Error(`Variant "${trimmedColor}": Exactly 4 photos are required.`)
    }
  }


  const existingBrand = await Brand.findOne({ name: cleanBrand })
  if (!existingBrand) throw new Error("Brand Not Available")

  const existingSubCategory = await SubCategory.findOne({ name: cleanSubCategory })
  if (!existingSubCategory) throw new Error("SubCategory Not Available")

const existingProduct = await Product.findOne({
  name: { $regex: `^${cleanName}$`, $options: "i" }
})
  if (existingProduct) throw new Error("Product already exists")

  /**********************Variant Creation*******************/

  const processedVariants = []
  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    let imageUrls = variant.images || [];

    if (files && files.length > 0) {
      const variantFiles = files.filter(
        file => file.fieldname === `variants[${i}][images]` || file.fieldname === 'images'
      );

      for (const file of variantFiles) {
        const uploadedUrl = await uploadPhotoService(file.buffer);
        imageUrls.push(uploadedUrl);
      }
    }

    processedVariants.push({
      colour: variant.colour.trim(),
      colourHex: variant.colourHex || "#000000",
      inventory: variant.inventory,
      images: imageUrls,
    })
  }

  const createdVariants = await Variant.insertMany(processedVariants)
  const variantIds = createdVariants.map(v => v._id)

  /**********************Main Part*******************/

  const newProduct = await Product.create({
    name: cleanName,
    description: cleanDescription,
    price: Number(regularPrice),
    gender: cleanCategory,
    category: existingSubCategory._id,
    status: status || "Active",
    brand: existingBrand._id,
    countryOfOrgin: cleanCountryOfOrgin,
    vartiant: variantIds,
    isListed: true,
    offer: offer ? Number(offer) : 0,
    offerExpiry: offerExpiry && offerExpiry !== "null" ? offerExpiry : undefined,
  })

  return {
    success: true,
    message: "Product uploaded successfully",
    data: newProduct,
  }
}





/*--------------------------------GET PRODUCT---------------------------------*/

const getProductService = async (queryParams) => {
  try {
    const { role = 'user', gender, category, brand, price, color, size, search, sort, page = 1, limit = 8 } = queryParams

    let filter = {}
    filter.isListed = true

    if (role === 'user') {
      filter.status = "Active"

      const activeBrands = await Brand.find({ isListed: { $ne: false } }).select('_id')
      const activeCategories = await SubCategory.find({ isListed: { $ne: false } }).select('_id')

      filter.brand = { $in: activeBrands.map(b => b._id) }
      filter.category = { $in: activeCategories.map(c => c._id) }
    }

    if (gender) filter.gender = gender

      /**********************Search*******************/

    if (search) {
      const trimmedSearch = search.trim()
      const regexSearch = new RegExp(trimmedSearch, 'i')

      const matchingBrands = await Brand.find({ name: regexSearch }).select('_id')
      const brandIds = matchingBrands.map(b => b._id)

      filter.$or = [
        { name: { $regex: regexSearch } },
        { brand: { $in: brandIds } }
      ]
    }

      /*********************filters*******************/

   if (category) {
      const categoryNames = category.split(',').map(cat => cat.trim()).filter(Boolean)
      const matchedCategories = await SubCategory.find({ name: { $in: categoryNames }, isListed: {$ne: false } })
      filter.category = { $in: matchedCategories.map(cat => cat._id) }
    }

    if (brand) {
      const brandNames = brand.split(',').map(b => b.trim()).filter(Boolean)
      const matchedBrands = await Brand.find({ name: { $in: brandNames }, isListed: {$ne: false } })
      filter.brand = { $in: matchedBrands.map(b => b._id) }
    }

    if (price) {
      const priceParts = price.split('-');
      if (priceParts.length === 2) {
        filter.price = { $gte: Number(priceParts[0]),$lte: Number(priceParts[1]) };
      } else if (!isNaN(Number(price))) {
        filter.price = { $lte: Number(price) };
      }
    }

      /****************Variant filters*****************/

    let variantFilter = {}
    if (color) {
      const colorList = color.split(',').map(c => new RegExp(`^${c.trim()}$`, 'i'))
      variantFilter.colour = { $in: colorList }
    }

    if (size) {
      const sizeList = size.split(',').map(Number).filter(n => !isNaN(n))
      variantFilter['inventory.size'] = { $in: sizeList }
    }

    if (role === 'user') {
      variantFilter['inventory.quantity'] = { $gt: 0 }
    }

    if (Object.keys(variantFilter).length > 0) {
      const matchingVariants = await Variant.find(variantFilter).select('_id')
      filter.vartiant = { $in: matchingVariants.map(v => v._id) }
    }

      /******************Queries*******************/

    let sortQuery = {}
    if (sort === 'price-asc') sortQuery.price = 1
    else if (sort === 'price-desc') sortQuery.price = -1
    else if (sort === 'name-asc') sortQuery.name = 1
    else if (sort === 'name-desc') sortQuery.name = -1
    else sortQuery.createdAt = -1 

     /******************Pagination*******************/

    const pageNum = Math.max(1, Number(page))
    const limitNum = Math.max(1, Number(limit))
    const startIndex = (pageNum - 1) * limitNum

    const totalProducts = await Product.countDocuments(filter)
    const totalPages = Math.ceil(totalProducts / limitNum) || 1

      /****************Main Part***************/

    const paginatedProducts = await Product.find(filter)
      .populate('brand')
      .populate('category')
      .populate('vartiant')
      .sort(sortQuery)
      .skip(startIndex)
      .limit(limitNum)

    return {
      success: true,
      data: paginatedProducts,
      totalPages,
      currentPage: pageNum,
      totalProducts
    }
  } catch (error) {
    throw new Error(error.message)
  }
}




/*-----------------------------GET SINGLE PRODUCT-------------------------------*/

const getSingleProductService = async (productId, role = 'user') => {
  const product = await Product.findById(productId)
    .populate('category', 'name isListed')
    .populate('vartiant')
    .populate('brand', 'name isListed')

  if (!product) {
    throw new Error("Product not found")
  }

  if(role=="user"){
    if(product.status=="InActive" || product.isListed==false){
      throw new Error("Product not found")
    }
  }

  if (role !== 'admin') {
    if (product.isListed === false || product.status !== "Active") {
      throw new Error("Product is currently unavailable")
    }
    if (product.brand?.isListed === false || product.category?.isListed === false) {
      throw new Error("Inactive brand or category")
    }
  }

  return {
    success: true,
    message: "Product fetched successfully",
    data: product,
  };
};



/*----------------------------EDIT PRODUCT-----------------------------*/

const editProductService = async (productId, productData, files) => {
  const { name, description, regularPrice, status, category, subCategory, countryOfOrgin, brand, offer, offerExpiry } = productData

  const variants = typeof productData.variants === 'string' 
    ? JSON.parse(productData.variants) 
    : productData.variants

  /****************Validation****************/

  const cleanName = name?.trim()
  const cleanDescription = description?.trim()
  const cleanCategory = category?.trim()
  const cleanSubCategory = subCategory?.trim()
  const cleanCountryOfOrgin = countryOfOrgin?.trim()
  const cleanBrand = brand?.trim()

  if (!cleanName) throw new Error("Name is required")
  if ((cleanName.match(/[a-zA-Z]/g) || []).length < 4) throw new Error("Name must contain at least 4 letters")
  if (!/^[a-zA-Z0-9 ]+$/.test(cleanName)) throw new Error("Name must contain only letters and numbers")

  if (!cleanDescription || cleanDescription.replace(/\s/g, '').length < 25) {
    throw new Error("Description must contain at least 25 characters")
  }

  const priceNum = Number(regularPrice)
  if (!regularPrice || isNaN(priceNum) || priceNum < 1 || priceNum > 10000000) {
    throw new Error("Price must be between 1 and 10,000,000")
  }

  if (!cleanCategory || !['Men', 'Women'].includes(cleanCategory)) throw new Error("Valid category is required")
  if (!cleanSubCategory) throw new Error("SubCategory Not Available")
  if (!cleanBrand) throw new Error("Brand Not Available")

  if (!cleanCountryOfOrgin || cleanCountryOfOrgin.length < 3 || !/^[A-Za-z ]+$/.test(cleanCountryOfOrgin)) {
    throw new Error("Origin must contain at least 3 letters and only alphabets")
  }

const existingProduct = await Product.findOne({
  _id: { $ne: productId },
  name: { $regex: `^${cleanName}$`, $options: "i" }
})
if (existingProduct) throw new Error("Product already exists with this name")

if (offer !== undefined && offer !== null && Number(offer) !== 0 && String(offer).trim() !== '') {
  const offerNum = Number(offer)
  if (isNaN(offerNum) || offerNum < 10 || offerNum > 90) {
    throw new Error("Offer percentage must be between 10 and 90")
  }
  if (!offerExpiry || offerExpiry === "null") {
    throw new Error("Add Offer Expiry")
  }
  const expiryDate = new Date(offerExpiry) 
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (expiryDate < today) {
    throw new Error("Expiry date cannot be in the past")
  }
}

  if (files && files.length > 0) {
    const invalidFile = files.find(file => !file.mimetype.startsWith('image/'))
    if (invalidFile) {
      throw new Error("Only image files are allowed.")
    }
  }

  if (!variants || !Array.isArray(variants) || variants.length === 0) {
    throw new Error("At least one variant is required")
  }

  const colorSet = new Set()
  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    const trimmedColor = variant.colour?.trim();

  const colorRegex = /^[A-Za-z]+( [A-Za-z]+)*$/
if (!trimmedColor || !colorRegex.test(trimmedColor) || trimmedColor.length < 3) {
throw new Error(`Variant ${i + 1}: Colour name must contain only letters, allow spaces between words, and be at least 3 characters.`)
}

    const lowerColor = trimmedColor.toLowerCase();
    if (colorSet.has(lowerColor)) {
      throw new Error(`Duplicate color "${trimmedColor}" found.`);
    }
    colorSet.add(lowerColor);

    const existingImagesCount = variant.images ? variant.images.length : 0;
    const variantFiles = files ? files.filter(
      file => file.fieldname === `variants[${i}][images]` || file.fieldname === 'images'
    ) : [];

    const totalVariantImages = existingImagesCount + variantFiles.length;
    if (totalVariantImages !== 4) {
      throw new Error(`Variant "${trimmedColor}": Exactly 4 photos are required.`);
    }
  }

  const existingBrand = await Brand.findOne({ name: cleanBrand });
  if (!existingBrand) throw new Error("Brand Not Available");

  const existingSubCategory = await SubCategory.findOne({ name: cleanSubCategory })
  if (!existingSubCategory) throw new Error("SubCategory Not Available")

  const productToUpdate = await Product.findById(productId)
  if (!productToUpdate) throw new Error("Product not found")

  /***************Variant Creation & Upload***************/

  const processedVariants = []
  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i]
    let imageUrls = variant.images || []

    if (files && files.length > 0) {
      const variantFiles = files.filter(
        file => file.fieldname === `variants[${i}][images]` || file.fieldname === 'images'
      );

      for (const file of variantFiles) {
        const uploadedUrl = await uploadPhotoService(file.buffer)
        imageUrls.push(uploadedUrl)
      }
    }

    processedVariants.push({
      colour: variant.colour.trim(),
      colourHex: variant.colourHex || "#000000",
      inventory: variant.inventory,
      images: imageUrls,
    });
  }

  await Variant.deleteMany({ _id: { $in: productToUpdate.vartiant } })
  const createdVariants = await Variant.insertMany(processedVariants)
  const variantIds = createdVariants.map(v => v._id)


  /***************Main Part***************/

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    {
      name: cleanName,
      description: cleanDescription,
      price: Number(regularPrice),
      gender: cleanCategory,
      category: existingSubCategory._id,
      status: status || "Active",
      brand: existingBrand._id,
      countryOfOrgin: cleanCountryOfOrgin,
      vartiant: variantIds,
      offer: offer ? Number(offer) : 0,
      offerExpiry: offerExpiry && offerExpiry !== "null" ? offerExpiry : undefined,
    },
    { new: true }
  )

  return {
    success: true,
    message: "Product updated successfully",
    data: updatedProduct,
  }
}




/*----------------------------DELETE PRODUCT-----------------------------*/

const deleteProductService = async (productId) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new Error("Product not found")
  }

    /***************Main Part***************/

  product.isListed = false
  product.status = "InActive"
  await prdouct.save()

  return {
    success: true,
    message: "Product deleted successfully",
  }
}

/*----------------------------DELETE PRODUCT-----------------------------*/

const toggleStatusService = async (productId) => {
  const product = await Product.findById(productId)
  if (!product) {
    throw new Error("Product not found")
  }

   /***************Main Part***************/

  product.status = product.status === "Active" ? "InActive" : "Active"
  await product.save()

  return {
    success: true,
    message: `Product status changed to ${product.status}`,
    data: product,
  }
}


module.exports = {
  uploadPhotoService,
  addProductService,
  getProductService,
  getSingleProductService,
  editProductService,
  toggleStatusService,
  deleteProductService
} 