const Wallet = require("../models/wallet.js");
const WalletTransaction = require("../models/walletTransaction.js");
const mongoose = require("mongoose");

const getWalletService = async (userId) => {
    if (!userId) {
        throw new Error("UserId is not passed");
    }
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
        wallet = await Wallet.create({ user: userId, balance: 0 });
    }

    return wallet;
};

const getWalletTransactionService = async (userId, page = 1, limit = 10) => {
    if (!userId) {
        throw new Error("UserId is not passed");
    }
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 10);
    const skip = (pageNum - 1) * limitNum;

    const transactions = await WalletTransaction.find({ user: userId })
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 });

    const totalTransactions = await WalletTransaction.countDocuments({ user: userId });

    return {
        transactions,
        totalPages: Math.ceil(totalTransactions / limitNum),
        currentPage: pageNum,
        totalTransactions: totalTransactions
    };
};

const processWalletTransactionService = async ({
    userId,
    amount,
    type,
    source,
    orderId = null,
    description = "",
    refferenceId = ""
}) => {
    try {
        let wallet = await Wallet.findOne({ user: userId });
        if (!wallet) {
            wallet = new Wallet({ user: userId, balance: 0 });
        }

        if (type === "DEBIT") {
            if (wallet.balance < amount) {
                throw new Error("Insufficient wallet balance");
            }
            wallet.balance -= amount;
            wallet.totalDebited = (wallet.totalDebited || 0) + amount;
        } else if (type === "CREDIT") {
            wallet.balance += amount;
            wallet.totalCredited = (wallet.totalCredited || 0) + amount;
        } else {
            throw new Error("Invalid transaction type");
        }

        await wallet.save();

        const transaction = await WalletTransaction.create({
            wallet: wallet._id,
            user: userId,
            type: type,
            source: source?.trim(),
            amount: amount,
            order: orderId,
            description: description?.trim(),
            refferenceId: refferenceId
        });

        return { wallet, transaction };

    } catch (error) {
        throw error;
    }
};

module.exports = { 
    getWalletService, 
    getWalletTransactionService, 
    processWalletTransactionService 
};