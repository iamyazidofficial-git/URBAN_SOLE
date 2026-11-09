/***************************************IMPORTS*****************************************/

const jwt = require("jsonwebtoken")
const {getAddressesService,addAddressService,editAddressService,deleteAddressService,} = require("../../service/address")

/*--------------------------------------GET----------------------------------------*/

const getAddresses = async (req, res) => {

  try {
    const userId = req.user._id
    const addresses = await getAddressesService(userId)

    return res.status(200).json({
      success: true,
      message: "Addresses fetched successfully",
      data: addresses
    })
  } catch (error) {
   console.log("Get Address Error:-",error)

    return res.status(400).json({
      success: false,
      message: error?.message||"Something went wrong"
    })
  }

}



/*--------------------------------------ADD----------------------------------------*/

const addAddress = async (req, res) => {

  try {
    const userId = req.user._id;
    const address = await addAddressService(userId, req.body)

    return res.status(201).json({
      success: true,
      message: "Address added successfully",
      data: address,
    })
  } catch (error) {
    console.log("Add Address Error:-", error)

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to add address",
    })
  }
}




/*--------------------------------------EDIT----------------------------------------*/

const editAddress = async (req, res) => {
  try {
    const userId = req.user._id
    const addressId = req.params.id

    const updatedAddress = await editAddressService(
      userId,
      addressId,
      req.body
    )

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: updatedAddress,
    })
  } catch (error) {
    console.log("Edit Address Error:-",error)

    return res.status(400).json({
      success: false,
      message: error?.message || "Failed to update address",
    })
  }
}




/*--------------------------------------DELETE----------------------------------------*/

const deleteAddress = async (req, res) => {

  try {
   const userId = req.user._id
   const addressId = req.params.id

    await deleteAddressService(userId, addressId)

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    })
  } catch (error) {
    console.log("Delete Address Error:-",error)
    
    return res.status(400).json({
      success: false,
      message: error?.message||"Something went wrong"
    })
  }
}

module.exports = {
  getAddresses,
  addAddress,
  editAddress,
  deleteAddress
}