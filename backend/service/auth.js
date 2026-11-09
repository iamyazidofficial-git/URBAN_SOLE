/***************************************IMPORTS*****************************************/

const User=require("../models/user")
const bycrypt=require("bcryptjs")
const jwt=require("jsonwebtoken")

/*--------------------------------------SIGNUP----------------------------------------*/

const signupService=async({name,email,gender,password,referralCode})=>{

    const existingUser = await User.findOne({ email: email })

    if (existingUser) {
     throw new Error("User Allready exists")
    }

    /*************************MAIN PART***********************/

    const hashedPassword = await bycrypt.hash(password, 10)

    await User.create({
       name: name,
      email: email,
      gender: gender,
      password: hashedPassword,
      referralCode: referralCode
    })

    return{
      name: name,
      email: email,
      gender: gender,
      password: hashedPassword,
      referralCode: referralCode
  }
}



/*--------------------------------------LOGIN----------------------------------------*/

const loginService=async({email,password})=>{

   const existingUser = await User.findOne({ email: email })
      if(existingUser?.isBlocked==true){
        throw new Error("Your account has been blocked")
      }
      if (!existingUser) {
        throw new Error("Invalid username or password")
      }
      if (!existingUser.password) {
       throw new Error("Please login using Google")
      }
  
      const passwordCheck = await bycrypt.compare(
        password,
        existingUser?.password
      )
  
      if (!passwordCheck) {
        throw new Error("Invalid Username or Password")
      }
  
      /*************************MAIN PART***********************/

      
      if (existingUser.isBlocked == true) {
       throw new Error("Admin Blocked you")
      }
      if (existingUser.isVerified == false) {
         return{
          message: "not verified",
          isVerified: false,
        }
      } else {
        const token = jwt.sign(
          { email: email, _id: existingUser._id, role: existingUser.role },
          process.env.JWT_SECRET_KEY,
          { expiresIn: "1d" },
        )

        return {
          success: true,
          message: "Login Successfully",
          userId: existingUser._id,
          isVerified: true,
          token: token,
          role:existingUser.role
        }
      }
}




module.exports={
  signupService,
  loginService
}