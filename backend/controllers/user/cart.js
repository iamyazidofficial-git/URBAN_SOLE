const Cart = require("../../models/cart")
const Product = require("../../models/product")
const Wishlist = require("../../models/wishlist")
const jwt=require("jsonwebtoken")

/*--------------------------------------STOCK---------------------------------------*/

const getVariantStock = (productDoc, colour, size) => {

    const variants = productDoc.vartiant || productDoc.variants || productDoc.variant || []
    const matchedVariant = variants.find(v => 
        String(v.colour).trim().toLowerCase() === String(colour).trim().toLowerCase()
    )
    if (!matchedVariant || !matchedVariant.inventory) return 0

    const matchedInventory = matchedVariant.inventory.find(i => Number(i.size) === Number(size))
    return matchedInventory ? Number(matchedInventory.quantity) : 0
}



/*--------------------------------------ADD TO CART---------------------------------------*/

const addToCart = async (req, res) => {
    try {
        const { _id, name, price, size, colour, img, quantity = 1 } = req.body.product;
        const token = req.headers.authorization.split(" ")[1];
        const user = jwt.verify(token, process.env.JWT_SECRET_KEY);

        const cleanName = name?.trim();
        const cleanColour = colour?.trim();
        const parsedQuantity = Number(quantity) || 1

        if (!token) {
            return res.status(400).json({ success: false, message: "UnAuthorized" })
        }
        if (!_id) {
            return res.status(400).json({ success: false, message: "ProductId is Required" });
        }
        
        if (!cleanName) {
            return res.status(400).json({ success: false, message: "Product Name is Required" });
        }
        if (!size) {
            return res.status(400).json({ success: false, message: "Size is Required" });
        }
        if (!price) {
            return res.status(400).json({ success: false, message: "Price is Required" });
        }
        if (!img) {
            return res.status(400).json({ success: false, message: "Img is requried" });
        }
        if (!colour) {
            return res.status(400).json({ success: false, message: "Colour is requried" });
        }

        const existingProduct = await Product.findOne({ _id: _id }).populate("vartiant")
        if (!existingProduct) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        if(existingProduct.status=="InActive"){
          return res.status(404).json({ success: false, message: "Product is unavailable" })
        }
        const existingVariant = existingProduct.vartiant.find(t => t.colour === cleanColour);
        const existingStock = existingVariant?.inventory?.find(t => String(t.size) === String(size))?.quantity || 0;

        if (parsedQuantity > existingStock || parsedQuantity > 5) {
            return res.status(400).json({
                success: false,
                message: `Cannot add more than available stock (${existingStock}) or max limit (5)`
            });
        }

        // Remove from wishlist if it exists there
        const existingWishlist = await Wishlist.findOne({ user: user._id })
        const existingWishlistItem = existingWishlist?.products.find(item => item == _id)
        if (existingWishlistItem) {
            existingWishlist.products = existingWishlist.products.filter(item => item != _id)
            await existingWishlist.save()
        }

        const existingCart = await Cart.findOne({ user: user._id })

        if (existingCart) {if (existingCart) {

    // Get all product IDs from cart
    const cartProductIds = existingCart.items.map(item => item.product)

    // Find only active and listed products
    const activeProducts = await Product.find({
        _id: { $in: cartProductIds },
        isListed: true,
        status: "Active"
    }).select("_id")

    // Get valid product IDs
    const validProductIds = activeProducts.map(product => product._id.toString())

    // Remove blocked and deleted products
    existingCart.items = existingCart.items.filter(item =>
        validProductIds.includes(item.product.toString())
    )

    await existingCart.save()
}
            const existingItem = existingCart.items.find(item => item.size == size && item.colour === cleanColour);

            if (existingItem) {
                const totalNewQuantity = existingItem.quantity + parsedQuantity

                if (totalNewQuantity > 5) {
                    return res.status(400).json({
                        success: false,
                        message: `Already have ${existingItem.quantity} quantity, maximum allowed total is 5`
                    });
                }

                if (totalNewQuantity > existingStock) {
                    return res.status(400).json({
                        success: false,
                        message: `Already have ${existingItem.quantity} products maximum stock is ${existingStock}`
                    });
                }

                existingItem.quantity = totalNewQuantity
                await existingCart.save();

                return res.status(200).json({
                    success: true,
                    message: "Added to cart successfully",
                    data: existingCart
                });
            }

            const newItem = {
                product: _id,
                quantity: parsedQuantity,
                size: size,
                colour: cleanColour,
                price: price,
                img: img
            };

            existingCart.items.push(newItem)
            await existingCart.save();

            return res.status(200).json({
                success: true,
                message: "Added to cart successfully",
                data: existingCart
            })
        } else {
            const newItem = {
                product: _id,
                quantity: parsedQuantity,
                size: size,
                colour: cleanColour,
                price: price,
                img: img
            };

            const newCart = await Cart.create({ user: user._id, items: [newItem] });
            return res.status(200).json({
                success: true,
                message: "Cart added successfully",
                data: newCart
            });
        }

    } catch (error) {
        console.log("AddToCart Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}





/*--------------------------------------GET CART---------------------------------------*/

const getCart = async (req, res) => {
try {
  const token = req.headers?.authorization?.split(" ")[1];
  if (!token) {
    return res.status(400).json({
      success: false,
      message: "UnAuthorized"
    });
  }

  const user = jwt.verify(token, process.env.JWT_SECRET_KEY);

  let existingCart = await Cart.findOne({ user: user._id }).populate({
    path: "items.product",
    select: "category name brand offer price isListed status",
    populate: { path: "category", select: "name" }
  });

  // If cart doesn't exist yet, return an empty cart structure gracefully
  if (!existingCart) {
    return res.status(200).json({
      success: true,
      message: "Cart is empty",
      data: { items: [] }
    });
  }

  // Filter out inactive, deleted, or unlisted products
  const cartProductIds = existingCart.items.map(item => item.product?._id || item.product);

  const activeProducts = await Product.find({
    _id: { $in: cartProductIds },
    isListed: true,
    status: "Active"
  }).select("_id");

  const validProductIds = activeProducts.map(product => product._id.toString());
  
  const filteredItems = existingCart.items.filter(item => {
    const prodId = item.product?._id ? item.product._id.toString() : item.product?.toString();
    return validProductIds.includes(prodId);
  });

  // If items were filtered out, save the updated cart
  if (filteredItems.length !== existingCart.items.length) {
    existingCart.items = filteredItems;
    await existingCart.save();
    
    // Re-populate after saving to ensure frontend gets full product details
    existingCart = await Cart.findById(existingCart._id).populate({
      path: "items.product",
      select: "category name brand offer price",
      populate: { path: "category", select: "name" }
    });
  }

  return res.status(200).json({
    success: true,
    message: existingCart.items.length > 0 ? "Fetched successfully" : "Cart is empty",
    data: existingCart
  });

} catch (error) {
  console.log("GetCart Error:", error?.message);
  return res.status(400).json({ success: false, message: "Failed to fetch" });
}
};





/*--------------------------------------DELETE CART---------------------------------------*/

const deleteItem = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader.split(" ")[1];
        const user = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const itemId = req.params._id;
const updatedCart = await Cart.findOneAndUpdate(
            { user: user._id },
            { $pull: { items: { _id: itemId } } },
            { new: true }
        ).populate({
            path: "items.product",
            populate: [
                { path: "category", select: "name" },
                { path: "brand", select: "name" },
                { path: "vartiant" }
            ]
        })

        return res.status(200).json({
            success: true,
            message: "Deleted successfully",
            data: updatedCart
        });
    } catch (error) {
        console.log("Remove Item Error:", error.message);
        return res.status(400).json({
            success: false,
            message: "Failed to remove"
        });
    }
};





/*--------------------------------------INCREASE---------------------------------------*/

const increaseQuantity = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader.split(" ")[1];
        const user = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const itemId = req.params._id;

        let cart = await Cart.findOne({ user: user._id }).populate({
            path: "items.product",
            populate: { path: "vartiant" }
        });
        if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

        const item = cart.items.id(itemId);
        if (!item) return res.status(404).json({ success: false, message: "Item not found" });

        const currentStock = getVariantStock(item.product, item.colour, item.size);

        if (item.quantity >= currentStock || item.quantity >= 5) {
            return res.status(400).json({ success: false, message: `Cannot increase. Available stock limit is ${currentStock}` });
        }

        item.quantity += 1;
        await cart.save();

const updatedCart = await Cart.findOne({ user: user._id }).populate({
            path: "items.product",
            populate: [
                { path: "category", select: "name" },
                { path: "brand", select: "name" },
                { path: "vartiant" }
            ]
        });

        return res.status(200).json({
            success: true,
            message: "Updated successfully",
            data: updatedCart
        });
    } catch (error) {
        console.log("Increase Quantity Error:", error.message);
        return res.status(400).json({ success: false, message: "Failed to increase" });
    }
}

/*--------------------------------------DECREASE---------------------------------------*/

const decreaseQuantity = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader.split(" ")[1];
        const user = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const itemId = req.params._id;

        const cart = await Cart.findOne({ user: user._id });
        if (!cart) return res.status(404).json({ success: false, message: "Cart is not available" });

        const item = cart.items.id(itemId);
        if (!item) return res.status(404).json({ success: false, message: "Item is not availale" });

        if (item.quantity <= 1) {
            return res.status(400).json({ success: false, message: "Minimum quantity is 1" });
        }

        const updatedCart = await Cart.findOneAndUpdate(
            { user: user._id, "items._id": itemId },
            { $inc: { "items.$.quantity": -1 } },
            { new: true }
        ).populate({
            path: "items.product",
            populate: [
                { path: "category", select: "name" },
                { path: "brand", select: "name" },
                { path: "vartiant" }
            ]
        });

        return res.status(200).json({
            success: true,
            message: "Updated successfully",
            data: updatedCart
        });
    } catch (error) {
        console.log("Decrease Quantity Error:", error.message);
        return res.status(400).json({ success: false, message: "Failed to decrease" });
    }
}

module.exports = { addToCart, getCart, increaseQuantity, decreaseQuantity, deleteItem };