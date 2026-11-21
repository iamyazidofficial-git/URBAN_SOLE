const { getWalletService, getWalletTransactionService, processWalletTransactionService } = require("../../service/wallet");
const { STATUS_CODES } = require("../../constants/statusCodes");
const Razorpay = require("razorpay"); 

// 1. വാലറ്റ് ഡാറ്റ എടുക്കാൻ
const getWalletDetails = async (req, res) => {
    try {
        const userId = req.user._id;
        const wallet = await getWalletService(userId);

        // .JSON എന്നത് .json() ആക്കി മാറ്റിയിരിക്കുന്നു
        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: "Wallet fetched successfully",
            balance: wallet.balance,
            totalCredited: wallet.totalCredited,
            totalDebited: wallet.totalDebited
        });
    } catch (error) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: error?.message
        });
    }
};

// 2. ട്രാൻസാക്ഷൻ ഹിസ്റ്ററി എടുക്കാൻ
const getTransactions = async (req, res) => {
    try {
        const userId = req.user?._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const result = await getWalletTransactionService(userId, page, limit);
        return res.status(STATUS_CODES.OK).json({
            success: true,
            result: result
        });
    } catch (error) {
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message 
        }); 
    }
};

// 3. Razorpay Order ക്രിയേറ്റ് ചെയ്യാൻ (Frontend-ൽ നിന്ന് /createOrder വിളിക്കുമ്പോൾ ഇത് വർക്ക് ചെയ്യും)
const createOrder = async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "Invalid amount"
            });
        }

        const razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const options = {
            amount: Number(amount) * 100, // paise-ലേക്ക് മാറ്റുന്നു
            currency: "INR",
            receipt: `receipt_wallet_${Date.now()}`
        };

        const order = await razorpayInstance.orders.create(options);

        return res.status(200).json({
            success: true,
            id: order.id,
            amount: order.amount,
            currency: order.currency
        });

    } catch (error) {
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message
        });
    }
};

// 4. പെയ്മെന്റ് വെരിഫൈ ചെയ്ത് വാലറ്റിലേക്ക് എമൗണ്ട് ആഡ് ചെയ്യാൻ (/verify-topup)
const verifyTopup = async (req, res) => {
    try {
        const userId = req.user._id;
        const { amount, razorpay_order_id, razorpay_payment_id } = req.body;

        if (!amount || amount <= 0) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "Invalid amount"
            });
        }

        const result = await processWalletTransactionService({
            userId,
            amount: Number(amount),
            type: "CREDIT",
            source: "TOPUP",
            description: "Wallet Top-up via Razorpay",
            refferenceId: razorpay_payment_id || razorpay_order_id
        });

        return res.status(200).json({
            success: true,
            message: "Amount added to wallet successfully",
            newBalance: result.wallet.balance
        });

    } catch (error) {
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
            success: false,
            message: error.message
        });
    }
};

module.exports = { 
    getWalletDetails, 
    getTransactions, 
    createOrder, 
    verifyTopup 
};