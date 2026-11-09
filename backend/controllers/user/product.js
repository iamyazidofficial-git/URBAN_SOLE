const { STATUS_CODES } = require('../../constants/statusCodes');
const { getProductService, getSingleProductService } = require('../../service/product');

const getProducts = async (req, res) => {
  try {
    const queryParams = { ...req.query, role: 'user' };
    const result = await getProductService(queryParams);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

const getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getSingleProductService(id,"admin");
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getSingleProduct
};
