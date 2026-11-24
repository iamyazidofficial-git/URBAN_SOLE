const { STATUS_CODES } = require("../../constants/statusCodes");
const {
  addCouponService,
  getCouponService,
  editCouponService,
  deleteCouponService,
  toggleCouponStatusService,
} = require("../../service/coupon");

const addCoupon = async (req, res) => {
  try {
    const response = await addCouponService(req.body);
    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: response.message || "Coupon added successfully",
    });
  } catch (error) {
    console.log("Add coupon error:-", error);
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: error?.message || "Something went wrong",
    });
  }
};

const getCoupon = async (req, res) => {
  try {
    const response = await getCouponService("admin");
    return res.status(STATUS_CODES.OK).json({
      success: true,
      data: response,
      message: "Fetched successfully",
    });
  } catch (error) {
    console.log("Get coupon error:-", error);
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: error?.message || "Something went wrong",
    });
  }
};

const editCoupon = async (req, res) => {
  try {
    const response = await editCouponService(req.params?._id, req.body);
    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: response.message || "Coupon updated successfully",
    });
  } catch (error) {
    console.log("Edit coupon error:-", error);
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: error?.message || "Something went wrong",
    });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const response = await deleteCouponService(req.params._id);
    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: response.message || "Coupon deleted successfully",
    });
  } catch (error) {
    console.log("Delete coupon error:-", error);
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: error?.message || "Something went wrong",
    });
  }
};

const toggleCouponStatus = async (req, res) => {
  try {
    const response = await toggleCouponStatusService(req.params._id);
    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: response.message,
      status: response.status,
    });
  } catch (error) {
    console.log("Toggle coupon status error:-", error);
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: error?.message || "Something went wrong",
    });
  }
};

module.exports = {
  addCoupon,
  getCoupon,
  editCoupon,
  deleteCoupon,
  toggleCouponStatus,
};
