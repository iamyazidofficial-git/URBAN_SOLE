const mongoose=require("mongoose")

const referralTransactionSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    referee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    type: {
      type: String,
      enum: ["CREDIT", "REVERSAL"],
      default: "CREDIT",
    },

    status: {
      type: String,
      enum: ["COMPLETED", "CANCELLED"],
      default: "COMPLETED",
      index: true
    },

    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

referralTransactionSchema.index({ referrer: 1, referee: 1 },{ unique: true });

module.exports = mongoose.model("ReferralTransaction", referralTransactionSchema);