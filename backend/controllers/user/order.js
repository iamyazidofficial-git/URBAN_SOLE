const {
  getOrderService,
  trackOrderService,
  cancelProductService,
  cancelOrderService,
  returnProductService,
  returnOrderService
} = require("../../service/order.js");
const jwt = require("jsonwebtoken");

const getOrder = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const user = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!token) {
      return res.status(400).json({ success: false, message: "UnAuthorized" });
    }

    const userId = user._id;

    const response = await getOrderService("user", userId);
    return res.status(200).json({
      success: true,
      message: "Orders fetched succesfully",
      data: response,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: error?.response?.message,
    });
  }
};

const trackOrder = async (req, res) => {
  try {
    const response = await trackOrderService(req.params);
    return res.status(200).json({
      success: true,
      message: "Tracked successfully",
      data: response,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: error?.message,
    });
  }
};




const cancelOrder = async (req, res) => {
  try {
    const response=await cancelOrderService(req.params)
 return res.status(200).json({
      success: true,
      message: "Order Cancelled Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: error?.message||"Something went wrong"
    });
  }
};






const cancelProduct = async (req, res) => {
  try {
    const response=await cancelProductService(req.params,req.body)
 return res.status(200).json({
      success: true,
      message: "Product Cancelled Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: error?.message||"Something went wrong"
    });
  }
};










const returnOrder = async (req, res) => {
  try {
    const response=await returnOrderService(req.params,req.body)
 return res.status(200).json({
      success: true,
      message: "Order Returned Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: error?.message||"Something went wrong"
    });
  }
};










const returnProduct = async (req, res) => {
  try {
    const response=await returnProductService(req.params,req.body)
 return res.status(200).json({
      success: true,
      message: "Product Returned Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: error?.message||"Something went wrong"
    });
  }
};

module.exports = { getOrder, trackOrder,cancelOrder,cancelProduct,returnOrder,returnProduct};
