/***************************************IMPORTS*****************************************/

const User = require("../../models/user")
const jwt = require("jsonwebtoken")
const bycrypt = require("bcryptjs")
const cloudinary = require("../../config/cloudinary")
const {getUserService,editProfileService,uploadPhotoService,removePhotoService,changePasswordService,changeEmailService,} = require("../../service/profile")

/*--------------------------------------GET----------------------------------------*/

const getUser = async (req, res) => {
  
  try {
    const userId = req.user._id

    const userData = await getUserService(userId)

    return res.status(200).json({
      success: true,
      message: "Fetched successfully",
      data: userData,
    })
  } catch (error) {
    console.log(error)

      return res.status(403).json({
        success: false,
        message: error?.message,
      })
    
  }
}



/*--------------------------------------EDIT----------------------------------------*/

const editUser = async (req, res) => {
  try {
    const userId = req.user._id

    const {
      type,
      name,
      email,
      gender,
      newEmail,
      currentPassword,
      newPassword,
    } = req.body

    /*************************PROFILE***********************/

    if (type === "editProfile") {
      const result = await editProfileService(userId, { name, email, gender })
      return res.status(200).json({
        success: true,
        message: result.message,
      })
    }

    /*************************ADD DP***********************/

    if (type === "uploadPhoto") {
      const result = await uploadPhotoService(userId, req.file?.buffer)
      return res.status(200).json({
        success: true,
        message: "Profile photo updated successfully",
        image: result.image,
      })
    }

    /*************************REM DP***********************/

    if (type === "removePhoto") {
      const result = await removePhotoService(userId)
      return res.status(200).json({
        success: true,
        message: result.message,
      })
    }

    /*************************PASSWORD***********************/

    if (type === "changePassword") {
      const result = await changePasswordService(
        userId,
        currentPassword,
        newPassword,
      )

      return res.status(200).json({
        success: true,
        message: "Password updated successfully",
        newPassword: result.newPassword,
      })
    }

    /*************************EMAIL***********************/

    if (type === "changeEmail") {
      const result = await changeEmailService(newEmail)
      return res.status(200).json({
        success: true,
        newEmail: result.newEmail,
      })
    }

    return res.status(400).json({
      success: false,
      message: "Invalid action type provided",
    })
  } catch (error) {
    console.error(error)
    return res.status(400).json({
      success: false,
      message: error?.message || "Something went wrong",
    })
  }
}

module.exports = {
  getUser,
  editUser,
}
