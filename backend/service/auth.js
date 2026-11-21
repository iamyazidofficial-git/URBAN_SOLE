/***************************************IMPORTS*****************************************/

const User=require("../models/user")
const bycrypt=require("bcryptjs")
const jwt=require("jsonwebtoken")
const ReferralTransaction=require("../models/refferalTransaction")
const {processWalletTransactionService}=require("../service/wallet.js")

/*--------------------------------------SIGNUP----------------------------------------*/

const signupService=async({name,email,gender,password,referralCode})=>{

    const existingUser = await User.findOne({ email: email })

    if (existingUser) {
     throw new Error("User Allready exists")
    }

    const generateUniqueReferralCode = async () => {
        let code
        let isUnique = false;
        while (!isUnique) {
            code = "US" + Math.random().toString(36).substring(2, 8).toUpperCase();
            const existingCode = await User.findOne({ referralCode: code });
            if (!existingCode) {
                isUnique = true;
            }
        }
        return code;
    };

    const newReferralCode = await generateUniqueReferralCode();

    let referrerUser = null


    if (referralCode && referralCode.trim() !== "") {
        referrerUser = await User.findOne({ referralCode: referralCode.trim() });
        if (!referrerUser) {
            throw new Error("Invalid referral code");
        }
    }

    /*************************MAIN PART***********************/

    const hashedPassword = await bycrypt.hash(password, 10)

    const newUser=await User.create({
       name: name,
      email: email,
      gender: gender,
      password: hashedPassword,
      referralCode: newReferralCode,
      referredBy: referrerUser ? referrerUser._id : undefined
    })



    if (referrerUser) {
        const REFERRER_REWARD = 100; 
        const REFEREE_REWARD = 50; 

        await processWalletTransactionService({
            userId: referrerUser._id,
            amount: REFERRER_REWARD,
            type: "CREDIT",
            source: "REFERRAL_BONUS",
            description: `Referral bonus for inviting ${newUser.name}`
        });

        await processWalletTransactionService({
            userId: newUser._id,
            amount: REFEREE_REWARD,
            type: "CREDIT",
            source: "REFERRAL_BONUS",
            description: "Welcome bonus for joining via referral code"
        });

        await ReferralTransaction.create({
            referrer: referrerUser._id,
            referee: newUser._id,
            amount: REFERRER_REWARD,
            type: "CREDIT",
            status: "COMPLETED",
            description: `Successful referral of ${newUser.email}`
        });

        newUser.isReferralRewarded = true;
        await newUser.save();
    }

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