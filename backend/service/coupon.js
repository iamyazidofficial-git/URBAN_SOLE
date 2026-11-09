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

  console.log("COUPON DATA", couponData);

  const cleanName = name.trim();
  const cleanCode = code.trim();
  const existingName = await Coupon.findOne({ name: cleanName });
  const existingCode = await Coupon.findOne({ code: cleanCode });

  console.log("Max", maxDiscount);
  console.log("Min", minCart);

  if (cleanName?.length < 4) {
    throw new Error("Name must contain at least 4 characters");
  }

  if (!/^[a-zA-Z0-9\s]+$/.test(cleanName)) {
    throw new Error("Name must contain only letters and numbers");
  }

  if ((cleanName.match(/[a-zA-Z]/g) || []).length < 2) {
    throw new Error("Name must contain at least 2 letters");
  }

  if (existingName) {
    throw new Error("Name is allready exists");
  }
  if (!cleanCode || cleanCode.trim() === "") {
    throw new Error("CouponCode is required");
  }

  if (/\s/.test(cleanCode)) {
    throw new Error("CouponCode cannot contain spaces");
  }

  if (cleanCode.length < 8) {
    throw new Error("CouponCode must contain at least 8 characters");
  }

  if ((cleanCode.match(/[a-zA-Z]/g) || []).length < 4) {
    throw new Error("CouponCode must contain at least 4 letters");
  }
  if (existingCode) {
    throw new Error("Code is allready exists");
  }

  const inputDate = new Date(expiryDate);

  if (Number.isNaN(inputDate.getTime())) {
    throw new Error("Invalid expiry date");
  }

  inputDate.setHours(0, 0, 0, 0);

  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  console.log("Received expiryDate:", expiryDate);
  console.log("Input date:", inputDate);
  console.log("Current date:", currentDate);
  console.log("Is past:", inputDate < currentDate);

  if (inputDate < currentDate) {
    throw new Error("Expiry Date cannot be in the past");
  }

  if (inputDate < currentDate) {
    throw new Error("Expiry Date cannot be in the past");
  }

  if (!usageCount) {
    throw new Error("Usage count is required");
  }
  if (usageCount > 10000) {
    throw new Error("Usage count must below 10000");
  }
  if (usageCount < 10) {
    throw new Error("Usage count must atleast 10");
  }
  if (!minCart) {
    throw new Error("Min cart value is rquried");
  }
  if (minCart < 10) {
    throw new Error("Min cart value must be atleast 10");
  }
  if (!discountType) {
    throw new Error("discount type is required");
  }
  if (discountType == "percentage" && !maxDiscount) {
    throw new Error("Max discount amount value is rquried");
  }
  if (maxDiscount < 10) {
    throw new Error("Max discount amount atleast 10");
  }
  if (maxDiscount > 10000) {
    throw new Error("Max discount must below 10000");
  }
  if (Number(minCart) < Number(maxDiscount)) {
    throw new Error("Max discount amount must below than mincart");
  }
  if (!discountValue) {
    throw new Error("discount Value is required");
  }
  if (discountValue < 10) {
    throw new Error("discount Value must atleast 10");
  }
  if (
    discountType == "Percentage" &&
    (discountValue < 10 || discountValue > 90)
  ) {
    throw new Error("discount Value must between 10 and 90");
  }
  if (discountType == "Flat" && discountValue > 10000) {
    throw new Error("discount Value must below 10000");
  }

  console.log("CCC", {
    name: cleanName,
    code: cleanCode,
    usageCount: usageCount,
    usedCount: 0,
    discountValue: discountValue,
    expiryDate: inputDate,
    minCart: minCart,
    maxDiscount: maxDiscount,
    discountType: discountType.trim(),
    status: "Active",
  });

  const newCoupon = await Coupon.create({
    name: cleanName,
    code: cleanCode,
    usageCount: Number(usageCount),
    discountValue: Number(discountValue),
    expiryDate: inputDate,
    minCart: Number(minCart),
    maxDiscount: Number(maxDiscount),
    discountType: discountType.trim(),
    status: "Active",
  });

  console.log("Added successfully");

  return {
    success: true,
    message: "Coupon added successfully",
  };
};

const editCouponService = async (params, couponData) => {
  const couponId = params;
  if (!couponId) {
    throw new Error("CouponID is not passed");
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

  const cleanName = name.trim();
  const cleanCode = code.trim();
  const existingName = await Coupon.findOne({ name: cleanName });
  const existingCode = await Coupon.findOne({ code: cleanCode });

  console.log("Max", maxDiscount);
  console.log("Min", minCart);

  if (cleanName?.length < 4) {
    throw new Error("Name must contain at least 4 characters");
  }

  if (!/^[a-zA-Z0-9\s]+$/.test(cleanName)) {
    throw new Error("Name must contain only letters and numbers");
  }

  if ((cleanName.match(/[a-zA-Z]/g) || []).length < 2) {
    throw new Error("Name must contain at least 2 letters");
  }

  if (existingName) {
    throw new Error("Name is allready exists");
  }
  if (!cleanCode || cleanCode.trim() === "") {
    throw new Error("CouponCode is required");
  }

  if (/\s/.test(cleanCode)) {
    throw new Error("CouponCode cannot contain spaces");
  }

  if (cleanCode.length < 8) {
    throw new Error("CouponCode must contain at least 8 characters");
  }

  if ((cleanCode.match(/[a-zA-Z]/g) || []).length < 4) {
    throw new Error("CouponCode must contain at least 4 letters");
  }
  if (existingCode) {
    throw new Error("Code is allready exists");
  }

  const inputDate = new Date(expiryDate);

  if (Number.isNaN(inputDate.getTime())) {
    throw new Error("Invalid expiry date");
  }

  inputDate.setHours(0, 0, 0, 0);

  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  console.log("Received expiryDate:", expiryDate);
  console.log("Input date:", inputDate);
  console.log("Current date:", currentDate);
  console.log("Is past:", inputDate < currentDate);

  if (inputDate < currentDate) {
    throw new Error("Expiry Date cannot be in the past");
  }

  if (inputDate < currentDate) {
    throw new Error("Expiry Date cannot be in the past");
  }

  if (!usageCount) {
    throw new Error("Usage count is required");
  }
  if (usageCount > 10000) {
    throw new Error("Usage count must below 10000");
  }
  if (usageCount < 10) {
    throw new Error("Usage count must atleast 10");
  }
  if (!minCart) {
    throw new Error("Min cart value is rquried");
  }
  if (minCart < 10) {
    throw new Error("Min cart value must be atleast 10");
  }
  if (!discountType) {
    throw new Error("discount type is required");
  }
  if (discountType == "percentage" && !maxDiscount) {
    throw new Error("Max discount amount value is rquried");
  }
  if (maxDiscount < 10) {
    throw new Error("Max discount amount atleast 10");
  }
  if (maxDiscount > 10000) {
    throw new Error("Max discount must below 10000");
  }
  if (Number(minCart) < Number(maxDiscount)) {
    throw new Error("Max discount amount must below than mincart");
  }
  if (!discountValue) {
    throw new Error("discount Value is required");
  }
  if (discountValue < 10) {
    throw new Error("discount Value must atleast 10");
  }
  if (
    discountType == "Percentage" &&
    (discountValue < 10 || discountValue > 90)
  ) {
    throw new Error("discount Value must between 10 and 90");
  }
  if (discountType == "Flat" && discountValue > 10000) {
    throw new Error("discount Value must below 10000");
  }

  await Coupon.findByIdAndUpdate(couponId, {
    name: cleanName,
    code: cleanCode,
    usageCount: usageCount,
    usedCount: 0,
    discountValue: discountValue,
    expiryDate: inputDate,
    minCart: minCart,
    maxDiscount: maxDiscount,
    discountType: discountType.trim(),
    status: "Active",
  });

  return {
    success: true,
    message: "Coupon Edited successfully",
  };
};

const deleteCouponService = async (couponId) => {
  if (!couponId) {
    throw new Erro("Coupon Id is not sent");
  }
  const existingCoupon = await Coupon.findOne({ _id: couponId });

  if (!existingCoupon) {
    throw new Erro("Coupon is not available");
  }

  await Coupon.deleteOne({ _id: couponId });

  return {
    success: true,
    message: "Coupon deleted successfully",
  };
};

const getCouponService = async (role = "user",totalAmount) => {
  if (role == "user") {
    const coupons = await Coupon.find({ minCart: { $lte: totalAmount },status:"Active" });

    if (!coupons) {
      throw new Error("Coupons is empty");
    }

    return coupons;
  } else {
    const coupons = await Coupon.find()
    if (!coupons) {
      throw new Error("Coupons is empty")
    }

    return coupons
  }
};

module.exports = {
  addCouponService,
  getCouponService,
  editCouponService,
  deleteCouponService,
  getCouponService,
};
