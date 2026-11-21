const User = require("../models/user");
const ReferralTransaction = require("../models/refferalTransaction");

const getReferralDetailsService = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const user = await User.findById(userId).select("referralCode");
  if (!user) {
    throw new Error("User not found");
  }

  const successfulReferrals = await User.countDocuments({ referredBy: user._id });

  const earnedAgg = await ReferralTransaction.aggregate([
    { $match: { referrer: user._id, status: "COMPLETED", type: "CREDIT" } },
    { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
  ]);

  const totalEarned = earnedAgg.length > 0 ? earnedAgg[0].totalAmount : 0;

  return {
    success: true,
    data: {
      referralCode: user.referralCode || "",
      successfulReferrals,
      totalEarned
    }
  };
};

module.exports = {
  getReferralDetailsService
}