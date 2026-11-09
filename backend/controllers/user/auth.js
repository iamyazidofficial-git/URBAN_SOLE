/***************************************IMPORTS*****************************************/

const express = require("express")
const bycrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { OAuth2Client } = require("google-auth-library")
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const User = require("../../models/user")
const OTP = require("../../models/otp")
const isAuthenticated = require("../../middleware/user/auth")
const {signupService,loginService}= require("../../service/auth")

/*--------------------------------------SIGNUP----------------------------------------*/

const signup = async (req, res) => {
  try {
    const { name, email, gender, password, referralCode } = req.body

    const cleanName = name?.trim()
    const cleanEmail = email?.trim()
    const cleanPassword = password?.trim()
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/

    /*************************Validation 1***********************/

    if (!cleanName || cleanName == "") {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      })
    }
    if (!cleanEmail || cleanEmail == "") {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      })
    }
    if (!cleanPassword || cleanPassword == "") {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      })
    }
    if (!gender) {
      return res.status(400).json({
        success: false,
        message: "Gender is required",
      })
    }

    /*************************Validation 2***********************/

    if ((cleanName.match(/[a-zA-Z]/g) || []).length < 4) {
      return res.status(400).json({
        success: false,
        message: "Name must contain at least 4 Charecters",
      })
    }

    if (!/^[a-zA-Z ]+$/.test(cleanName)) {
      return res.status(400).json({
        success: false,
        message: "Name must contains only letters",
      })
    }
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email",
      })
    }
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be atleast 6",
      })
    }
    if (!passwordRegex.test(cleanPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must be contain atleast one letter and one number",
      })
    }

    const result=await signupService({name:cleanName,email:cleanEmail,gender:gender,password:cleanPassword,referralCode:referralCode})
    
    res.status(200).json({
      success: true,
      message: "Signup Successfully",
      email: result.email,
    })
  } catch (error) {
    console.log("Signup Error:-",error)
    return res.status(500).json({
      success: false,
      message: error?.message
    })
  }
}




/*--------------------------------------LOGIN----------------------------------------*/

const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const cleanEmail = email?.trim()
    const cleanPassword = password?.trim()
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/

    /*************************Validation 1***********************/

    if (!cleanEmail || cleanEmail == "") {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      })
    }
    if (!cleanPassword || cleanPassword == "") {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      })
    }

    /*************************Validation 2***********************/

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email",
      })
    }
    if (cleanPassword.length < 6) {
      return res.status(400).json({
        message: "Password Must be 6",
      })
    }
    

   const result=await loginService({email: cleanEmail,password: cleanPassword})

   let date=new Date()

   console.log("Login Time",date.getTime())

   return res.status(200).json({
    success:true,
    message:result?.message,
    isVerified:result?.isVerified,
    token:result?.token,
    userId:result?.userId,
    role:result?.role
   })
    
  } catch (error) {
    console.log("Login Error:-", error)
    return res.status(500).json({
      success: false,
      message: error?.message||"Something went wrong"
    })
  }
}




/*------------------------------------FORGOT------------------------------------*/

const forgottPassword = async (req, res) => {

  try {
    const { email } = req.body
    const cleanEmail = email?.trim()
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/

/*************************Validation 1***********************/

    if (!cleanEmail || cleanEmail == "") {
      return res.status.json({
        success: false,
        message: "Email is required",
      })
    }
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email",
      })
    }

    const existingUser = await User.findOne({ email: cleanEmail })

    if (!existingUser) {
      return res.status(400).json({
        success: false,
        message: "User not exists",
      })
    }

    return res.status(200).json({
      success: true,
      email: cleanEmail,
      message: "Valid email",
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    })
  }
}




/*------------------------------------RESET------------------------------------*/

const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body
    const cleanEmail = email?.trim()
    const cleanPassword = password?.trim()
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/

  /*************************Validation 1***********************/

    if (!cleanEmail || cleanEmail.trim() == "") {
      res.status(400).json({
        success: true,
        message: "Email is required",
      })
    }
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be atleast 6",
      })
    }
    if (!passwordRegex.test(cleanPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must be contain atleast one letter and one number",
      })
    }
    const hashedPassword = await bycrypt.hash(cleanPassword, 10)

    const existingUser=User.findOne({email:cleanEmail})

    if(!existingUser){
       return res.status(400).json({
        success: false,
        message: "User not found",
      })
    }

    await User.updateOne(
      { email: cleanEmail },
      { $set: { password: hashedPassword } },
    )

    res.status(200).json({
      success: true,
      message: "Password updated Successfully",
    })

  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: false,
      message: "Something went wrong"
    })
  }
}




/*-----------------------------------GOOGLE LOGIN-----------------------------------*/

const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required",
      })
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()

    const { sub: googleId, email, name, picture, email_verified } = payload

    if (!email_verified) {
      return res.status(400).json({
        success: false,
        message: "Google email is not verified",
      })
    }

    let user = await User.findOne({ email })

    if (user) {
      // Existing user
      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          message: "Your account is blocked",
        })
      }

      if (!user.googleId) {
        user.googleId = googleId
        user.profileImage = picture || user.profileImage
        user.isVerified = true

        await user.save()
      }
    } else {
      user = await User.create({
        name: name,
        email: email,
        googleId: googleId,
        gender: "other",
        profileImage: picture || "",
        isVerified: true,
        role: "user",
        isBlocked: false,
      })
    }

    const token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "1d",
      },
    )

    return res.status(200).json({
      success: true,
      message: "Google login successful",
      token: token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        gender: user.gender,
        profileImage: user.profileImage,
        role: user.role,
      },
    })
  } catch (error) {
    console.log("Google Login Error:", error)

    return res.status(401).json({
      success: false,
      message: "Google authentication failed",
    })
  }
}

module.exports = {
  signup,
  login,
  forgottPassword,
  resetPassword,
  googleLogin,
}

