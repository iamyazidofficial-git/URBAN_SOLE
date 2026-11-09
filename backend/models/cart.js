const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity cannot be less than 1.'],
      default: 1,
    },
    size: {
      type: String,
      required: true,
      trim: true,
    },
    colour: {
      type: String,
      required: true,
      trim: true,
    },
    // Optional: Cache current price at time of adding to track price changes
    price: {
      type: Number,
      required: true,
    },
    img:{
        type:String
    }
  },
  { _id: true }
);

const CartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One cart per user
    },
    items: [CartItemSchema],
  },
  {
    timestamps: true,
  }
);

module.exports=mongoose.model("Cart",CartSchema,"cart")