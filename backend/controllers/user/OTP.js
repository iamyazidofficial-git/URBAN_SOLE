/***************************************IMPORTS*****************************************/

const OTP = require("../../models/otp")
const jwt = require("jsonwebtoken")
const User = require("../../models/user")
const bycrypt = require("bcryptjs")
const { sendOTPEmail } = require("../../utils/sendEmail")

/*--------------------------------------GENERATOR----------------------------------------*/

const generateOTP = async (req, res) => {
  try {
    const { email, type, newEmail, password } = req.body
    const cleanEmail = email?.trim()

    const otp = Math.floor(1000 + Math.random() * 9000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await OTP.deleteMany({ email: cleanEmail })

    await OTP.create({
      email: cleanEmail,
      otp: otp,
      expiresAt: expiresAt,
    })

    await sendOTPEmail(cleanEmail, otp)

    res.status(200).json({
      success: true,
      message: "OTP sentend successfully",
    })
  } catch (error) {
    console.log("error" + error)
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    })
  }
}



/*--------------------------------------VERIFY----------------------------------------*/

const verifyOTP = async (req, res) => {

  try {

    const { verificationCode, email, newEmail, newPassword, type } = req.body
    const otpRegex = /^[0-9]{4}$/

    if (!otpRegex.test(verificationCode)) {
      return res.status(400).json({
        success: false,
        message: "Verification code must contain exactly 4 digits",
      })
    }

    const otpData =
      (await OTP.findOne({ email: email })) ||
      (await OTP.findOne({ email: newEmail }))

    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: "OTP not found",
      })
    }

    if (new Date() > otpData.expiresAt) {
      await OTP.deleteOne({ _id: otpData._id })

      return res.status(400).json({
        success: false,
        message: "OTP expired",
      })
    }

    const generatedOTP = otpData.otp
    const enteredOTP = String(verificationCode)

/*************************SUCCESS***********************/

    if (generatedOTP === enteredOTP) {

    /*******************SIGN********************/

      if (type == "signIn") {
        const existingUser = await User.findOne({
          email: email,
        })

        if (!existingUser) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          })
        }

        existingUser.isVerified = true

        await existingUser.save()

        const token = jwt.sign(
          {
            email: existingUser.email,
            _id: existingUser._id,
            role: existingUser.role,
          },
          process.env.JWT_SECRET_KEY,
          {
            expiresIn: "1d",
          },
        )

        await OTP.deleteOne({
          _id: otpData._id,
        })

        return res.status(200).json({
          success: true,
          message: "Verification successful",
          token: token,
        })
      }

      /*******************CURRENT EMAIL CHANGE********************/

       if(type=="verifyCurrentEmailForChange"){
        res.status(200).json({
          success: true,
          message: "valid Otp",
        })
        await OTP.deleteOne({ _id: otpData._id })
      }

      /*******************NEW EMAIL CHANGE********************/

      if (type == "changeEmail") {
        const existingUser = await User.findOne({ email: email })
        existingUser.email = newEmail
        await existingUser.save()

        await OTP.deleteOne({ _id: otpData._id })

        res.status(200).json({
          success: true,
          message: "Email Changed successfully",
        })
      }

      /*******************PASSWORD********************/

      if (type == "changePassword") {

        const hashedPassword = await bycrypt.hash(newPassword, 10)
        const existingUser = await User.findOne({ email: email })
        existingUser.password = hashedPassword
        await existingUser.save()

        await OTP.deleteOne({ _id: otpData._id })

        res.status(200).json({
          success: true,
          message: "Password changed successfully",
        })
      }

      /*******************FORGOT********************/

      if (type == "forgottPassword") {
        res.status(200).json({
          success: true,
          message: "valid Otp",
        })
        await OTP.deleteOne({ _id: otpData._id })
      }

      
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      })
    }

   

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    })
  }

}

module.exports = { generateOTP, verifyOTP }
