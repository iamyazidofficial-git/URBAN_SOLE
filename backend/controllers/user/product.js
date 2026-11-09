const { getProductService, getSingleProductService } = require('../../service/product');

const getProducts = async (req, res) => {
  try {
    const queryParams = { ...req.query, role: 'user' };
    const result = await getProductService(queryParams);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getSingleProductService(id,"admin");
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getSingleProduct
};