/*****************************************IMPORTS**********************************************/

const express=require("express")
const bycrypt=require("bcryptjs")
const jwt=require("jsonwebtoken")
const dotenv = require("dotenv")
const cors=require("cors")

const connectDB = require("./config/db")
const app=express()
app.use(express.urlencoded({extended:true}))
app.use(express.json())
dotenv.config();
app.use(cors())


/**************User Routes*************/

const authUser=require("./routes/user/auth")
const profile=require("./routes/user/profile")
const address=require("./routes/user/address")
const userProduct=require("./routes/user/product")
const cart=require("./routes/user/cart")
const wishlist= require("./routes/user/wishlist");
const checkout=require("./routes/user/checkout")
const order=require("./routes/user/order")

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
app.use("/admin",authAdmin)
app.use("/admin/customer",customer)
app.use("/admin/category",category)
app.use("/admin/product",adminProduct)
app.use("/admin/brand",brand)
app.use("/admin/coupon",coupon)
app.use("/admin/order",adminOrder)

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