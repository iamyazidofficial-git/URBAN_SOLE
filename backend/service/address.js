/***************************************IMPORTS*****************************************/

const Address = require("../models/address");
const { listenerCount } = require("../models/user");

/*--------------------------------------VALIDATION----------------------------------------*/

const validateIndianAddress = async (postalCode, city, state) => {
  try {
    const response = await fetch(`https://api.pincodeapi.in/api/v1/pincode/${postalCode}`);

    if (!response.ok) {
      throw new Error("PINCODE_LOOKUP_FAILED");
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error("PINCODE_LOOKUP_FAILED");
    }

    const offices = result.data?.post_offices || [];

    if (offices.length === 0) {
      return {
        valid: false,
        message: "Invalid Indian PIN code",
      }
    }

    /*************************MAIN PART***********************/

    const matchingOffice = offices.find(
      (office) =>
        office.office_name?.trim().toLowerCase() === city.trim().toLowerCase() &&
        office.state?.trim().toLowerCase() === state.trim().toLowerCase()
    );

    if (!matchingOffice) {
      return {
        valid: false,
        message: "Place and State do not match this PIN code",
      }
    }

    return {
      valid: true,
      office: matchingOffice,
    }
  } catch (error) {
    throw new Error(error.message || "Pincode validation failed");
  };
};

/*--------------------------------------DATA----------------------------------------*/

const validateAddressData = ({
  fullName,
  phoneNumber,
  city,
  state,
  postalCode,
  addressType,
  streetAddress
}) => {
  const cleanName = fullName?.trim()
  const cleanNumber = phoneNumber?.trim()
  const cleanCity = city?.trim()
  const cleanState = state?.trim()
  const cleanPostalCode = postalCode?.trim()
  const cleanStreetAddress=streetAddress?.trim()

  if (!cleanName) throw new Error("Full name is required");
  if (cleanName.length < 4) throw new Error("Name must be at least 4 characters");
  if (!/^[A-Za-z ]+$/.test(cleanName)) throw new Error("Name must contain only letters");

  if (!cleanNumber) throw new Error("Phone number is required");
  if (!/^[0-9]{10}$/.test(cleanNumber))
    throw new Error("Phone number must contain exactly 10 digits");

  if (!cleanCity) throw new Error("City is required");
  if (!/^[A-Za-z ]+$/.test(cleanCity)) throw new Error("City must contain only letters");

  if (!cleanState) throw new Error("State is required");
  if (!/^[A-Za-z ]+$/.test(cleanState)) throw new Error("State must contain only letters");

  if (!cleanPostalCode) throw new Error("Postal code is required")
  if (!/^[0-9]{6}$/.test(cleanPostalCode))
    throw new Error("Postal code must be exactly 6 digits");

  if (!["home", "work", "other"].includes(addressType)) {
    throw new Error("Invalid address type");
  }

  if(!cleanStreetAddress || cleanStreetAddress?.length<4){
    throw new Error("Street Adress atleast 4 Charecters is required")
  }


  /*************************MAIN PART***********************/

  return {
    cleanName,
    cleanNumber,
    cleanCity,
    cleanState,
    cleanPostalCode,
    cleanStreetAddress
  }
}



/*--------------------------------------GET----------------------------------------*/

const getAddressesService = async (userId) => {
  const addresses = await Address.find({ userId }).sort({
    isDefault: -1,
    createdAt: -1,
  })
  return addresses
}



/*--------------------------------------ADD----------------------------------------*/

const addAddressService = async (userId, addressData) => {
  const addressCount = await Address.countDocuments({ userId })

  if (addressCount >= 5) {
    throw new Error("You can save a maximum of 5 addresses")
  }

  const {
    cleanName,
    cleanNumber,
    cleanCity,
    cleanState,
    cleanPostalCode,
    cleanStreetAddress
  } = validateAddressData(addressData)

  if (addressData.isDefault === true) {
    await Address.updateMany({ userId }, { $set: { isDefault: false } })
  }

  const existingAddress=await Address.findOne({userId})
  let isDefaultAddress=false

  if(!existingAddress){
    isDefaultAddress=true
  }
  else if(Boolean(addressData.isDefault)==true){
    isDefaultAddress=true
  }

  /*************************MAIN PART***********************/

  const newAddress = await Address.create({
    userId,
    fullName: cleanName,
    phoneNumber: cleanNumber,
    streetAddress: cleanStreetAddress,
    apartment: addressData.apartment?.trim() || "",
    city: cleanCity,
    state: cleanState,
    postalCode: cleanPostalCode,
    addressType: addressData.addressType,
    isDefault: Boolean(isDefaultAddress),
  })

  return newAddress
}



/*--------------------------------------EDIT----------------------------------------*/

const editAddressService = async (userId, addressId, addressData) => {
  const {
    cleanName,
    cleanNumber,
    cleanCity,
    cleanState,
    cleanPostalCode,
  } = validateAddressData(addressData)

  const existingAddress = await Address.findOne({ _id: addressId, userId })

  if (!existingAddress) {
    throw new Error("ADDRESS_NOT_FOUND")
  }

  /*************************MAIN PART***********************/

  if (addressData.isDefault === true) {
    await Address.updateMany(
      { userId, _id: { $ne: addressId } },
      { $set: { isDefault: false } }
    )
  }

  const updatedAddress = await Address.findOneAndUpdate(
    { _id: addressId, userId },
    {
      fullName: cleanName,
      phoneNumber: cleanNumber,
      streetAddress: addressData.streetAddress?.trim(),
      apartment: addressData.apartment?.trim() || "",
      city: cleanCity,
      state: cleanState,
      postalCode: cleanPostalCode,
      addressType: addressData.addressType,
      isDefault: Boolean(addressData.isDefault),
    },
    { new: true, runValidators: true }
  )

  return updatedAddress
}



/*--------------------------------------DELETE----------------------------------------*/

const deleteAddressService = async (userId, addressId) => {
  const deletedAddress = await Address.findOneAndDelete({
    _id: addressId,
    userId,
  })

  if (!deletedAddress) {
    throw new Error("ADDRESS_NOT_FOUND")
  }

  if (deletedAddress.isDefault === true) {
    const nextAddress = await Address.findOne({ userId }).sort({
      createdAt: -1,
    })

    if (nextAddress) {
      nextAddress.isDefault = true
      await nextAddress.save()
    }
  }

  /*************************MAIN PART***********************/

  return { message: "Address deleted successfully" }
}




module.exports = {
  validateIndianAddress,
  getAddressesService,
  addAddressService,
  editAddressService,
  deleteAddressService,
}