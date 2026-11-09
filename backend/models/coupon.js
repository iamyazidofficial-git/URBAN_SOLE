const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Coupon name is required'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  discountType: {
    type: String,
    enum: ['Percentage', 'Flat'],
    required: true,
    default: 'Percentage',
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
  },
  minCart: {
    type: Number,
    default: 0,
  },
  maxDiscount: {
    type: Number,
    default: null, 
  },
  usageCount: {
    type: Number,
    required: [true, 'Usage count limit is required'],
    default: 100,
  },
  usedCount:{
    type: Number,
    default:0
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required'],
  },
  status: {
    type: String,
    enum:["Active","InActive"],
    default:"Active"
  },
  usedBy:{
    type:Array,
    default:[]
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Coupon', couponSchema);