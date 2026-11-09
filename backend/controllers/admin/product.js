/*******************************************IMPORTS***********************************************/

const { addProductService, getProductService, editProductService,getSingleProductService,toggleStatusService,deleteProductService } = require("../../service/product")

/*--------------------------------ADD PRODUCT---------------------------------*/

const addProductController = async (req, res) => {
  try {
    let productData = { ...req.body }

    if (typeof productData.variants === 'string') {
      productData.variants = JSON.parse(productData.variants)
    }

    const result = await addProductService(productData, req.files)
    return res.status(201).json(result)
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Internal server error",
    })
  }
}




/*--------------------------------DELETE PRODUCT---------------------------------*/

const getProductController = async (req, res) => {

  try {
    const result = await getProductService({...req.query,role:"admin"})
    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    })
  }
}





/*------------------------------GET SINGLE PRODUCT---------------------------*/

const getSingleProductController = async (req, res) => {
  try {
    const { id } = req.params
    const result = await getSingleProductService(id,"admin")
    return res.status(200).json(result)
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message || "Product not found",
    })
  }
}





/*--------------------------------EDIT PRODUCT---------------------------------*/

const editProductController = async (req, res) => {
  try {
    const { id } = req.params
    let productData = { ...req.body }

    if (typeof productData.variants === 'string') {
      productData.variants = JSON.parse(productData.variants)
    }

    const result = await editProductService(id, productData, req.files)
    return res.status(200).json(result)
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Internal server error",
    })
  }
}





/*--------------------------------EDIT PRODUCT---------------------------------*/

const toggleStatusController = async (req, res) => {
  try {
    const { id } = req.params
    const result = await toggleStatusService(id)
    return res.status(200).json(result)
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Internal server error",
    })
  }
}





/*--------------------------------DELETE PRODUCT---------------------------------*/

const deleteProductController = async (req, res) => {
  try {
    const { id } = req.params
    const result = await deleteProductService(id)
    return res.status(200).json(result)
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Internal server error",
    })
  }
}



module.exports = {
  addProductController,
  getProductController,
  getSingleProductController,
  editProductController, 
  toggleStatusController,
  deleteProductController
}