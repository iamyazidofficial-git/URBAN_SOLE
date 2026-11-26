/*****************************************IMPORTS**********************************************/

const express=require("express")
const bycrypt=require("bcryptjs")
const jwt=require("jsonwebtoken")
const dotenv = require("dotenv")
const path = require("path")
const cors=require("cors")

const connectDB = require("./config/db")
const app=express()
app.use(express.urlencoded({extended:true}))
app.use(express.json())
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config();

const allowedOrigins = [
  "https://www.yazid.live",
  "https://yazid.live",
  "http://www.yazid.live",
  "http://yazid.live",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5174",
  "http://localhost:2222",
  "http://16.178.203.122",
  "http://16.178.203.122:5173",
  "http://16.178.203.122:2222"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        origin.endsWith(".yazid.live") ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1") ||
        process.env.NODE_ENV !== "production"
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
  })
);

/**************User Routes*************/

const authUser=require("./routes/user/auth")
const profile=require("./routes/user/profile")
const address=require("./routes/user/address")
const userProduct=require("./routes/user/product")
const cart=require("./routes/user/cart")
const wishlist= require("./routes/user/wishlist");
const checkout=require("./routes/user/checkout")
const order=require("./routes/user/order")
const wallet=require("./routes/user/wallet")
const review=require("./routes/user/review")
const referral=require("./routes/user/referral.js")

/**************Admin Routes**************/

const authAdmin=require("./routes/admin/auth")
const customer=require("./routes/admin/customer")
const category=require("./routes/admin/category")
const adminProduct=require("./routes/admin/product")
const brand=require("./routes/admin/brand")
const coupon=require("./routes/admin/coupon")
const adminOrder=require("./routes/admin/order")

/****************************************MAIN PART********************************************/

app.use("/user",authUser) 
app.use("/user/profile",profile)
app.use("/user/address",address)
app.use("/user/product",userProduct)
app.use("/user/cart",cart)
app.use("/user/wishlist", wishlist)
app.use("/user/checkout",checkout)
app.use("/user/order",order)
app.use("/user/wallet",wallet)
app.use("/user/review",review)
app.use("/user/referral",referral)
app.use("/admin",authAdmin)
app.use("/admin/customer",customer)
app.use("/admin/category",category)
app.use("/admin/product",adminProduct)
app.use("/admin/brand",brand)
app.use("/admin/coupon",coupon)
app.use("/admin/order",adminOrder)

// Support /api prefix for reverse proxy / production deployments
app.use("/api/user",authUser) 
app.use("/api/user/profile",profile)
app.use("/api/user/address",address)
app.use("/api/user/product",userProduct)
app.use("/api/user/cart",cart)
app.use("/api/user/wishlist", wishlist)
app.use("/api/user/checkout",checkout)
app.use("/api/user/order",order)
app.use("/api/user/wallet",wallet)
app.use("/api/user/review",review)
app.use("/api/user/referral",referral)
app.use("/api/admin",authAdmin)
app.use("/api/admin/customer",customer)
app.use("/api/admin/category",category)
app.use("/api/admin/product",adminProduct)
app.use("/api/admin/brand",brand)
app.use("/api/admin/coupon",coupon)
app.use("/api/admin/order",adminOrder)

const startServer = async () => {

    try {

        await connectDB();

        app.listen(2222, () => {
            console.log("*****BACKEND IS RUNNING*****")
        });

    } catch (error) {

        console.log("Server startup error:", error.message)

    }

}

startServer()