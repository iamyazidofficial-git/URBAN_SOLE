const Order=require("../models/order")
const Product=require("../models/product")

const addReviewService=async(userId,reviewData)=>{
    const { product, rating, title, comment } = reviewData;

    if (!product || !rating || !title || !comment) {
        throw new Error("All fields are required");
    }

    if (rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5");
    }

    const cleanTitle = title.trim();
    const cleanComment = comment.trim();
    const letterCountInTitle = (cleanTitle.match(/[a-zA-Z]/g) || []).length;
    const nonSpaceCharsInComment = cleanComment.replace(/\s/g, "").length;

    if (letterCountInTitle < 4 || !/^[a-zA-Z ]+$/.test(cleanTitle)) {
        throw new Error("Review title must contain at least 4 letters and only letters/spaces");
    }

    if (nonSpaceCharsInComment < 10) {
        throw new Error("Review comment must contain at least 10 non-space characters");
    }

    console.log("PROOO",product)

const orders = await Order.find({
    user: userId,
    "items.product": product
});

let isValidPurchase = false;
const allowedStatuses = ["DELIVERED","RETURNED", "RETURN_REJECTED", "RETURN_REQUESTED","RETURN_APPROVED"];

if (orders && orders.length > 0) {
    for (const order of orders) {
        for (const item of order.items) {
            if (
                item.product.toString() === product.toString() && 
                allowedStatuses.includes(item.status)
            ) {
                isValidPurchase = true;
                break;
            }
        }
        if (isValidPurchase) break;
    }
}

if (!isValidPurchase) {
    throw new Error("This Product is not Purchased");
}

    const reviewProduct = await Product.findById(product);
if (!reviewProduct) {
    throw new Error("Product not found");
}

const existingReview = reviewProduct.reviews.find(
    (rev) => rev.user.toString() === userId.toString()
);

if (existingReview) {
    throw new Error("Review is already added");
}

    const newReview = {
        user: userId,
        product,
        rating,
        title: cleanTitle,
        comment: cleanComment
    }

    if (!reviewProduct.reviews) {
    reviewProduct.reviews = [];
}

    reviewProduct.reviews.push(newReview)

    const totalReviews = reviewProduct.reviews.length;
    const sumRatings = reviewProduct.reviews.reduce((acc, rev) => acc + rev.rating, 0);
    reviewProduct.averageRating = sumRatings / totalReviews;

    await reviewProduct.save()

    return newReview;
}







const getReviewService = async (userId) => {
    const stringUserId = userId.toString();
    
    // 🔴 .populate("vartiant") ഉപയോഗിച്ച് വേരിയന്റ് ഡാറ്റയും ഒപ്പം ഫെച്ച് ചെയ്യുക
    const products = await Product.find({ "reviews.user": userId })
        .populate("vartiant")
        .lean();
    
    let userReviews = [];

    products.forEach(product => {
        if (product.reviews && Array.isArray(product.reviews)) {
            // പ്രൊഡക്റ്റിന്റെ വേരിയന്റുകളിൽ നിന്ന് ആദ്യത്തെ ഇമേജ് കണ്ടെത്തുക
            let productImage = "";
            if (product.vartiant && product.vartiant.length > 0) {
                // ആദ്യത്തെ വേരിയന്റിൽ ഇമേജുകൾ ഉണ്ടോ എന്ന് നോക്കുക
                for (const v of product.vartiant) {
                    if (v.images && v.images.length > 0) {
                        productImage = v.images[0];
                        break;
                    }
                }
            }

            product.reviews.forEach(rev => {
                if (rev.user && rev.user.toString() === stringUserId) {
                    userReviews.push({
                        _id: rev._id,
                        productId: product._id,
                        productName: product.name || "Product", 
                        productImage: productImage, // 🔴 വേരിയന്റിൽ നിന്ന് എടുത്ത ഇമേജ് ഇവിടെ നൽകുന്നു
                        rating: rev.rating,
                        title: rev.title,
                        comment: rev.comment,
                        createdAt: rev.createdAt || new Date(),
                    });
                }
            });
        }
    });

    return userReviews;
};



const deleteReviewService = async (userId, reviewId) => {
    const stringUserId = userId ? userId.toString() : "";

    const product = await Product.findOne({ "reviews._id": reviewId });

    if (!product) {
        throw new Error("Review not found");
    }

    const review = product.reviews.id(reviewId);

    if (!review) {
        throw new Error("Review not found");
    }

    const reviewUserId = review.user ? review.user.toString() : "";

    if (!reviewUserId || !stringUserId || reviewUserId !== stringUserId) {
        throw new Error("Unauthorized to delete this review");
    }

    product.reviews.pull(reviewId);

    const totalReviews = product.reviews.length;
    if (totalReviews > 0) {
        const sumRatings = product.reviews.reduce((acc, rev) => acc + rev.rating, 0);
        product.averageRating = Number((sumRatings / totalReviews).toFixed(1));
    } else {
        product.averageRating = 0;
    }

    await product.save();

    return { success: true, message: "Review deleted successfully" };
};




const getProductReviewService = async (productId) => {
    if (!productId) {
        throw new Error("Product ID is required");
    }

    const product = await Product.findById(productId)
        .populate({
            path: "reviews.user",
            select: "name email" 
        })
        .lean();

    if (!product) {
        throw new Error("Product not found");
    }

    return {
        averageRating: product.averageRating || 0,
        totalReviews: product.reviews ? product.reviews.length : 0,
        reviews: product.reviews || []
    };
};

module.exports={addReviewService,getReviewService,deleteReviewService,getProductReviewService}