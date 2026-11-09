const mongoose = require("mongoose")

const reviewsSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: { type: Number, min: 1, max: 5, required: true },
    title: { type: String, required: true, trim: true },
    comment: { type: String, required: true, trim: true },
  },
  { timestamps: true },
)

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: "Category",
      required: true,
    },
    brand: { type: mongoose.Schema.ObjectId, ref: "Brand", required: true },
    description: { type: String, trim: true, required: true },
    vartiant: [{ type: mongoose.Schema.ObjectId, ref: "Variant" }],
    gender: {
      type: String,
      enum: ["Men", "Women", "Sports"], 
      required: true,
    },
    countryOfOrgin: {
      type: String,
      required: true,
    },
    price: { type: Number, default: 0, required: true },
    offer: { type: Number, min: 0, max: 90 },
    offerExpiry: { type: Date },
    status: { type: String, enum: ["Active", "InActive"], default: "Active" },
    isListed: { type: Boolean, default: true },
    reviews: [reviewsSchema],
    averageRating: { type: Number, default: 0 },
  },
  { timestamps: true },
)

module.exports = mongoose.model("Product", productSchema, "product")





