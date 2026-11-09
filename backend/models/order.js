const mongoose = require("mongoose")

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  variant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductVariant",
    required: true,
  },
  colour: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  itemTotal: {
  type: Number,
  required: true
},
  status: {
    type: String,
    enum: ["PENDING","PLACED","SHIPPED", "OUT_OF_DELIVERY", "DELIVERED", "CANCELLED", "RETURN_REQUESTED","RETURN_APPROVED", "RETURNED", "RETURN_REJECTED"],
    default: "PENDING",
  },
  statusTimeline: [{
    status: String,
    at: Date
  }],

  cancellation: {
  reason: String,
  at: Date,
  by: { type: String, enum: ["USER", "ADMIN"] }
},

returnInfo: {
  reason: String,
  images: [
    {
    url: String,
    publicId: String
  }
],
  requestedAt: Date,
  approvedAt: Date,
  rejectedAt: Date,
  rejectionReason:String,
  returendAt: Date
},

refundStatus: {
  type: String,
  enum: ["NONE", "REFUNDED"],
  default: "NONE"
},

refundedAmount: {
  type: Number,
  default: 0
}

});

const orderSchema = new mongoose.Schema(
  {
      orderId: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    customerSnapshot: {
      name: {type: String, required: true},
      email: {type: String, required: true}
    },

    items: [orderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      phoneNumber: { type: String, required: true },
      streetAddress: { type: String, required: true },
      appartment:{type:String},
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      addressType: {type:String, required:true}
    },

    payment: {
      method: {
        type: String,
        enum: ["CASHONDELIVERY", "RAZORPAY", "WALLET"],
        required: true
      },
      status: {
        type: String,
        enum: ["PENDING", "PAID", "FAILED","PARTIALLY_REFUNDED", "REFUNDED"],
        default: "PENDING"
      },
      transactionId: String,
      razorpayOrderId: { type: String, index: true },
      razorpayPaymentId: { type: String, index: true },
      razorpaySignature: String,
      refundedAmount: { type: Number, default: 0 }
    },

    orderStatus: {
      type: String,
      enum: ["PENDING", "PLACED", "SHIPPED", "OUT_OF_DELIVERY","RETURN_REQUESTED","RETURN_APPROVED","RETURN_REJECTED","DELIVERED", "CANCELLED", "RETURNED"],
      default: "PENDING",
    },

    appliedCoupon: {
      coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon"
      },
      code: String,
      discountPercentage: Number,
      discountAmount: Number
    },

    pricing: {
      subTotal: { type: Number, required: true },
      tax: { type: Number, required: true },
      taxPercentage: { type: Number, default: 18 }, // Store tax percentage
      shippingCharge: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      totalAmount: { type: Number, required: true },
    },
      cancellation: {
  reason: String,
  at: Date,
  by: { type: String, enum: ["USER", "ADMIN"] }
},
returnInfo: {
  reason: String,
  images: [
    {
    url: String,
    publicId: String
  }
],
  requestedAt: Date,
  approvedAt: Date,
  rejectedAt: Date,
  rejectionReason:String,
  returnedAt: Date
},

refundStatus: {
  type: String,
  enum: ["NONE", "REFUNDED"],
  default: "NONE"
},

refundedAmount: {
  type: Number,
  default: 0
},

    expiresAt:{
      type: Date,
      index: true
    },

    deliveredAt: Date
  },
  { timestamps: true }
);

// Index for faster queries
orderSchema.index({ user: 1, createdAt: -1 });

orderSchema.index({ orderStatus: 1});

orderSchema.index({ "customerSnapshot.name": 1});
orderSchema.index({ "customerSnapshot.email": 1});

orderSchema.index({ createdAt: 1, "payment.status": 1 });
orderSchema.index({ "payment.method": 1 });
orderSchema.index({ "items.product": 1 });



module.exports = mongoose.model("Order", orderSchema)