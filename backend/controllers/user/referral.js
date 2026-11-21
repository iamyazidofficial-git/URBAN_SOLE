const { getReferralDetailsService } = require("../../service/referral");

const getReferralDetails = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access"
      });
    }


    const result = await getReferralDetailsService(userId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch referral details"
    });
  }
};

module.exports = {
  getReferralDetails
};