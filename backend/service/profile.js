/***************************************IMPORTS*****************************************/

const User = require("../models/user")
const bcrypt = require("bcryptjs")
const cloudinary = require("../config/cloudinary")

/*--------------------------------------GET----------------------------------------*/

const getUserService = async (userId) => {

  const existingUser = await User.findOne({ _id: userId })

  if (!existingUser) {
    throw new Error("User does not exist")
  }

  /*************************MAIN PART***********************/

  return {
    name: existingUser.name,
    email: existingUser.email,
    gender: existingUser.gender,
    referralCode: existingUser.referralCode,
    googleId: existingUser.googleId,
    profileImage: existingUser.profileImage,
  }
}



/*--------------------------------------EDIT----------------------------------------*/

const editProfileService = async (userId, { name, email, gender }) => {
  const cleanName = name ? name.trim() : ""
  const cleanEmail = email ? email.trim() : ""
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

  if (!cleanName) {
    throw new Error("Name is required")
  }

  if ((cleanName.match(/[a-zA-Z]/g) || []).length < 4) {
    throw new Error("Name must contain at least 4 Characters")
  }

  if (!/^[a-zA-Z ]+$/.test(cleanName)) {
    throw new Error("Name must contain only letters")
  }

  if (!cleanEmail) {
    throw new Error("Email is required")
  }

  if (!emailRegex.test(cleanEmail)) {
    throw new Error("Enter a valid email")
  }

  /*************************MAIN PART***********************/

  await User.updateOne(
    { _id: userId },
    { $set: { name: cleanName, email: cleanEmail, gender: gender } }
  )

  return { message: "Updated successfully" }
}



/*--------------------------------------ADD DP----------------------------------------*/

const uploadPhotoService = async (userId, fileBuffer) => {

  if (!fileBuffer) {
    throw new Error("Please select an image")
  }

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "urban-sole/profile" },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    )
    stream.end(fileBuffer)
  })

  /*************************MAIN PART***********************/

  await User.updateOne(
    { _id: userId },
    { $set: { profileImage: result.secure_url } }
  )

  return { image: result.secure_url }
}



/*--------------------------------------REM DP----------------------------------------*/

const removePhotoService = async (userId) => {
  const existingUser = await User.findById(userId)

  if (!existingUser) {
    throw new Error("User not found")
  }

  if (!existingUser.profileImage) {
    throw new Error("No profile photo to remove")
  }

  /*************************MAIN PART***********************/

  await User.updateOne({ _id: userId }, { $set: { profileImage: "" } })

  return { message: "Profile photo removed successfully" }
}



/*--------------------------------------PASSWORD----------------------------------------*/

const changePasswordService = async (userId, currentPassword, newPassword) => {
  const existingUser = await User.findById(userId)

  if (!existingUser) {
    throw new Error("User not found")
  }

  const checkPassword = await bcrypt.compare(
    currentPassword,
    existingUser.password
  )

  if (!checkPassword) {
    throw new Error("Invalid Current Password")
  }

  const cleanPassword = newPassword ? newPassword.trim() : ""
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/

  if (!cleanPassword) {
    throw new Error("Password is required")
  }

  if (cleanPassword.length < 6) {
    throw new Error("Password must be at least 6 characters")
  }

  if (!passwordRegex.test(cleanPassword)) {
    throw new Error("Password must contain at least one letter and one number")
  }

  const hashedPassword = await bcrypt.hash(cleanPassword, 10)

  /*************************MAIN PART***********************/

  await User.updateOne({ _id: userId }, { $set: { password: hashedPassword } })

  return { newPassword: cleanPassword }
}



/*--------------------------------------EMAIL----------------------------------------*/

const changeEmailService = async (newEmail) => {

  const cleanEmail = newEmail ? newEmail.trim() : ""
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

  if (!cleanEmail) {
    throw new Error("Email is required")
  }

  if (!emailRegex.test(cleanEmail)) {
    throw new Error("Enter a valid email")
  }

  const existingUser = await User.findOne({ email: cleanEmail })

  if (existingUser) {
    throw new Error("User Already exists")
  }

  /*************************MAIN PART***********************/

  return { newEmail: cleanEmail }
}



module.exports = {
  getUserService,
  editProfileService,
  uploadPhotoService,
  removePhotoService,
  changePasswordService,
  changeEmailService
}