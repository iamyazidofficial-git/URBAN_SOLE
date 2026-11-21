const jwt=require("jsonwebtoken")
const {addReviewService,getReviewService,deleteReviewService,getProductReviewService}=require("../../service/review")
const User=require("../../models/user");
const { STATUS_CODES } = require("../../constants/statusCodes");

const addReview = async (req, res) => {
    try {
        const token=req.headers.authorization.split(" ")[1]
       const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
if (!token || !decoded) {
    return res.status(400).json({
        success: false,
        message: "Unauthorized please login"
    });
}

const user = await User.findById(decoded._id);
if (!user) {
    return res.status(400).json({
        success: false,
        message: "Unauthorized please login"
    });
}
      
        const reviewData = req.body;

        const response = await addReviewService(user._id, reviewData);

        return res.status(201).json({
            success: true,
            message: "Review added successfully",
        });

    } catch (error) {
        console.error("Add Review Error:", error);
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to add review"
        });
    }
};



const getReview = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
       if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized please login"
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized please login"
            });
        }

        const userId = decoded._id;
        const reviews = await getReviewService(userId);

        return res.status(200).json({
            success: true,
            data: reviews
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch reviews"
        });
    }
};




const deleteReview = async (req, res) => {
    try {
        const userId = req.user?._id || req.decoded?._id;
        const { reviewId } = req.params;

        const result = await deleteReviewService(userId, reviewId);

        return res.status(200).json(result);
    } catch (error) {
        console.log(error)
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to delete review"
        });
    }
};


const getProductReview = async (req, res) => {
    try {
        const { productId } = req.params; 

        const result = await getProductReviewService(productId);

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to fetch product reviews"
        });
    }
};



module.exports={addReview,getReview,deleteReview,getProductReview}