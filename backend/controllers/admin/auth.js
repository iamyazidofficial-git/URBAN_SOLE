/*******************************************IMPORTS***********************************************/

const express = require("express");
const bycrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const User = require("../../models/user");
const OTP = require("../../models/otp");
const isAuthenticated = require("../../middleware/user/auth");
const {loginService}= require("../../service/auth")

/*----------------------------------------LOGIN-------------------------------------*/

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const cleanEmail = email?.trim();
    const cleanPassword = password?.trim();
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

    /*************************Validation 1***********************/

    if (!cleanEmail || cleanEmail == "") {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email",
      });
    }
    if (!cleanPassword || cleanPassword == "") {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be atleast 6",
      });
    }


    const result=await loginService({email: cleanEmail,password: cleanPassword})

   return res.status(200).json({
    success:true,
    message:result?.message,
    isVerified:result?.isVerified,
    token:result?.token,
    userId:result?.userId,
    role:result?.role
   })

  } catch (error) {
    console.log("Singup Error:-", error);
    return res.status(500).json({
      success: false,
      message: error.message||"Something went wrong",
    });
  }
};

module.exports = {
  login
};



