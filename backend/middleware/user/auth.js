const jwt = require("jsonwebtoken")
const User = require("../../models/user")

const userAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    console.log("Auth Header:-", authHeader)

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required"
      });
    }

    const token = authHeader.split(" ")[1];
    console.log("TOKEN EXISTS:", !!token);


    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization token"
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY
    );

    console.log("Decoded Token:-", decoded)
    console.log("User Id:-", decoded._id)

    const user = await User.findById(decoded._id)
    console.log("User From DB:-", user)
    console.log("Is Blocked:-", user?.isBlocked)

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.isBlocked) {
        console.log("User is Blocked")
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked"
      });
    }

    req.user = user

    next();

  } catch (error) {
     console.log("User Auth Error:-", error)

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};

module.exports = { userAuth }