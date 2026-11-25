const mongoose = require("mongoose");
const Coupon = require("../models/coupon");

const addCouponService = async (couponData) => {
  const {
    name,
    code,
    expiryDate,
    usageCount,
    minCart,
    maxDiscount,
    discountType,
    discountValue,
  } = couponData;

  const cleanName = (name || "").trim();
  const cleanCode = (code || "").trim().toUpperCase();

  if (!cleanName || cleanName.length < 4) {
    throw new Error("Name must contain at least 4 characters");
  }

  if (!/^[a-zA-Z0-9\s]+$/.test(cleanName)) {
    throw new Error("Name must contain only letters and numbers");
  }

  if ((cleanName.match(/[a-zA-Z]/g) || []).length < 2) {
    throw new Error("Name must contain at least 2 letters");
  }

  const existingName = await Coupon.findOne({
    name: { $regex: new RegExp(`^${cleanName}$`, "i") },
  });
  if (existingName) {
    throw new Error("Coupon name already exists");
  }

  if (!cleanCode) {
    throw new Error("Coupon code is required");
  }

  if (/\s/.test(cleanCode)) {
    throw new Error("Coupon code cannot contain spaces");
  }

  if (cleanCode.length < 8) {
    throw new Error("Coupon code must contain at least 8 characters");
  }

  if ((cleanCode.match(/[a-zA-Z]/g) || []).length < 4) {
    throw new Error("Coupon code must contain at least 4 letters");
  }

  const existingCode = await Coupon.findOne({ code: cleanCode });
  if (existingCode) {
    throw new Error("Coupon code already exists");
  }

  if (!expiryDate) {
    throw new Error("Expiry date is required");
  }

  const inputDate = new Date(expiryDate);
  if (Number.isNaN(inputDate.getTime())) {
    throw new Error("Invalid expiry date");
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const compareDate = new Date(expiryDate);
  compareDate.setHours(0, 0, 0, 0);

  if (compareDate < todayStart) {
    throw new Error("Expiry date cannot be in the past");
  }

  inputDate.setHours(23, 59, 59, 999);

  if (usageCount === undefined || usageCount === null || usageCount === "") {
    throw new Error("Usage count is required");
  }
  const numUsageCount = Number(usageCount);
  if (isNaN(numUsageCount) || numUsageCount < 10) {
    throw new Error("Usage count must be at least 10");
  }
  if (numUsageCount > 10000) {
    throw new Error("Usage count must be below 10000");
  }

  if (minCart === undefined || minCart === null || minCart === "") {
    throw new Error("Minimum cart value is required");
  }
  const numMinCart = Number(minCart);
  if (isNaN(numMinCart) || numMinCart < 10) {
    throw new Error("Minimum cart value must be at least 10");
  }

  if (!discountType) {
    throw new Error("Discount type is required");
  }

  const isPercentage = (discountType || "").trim().toLowerCase() === "percentage";
  const numDiscountValue = Number(discountValue);

  if (
    discountValue === undefined ||
    discountValue === null ||
    discountValue === "" ||
    isNaN(numDiscountValue)
  ) {
    throw new Error("Discount value is required");
  }
  if (numDiscountValue < 10) {
    throw new Error("Discount value must be at least 10");
  }

  let finalMaxDiscount = null;
  if (isPercentage) {
    if (numDiscountValue > 90) {
      throw new Error("Discount percentage cannot exceed 90%");
    }
    if (maxDiscount === undefined || maxDiscount === null || maxDiscount === "") {
      throw new Error("Maximum discount amount is required for percentage discount");
    }
    finalMaxDiscount = Number(maxDiscount);
    if (isNaN(finalMaxDiscount) || finalMaxDiscount < 10) {
      throw new Error("Maximum discount amount must be at least 10");
    }
    if (finalMaxDiscount > 10000) {
      throw new Error("Maximum discount amount must be below 10000");
    }
    if (finalMaxDiscount > numMinCart) {
      throw new Error("Maximum discount amount must be less than or equal to minimum cart value");
    }
  } else {
    // Flat discount
    if (numDiscountValue > 10000) {
      throw new Error("Flat discount value must be below 10000");
    }
    if (numDiscountValue >= numMinCart) {
      throw new Error("Flat discount value must be less than minimum cart value");
    }
  }

  const newCoupon = await Coupon.create({
    name: cleanName,
    code: cleanCode,
    usageCount: numUsageCount,
    usedCount: 0,
    discountValue: numDiscountValue,
    expiryDate: inputDate,
    minCart: numMinCart,
    maxDiscount: isPercentage ? finalMaxDiscount : null,
    discountType: isPercentage ? "Percentage" : "Flat",
    status: "Active",
  });

  return {
    success: true,
    message: "Coupon added successfully",
    coupon: newCoupon,
  };
};

const editCouponService = async (couponId, couponData) => {
  if (!couponId) {
    throw new Error("Coupon ID is required");
  }

  const existingCoupon = await Coupon.findById(couponId);
  if (!existingCoupon) {
    throw new Error("Coupon not found");
  }

  const {
    name,
    code,
    expiryDate,
    usageCount,
    minCart,
    maxDiscount,
    discountType,
    discountValue,
  } = couponData;

  const cleanName = (name || "").trim();
  const cleanCode = (code || "").trim().toUpperCase();

  if (!cleanName || cleanName.length < 4) {
    throw new Error("Name must contain at least 4 characters");
  }

  if (!/^[a-zA-Z0-9\s]+$/.test(cleanName)) {
    throw new Error("Name must contain only letters and numbers");
  }

  if ((cleanName.match(/[a-zA-Z]/g) || []).length < 2) {
    throw new Error("Name must contain at least 2 letters");
  }

  const existingName = await Coupon.findOne({
    _id: { $ne: couponId },
    name: { $regex: new RegExp(`^${cleanName}$`, "i") },
  });
  if (existingName) {
    throw new Error("Coupon name already exists");
  }

  if (!cleanCode) {
    throw new Error("Coupon code is required");
  }

  if (/\s/.test(cleanCode)) {
    throw new Error("Coupon code cannot contain spaces");
  }

  if (cleanCode.length < 8) {
    throw new Error("Coupon code must contain at least 8 characters");
  }

  if ((cleanCode.match(/[a-zA-Z]/g) || []).length < 4) {
    throw new Error("Coupon code must contain at least 4 letters");
  }

  const existingCode = await Coupon.findOne({
    _id: { $ne: couponId },
    code: cleanCode,
  });
  if (existingCode) {
    throw new Error("Coupon code already exists");
  }

  if (!expiryDate) {
    throw new Error("Expiry date is required");
  }

  const inputDate = new Date(expiryDate);
  if (Number.isNaN(inputDate.getTime())) {
    throw new Error("Invalid expiry date");
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const compareDate = new Date(expiryDate);
  compareDate.setHours(0, 0, 0, 0);

  if (compareDate < todayStart) {
    throw new Error("Expiry date cannot be in the past");
  }

  inputDate.setHours(23, 59, 59, 999);

  if (usageCount === undefined || usageCount === null || usageCount === "") {
    throw new Error("Usage count is required");
  }
  const numUsageCount = Number(usageCount);
  if (isNaN(numUsageCount) || numUsageCount < 10) {
    throw new Error("Usage count must be at least 10");
  }
  if (numUsageCount > 10000) {
    throw new Error("Usage count must be below 10000");
  }

  if (minCart === undefined || minCart === null || minCart === "") {
    throw new Error("Minimum cart value is required");
  }
  const numMinCart = Number(minCart);
  if (isNaN(numMinCart) || numMinCart < 10) {
    throw new Error("Minimum cart value must be at least 10");
  }

  if (!discountType) {
    throw new Error("Discount type is required");
  }

  const isPercentage = (discountType || "").trim().toLowerCase() === "percentage";
  const numDiscountValue = Number(discountValue);

  if (
    discountValue === undefined ||
    discountValue === null ||
    discountValue === "" ||
    isNaN(numDiscountValue)
  ) {
    throw new Error("Discount value is required");
  }
  if (numDiscountValue < 10) {
    throw new Error("Discount value must be at least 10");
  }

  let finalMaxDiscount = null;
  if (isPercentage) {
    if (numDiscountValue > 90) {
      throw new Error("Discount percentage cannot exceed 90%");
    }
    if (maxDiscount === undefined || maxDiscount === null || maxDiscount === "") {
      throw new Error("Maximum discount amount is required for percentage discount");
    }
    finalMaxDiscount = Number(maxDiscount);
    if (isNaN(finalMaxDiscount) || finalMaxDiscount < 10) {
      throw new Error("Maximum discount amount must be at least 10");
    }
    if (finalMaxDiscount > 10000) {
      throw new Error("Maximum discount amount must be below 10000");
    }
    if (finalMaxDiscount > numMinCart) {
      throw new Error("Maximum discount amount must be less than or equal to minimum cart value");
    }
  } else {
    // Flat discount
    if (numDiscountValue > 10000) {
      throw new Error("Flat discount value must be below 10000");
    }
    if (numDiscountValue >= numMinCart) {
      throw new Error("Flat discount value must be less than minimum cart value");
    }
  }

  await Coupon.findByIdAndUpdate(couponId, {
    name: cleanName,
    code: cleanCode,
    usageCount: numUsageCount,
    discountValue: numDiscountValue,
    expiryDate: inputDate,
    minCart: numMinCart,
    maxDiscount: isPercentage ? finalMaxDiscount : null,
    discountType: isPercentage ? "Percentage" : "Flat",
  });

  return {
    success: true,
    message: "Coupon updated successfully",
  };
};

const deleteCouponService = async (couponId) => {
  if (!couponId) {
    throw new Error("Coupon ID is required");
  }
  const existingCoupon = await Coupon.findById(couponId);

  if (!existingCoupon) {
    throw new Error("Coupon not found");
  }

  await Coupon.deleteOne({ _id: couponId });

  return {
    success: true,
    message: "Coupon deleted successfully",
  };
};

const toggleCouponStatusService = async (couponId) => {
  if (!couponId) {
    throw new Error("Coupon ID is required");
  }
  const coupon = await Coupon.findById(couponId);
  if (!coupon) {
    throw new Error("Coupon not found");
  }
  coupon.status = coupon.status === "Active" ? "InActive" : "Active";
  await coupon.save();

  return {
    success: true,
    message: `Coupon ${coupon.status === "Active" ? "unblocked" : "blocked"} successfully`,
    status: coupon.status,
  };
};

const getCouponService = async (role = "user", totalAmount, userId = null) => {
  const currentDate = new Date();
  // Auto-delete expired or limit-reached coupons
  await Coupon.deleteMany({
    $or: [
      { expiryDate: { $lt: currentDate } },
      { $expr: { $gte: ["$usedCount", "$usageCount"] } },
    ],
  });

  if (role === "user") {
    const filter = {
      status: "Active",
      expiryDate: { $gte: currentDate },
      minCart: { $lte: totalAmount || 0 },
    };

    if (userId) {
      const userStr = userId.toString();
      const excludedIds = [userStr];
      if (mongoose.Types.ObjectId.isValid(userStr)) {
        try {
          excludedIds.push(new mongoose.Types.ObjectId(userStr));
        } catch (e) {}
      }
      filter.usedBy = { $nin: excludedIds };
    }

    let coupons = await Coupon.find(filter).lean();

    if (userId) {
      const userStr = userId.toString();
      coupons = (coupons || []).filter(c => 
        !c.usedBy || !c.usedBy.some(u => u?.toString() === userStr)
      );
    }

    return coupons || [];
  } else {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return coupons || [];
  }
};

module.exports = {
  addCouponService,
  getCouponService,
  editCouponService,
  deleteCouponService,
  toggleCouponStatusService,
};
