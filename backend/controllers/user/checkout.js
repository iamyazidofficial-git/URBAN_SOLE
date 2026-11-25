const {fetchCheckoutService,placeOrderService,verifyPaymentService,retryPaymentService}=require("../../service/order")
const {getCouponService}=require("../../service/coupon")
const Coupon=require("../../models/coupon")
const jwt=require("jsonwebtoken")

const fetchCheckout=async(req,res)=>{
    try{
        let userId = req.user?._id || req.user?.id || null;
        const authHeader = req.headers.authorization;
        if (!userId && authHeader && authHeader.startsWith("Bearer ")) {
            try {
                const token = authHeader.split(" ")[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
                userId = decoded?._id || decoded?.id || decoded?.userId;
            } catch (e) {}
        }

        const productData = req.query.productData ? JSON.parse(req.query.productData) : null;
        const selectedCoupon=req.query.selectedCoupon || ""
        const type=req.query.type
        const response=await fetchCheckoutService(productData,selectedCoupon,type,userId)
        const coupons=await getCouponService("user", response?.subTotal || response?.totalAmount, userId)

        return res.status(200).json({
            success:true,
            message:"Checkout fetched successfully",
            data:response,
            coupons:coupons
        })
    }catch(error){
        console.log("fetchCheckout:-",error)
        return res.status(400).json({
            success:false,
            message:error?.message || "Failed to fetch checkout"
        })
    }
}

const applyCoupon=async(req,res)=>{
    try{
        let userId = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            try {
                const token = authHeader.split(" ")[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
                userId = decoded._id;
            } catch (e) {}
        }

        const { code, productData: productDataRaw } = req.body;
        if (!code || !code.trim()) {
            return res.status(400).json({ success: false, message: "Please enter a coupon code" });
        }

        const cleanCode = code.trim().toUpperCase();
        const coupon = await Coupon.findOne({ code: cleanCode, status: "Active" });

        if (!coupon) {
            return res.status(400).json({ success: false, message: "Invalid or inactive coupon code" });
        }

        const currentDate = new Date();
        if (new Date(coupon.expiryDate) < currentDate || (coupon.usageCount && coupon.usedCount >= coupon.usageCount)) {
            await Coupon.deleteOne({ _id: coupon._id });
            return res.status(400).json({ success: false, message: "Coupon has expired or limit reached" });
        }

        if (userId && coupon.usedBy && coupon.usedBy.some(u => u?.toString() === userId?.toString())) {
            return res.status(400).json({ success: false, message: "You have already used this coupon" });
        }

        let productData = [];
        if (typeof productDataRaw === "string") {
            try { productData = JSON.parse(productDataRaw); } catch { productData = []; }
        } else if (Array.isArray(productDataRaw)) {
            productData = productDataRaw;
        }

        let subTotal = 0;
        if (Array.isArray(productData) && productData.length > 0) {
            const productIds = productData.map(item => item.product || item._id).filter(Boolean);
            const dbProducts = await Product.find({ _id: { $in: productIds } }).select("price offer").lean();
            const dbMap = new Map(dbProducts.map(p => [p._id.toString(), p]));

            for (let item of productData) {
                const prodId = (item.product || item._id)?.toString();
                const dbProd = dbMap.get(prodId);
                let price = Number(item.price) || Number(dbProd?.price) || 0;
                let offer = (item.offer !== undefined && item.offer !== null && Number(item.offer) > 0)
                    ? Number(item.offer)
                    : (dbProd?.offer || 0);

                if (offer > 0) {
                    price = Math.round(price - (price * offer) / 100);
                }
                const qty = Math.max(1, Number(item.quantity) || 1);
                subTotal += price * qty;
            }
        }

        if (subTotal < (coupon.minCart || 0)) {
            return res.status(400).json({
                success: false,
                message: `Minimum cart amount of ₹${coupon.minCart} is required for this coupon`
            });
        }

        return res.status(200).json({
            success: true,
            message: "Coupon applied successfully",
            couponId: coupon._id,
            coupon: coupon
        });
    }catch(error){
        console.log("applyCoupon:-", error);
        return res.status(400).json({
            success: false,
            message: error?.message || "Failed to apply coupon"
        });
    }
}

const placeOrder=async(req,res)=>{
    try{
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
        }
        const token = authHeader.split(" ")[1];
        const user = jwt.verify(token, process.env.JWT_SECRET_KEY);

        const userId = user._id;
        req.body.userId = userId;

        const response = await placeOrderService(req.body);

        return res.status(200).json({
            success: true,
            message: "Order Placed",
            data: response
        });
    }catch(error){
        console.log("JJJJ",error);
        return res.status(400).json({
            success: false,
            message: error?.message || "Failed to place order"
        });
    }
}

const verifyPayment = async (req, res) => {
    try {
        const result = await verifyPaymentService(req.body);
        return res.status(200).json(result);
    } catch (error) {
        console.log("ERR",error);
        return res.status(400).json({ success: false, message: error.message });
    }
}

const retryPayment = async (req, res) => {
    try {
        const response = await retryPaymentService(req.body);
        return res.status(200).json({
            success: true,
            data: response
        });
    } catch (error) {
        console.log("ERR",error);
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports={
    fetchCheckout,applyCoupon,placeOrder,verifyPayment,retryPayment
}