const Wishlist = require("../../models/wishlist")
const Cart = require("../../models/cart")
const jwt = require("jsonwebtoken")
const Product=require("../../models/product")

/*--------------------------------------GET WISHLIST---------------------------------------*/

const getWishlist = async (req, res) => {
try {
  let token = req.headers.authorization;
  if (!token) return res.status(401).json({ success: false, message: "No token provided" });

  if (token.startsWith("Bearer ")) {
    token = token.split(" ")[1];
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  const userId = decoded._id || decoded.id;

  let wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, products: [] });
  }

  const productIds = wishlist.products.map(p => p._id ? p._id.toString() : p.toString());

  const activeProducts = await Product.find({
    _id: { $in: productIds },
    isListed: true,
    status: "Active"
  }).select("_id");

  const validProductIds = activeProducts.map(product => product._id);

  if (validProductIds.length !== wishlist.products.length) {
    wishlist.products = validProductIds;
    await wishlist.save();
  }

  // 4. Populate the wishlist products right before sending the response
  const populatedWishlist = await Wishlist.findOne({ user: userId }).populate({
    path: "products",
    populate: [
      { path: "category" },
      { path: "brand" },
      { path: "vartiant" }
    ]
  });

  return res.status(200).json({ success: true, data: populatedWishlist });

} catch (error) {
  console.log("Get Wishlist Error:", error);
  return res.status(500).json({ success: false, message: "Internal server error" });
}
};




/*---------------------------------ADD WISHLIST-------------------------------------*/

const addToWishlist = async (req, res) => {
    try {
        let token = req.headers.authorization
        if (!token) return res.status(401).json({ success: false, message: "No token provided" })

        if (token.startsWith("Bearer ")) {
            token = token.split(" ")[1]
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
        const userId = decoded._id || decoded.id
        const { productId } = req.body

        if(!productId){
            return res.status(400).json({
                success:false,
                message:"Product Id is not passed"
            })
        }

        const existingProduct=await Product.findOne({_id:productId})

        if(!existingProduct||existingProduct.status=="InActive"||existingProduct.isListed==false){
              return res.status(400).json({
                success:false,
                message:"Product is not found"
            })
        }

        const existingWishlist=await Wishlist.findOne({user:userId})

        if(existingWishlist){
            const existingItem=existingWishlist?.products.find(item=>item==productId)

            if(existingItem){
                return res.status(400).json({
                    success:false,
                    message:"Product allready exists in you wishlist"
                })
            }

            const existingCart=await Cart.findOne({user:userId})
            const isCartProduct=existingCart?.items?.find(item=>item.product==productId)

            console.log("existingCart",existingCart)
            console.log("ISCART",isCartProduct)

            if(isCartProduct){
                return res.status(400).json({
                    success:false,
                    message:"This Product allready in your cart"
                })
            }


            existingWishlist.products.push(productId)
            await existingWishlist.save()

            return res.status(200).json({
                success:true,
                message:"Added to product successfully",
                data:existingWishlist
            })

        }
        else{

            const existingCart=await Cart.findOne({user:userId})
            const isCartProduct=existingCart?.items?.find(item=>item==productId)

            if(isCartProduct){
                return res.status(400).json({
                    success:false,
                    message:"This Product allready in your cart"
                })
            }

           const newWishList=await Wishlist.create({user:userId,products:[productId]})

           return res.status(200).json({
            success:true,
            message:"Added to wishlist successfully",
            data:newWishList
           })

        }

    } catch (error) {
        console.log("Add Wishlist Error:", error)
        return res.status(500).json({ success: false, message: "Internal server error" })
    }
}




/*--------------------------------------REMOVE---------------------------------------*/

const removeFromWishlist = async (req, res) => {
    try {
        let token = req.headers.authorization
        if (!token) return res.status(401).json({ success: false, message: "No token provided" })

        if (token.startsWith("Bearer ")) {
            token = token.split(" ")[1]
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
        const userId = decoded._id || decoded.id
        const { productId } = req.body

        let wishlist = await Wishlist.findOne({ user: userId })
        if (wishlist) {
            wishlist.products = wishlist.products.filter(id => id.toString() !== productId)
            await wishlist.save()
        }

        const updatedWishlist = await Wishlist.findOne({ user: userId }).populate({
            path: "products",
            populate: [
                { path: "brand" },
                { path: "category" },
                { path: "vartiant" }
            ]
        })

        return res.status(200).json({ success: true, message: "Removed from wishlist", data: updatedWishlist })
    } catch (error) {
        console.log("Remove Wishlist Error:", error.message)
        return res.status(500).json({ success: false, message: "Internal server error" })
    }
}

module.exports = { getWishlist, addToWishlist, removeFromWishlist }