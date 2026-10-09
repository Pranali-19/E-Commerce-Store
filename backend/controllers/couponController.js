import asyncHandler from "express-async-handler";
import mongoose from "mongoose";

import Coupon from "../models/Coupon.js";
import Order from "../models/Order.js";

const validateCouponConfiguration = ({
  discountType,
  discountValue,
  minimumOrderAmount,
  maximumDiscount,
  usageLimit,
  expiryDate,
}) => {
  const errors = [];

  if (!["percentage", "fixed"].includes(discountType)) {
    errors.push({
      field: "discountType",
      message: "Discount type must be percentage or fixed.",
    });
  }

  const numericDiscountValue = Number(discountValue);

  if (
    !Number.isFinite(numericDiscountValue) ||
    numericDiscountValue <= 0
  ) {
    errors.push({
      field: "discountValue",
      message: "Discount value must be greater than 0.",
    });
  }

  if (
    discountType === "percentage" &&
    Number.isFinite(numericDiscountValue) &&
    numericDiscountValue > 100
  ) {
    errors.push({
      field: "discountValue",
      message: "Percentage discount cannot exceed 100%.",
    });
  }

  const minimumAmount = Number(minimumOrderAmount);

  if (
    !Number.isFinite(minimumAmount) ||
    minimumAmount < 0
  ) {
    errors.push({
      field: "minimumOrderAmount",
      message: "Minimum order amount must be 0 or greater.",
    });
  }

  if (
    maximumDiscount !== null &&
    maximumDiscount !== undefined &&
    maximumDiscount !== ""
  ) {
    const maximum = Number(maximumDiscount);

    if (!Number.isFinite(maximum) || maximum < 0) {
      errors.push({
        field: "maximumDiscount",
        message: "Maximum discount must be 0 or greater.",
      });
    }
  }

  if (
    usageLimit !== null &&
    usageLimit !== undefined &&
    usageLimit !== ""
  ) {
    const limit = Number(usageLimit);

    if (!Number.isInteger(limit) || limit < 1) {
      errors.push({
        field: "usageLimit",
        message: "Usage limit must be a positive integer.",
      });
    }
  }

  const expiry = new Date(expiryDate);

  if (Number.isNaN(expiry.getTime())) {
    errors.push({
      field: "expiryDate",
      message: "Invalid expiry date.",
    });
  } else if (expiry <= new Date()) {
    errors.push({
      field: "expiryDate",
      message: "Expiry date must be in the future.",
    });
  }

  return errors;
};

const calculateDiscount = (coupon, subtotal) => {
  let discount = 0;

  if (coupon.discountType === "percentage") {
    discount = (subtotal * coupon.discountValue) / 100;

    if (
      coupon.maximumDiscount !== null &&
      coupon.maximumDiscount !== undefined
    ) {
      discount = Math.min(
        discount,
        coupon.maximumDiscount
      );
    }
  } else {
    discount = coupon.discountValue;
  }

  discount = Math.min(discount, subtotal);

  return Number(discount.toFixed(2));
};

const validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;

  if (!code || !code.trim()) {
    res.status(400);
    throw new Error("Please enter a coupon code.");
  }

  const orderSubtotal = Number(subtotal);

  if (
    !Number.isFinite(orderSubtotal) ||
    orderSubtotal < 0
  ) {
    res.status(400);
    throw new Error("Invalid order subtotal.");
  }

  const coupon = await Coupon.findOne({
    code: code.trim().toUpperCase(),
    isActive: true,
  });

  if (!coupon) {
    res.status(404);
    throw new Error("Invalid coupon code.");
  }

  if (new Date() >= coupon.expiryDate) {
    res.status(400);
    throw new Error("This coupon has expired.");
  }

  if (
    coupon.usageLimit !== null &&
    coupon.usedCount >= coupon.usageLimit
  ) {
    res.status(400);
    throw new Error("This coupon usage limit has been reached.");
  }

  if (
    orderSubtotal < coupon.minimumOrderAmount
  ) {
    res.status(400);
    throw new Error(
      `Minimum order amount for this coupon is ₹${coupon.minimumOrderAmount}.`
    );
  }

  const discount = calculateDiscount(
    coupon,
    orderSubtotal
  );

  res.status(200).json({
    success: true,
    message: "Coupon applied successfully.",
    data: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount,
      minimumOrderAmount: coupon.minimumOrderAmount,
      maximumDiscount: coupon.maximumDiscount,
      expiryDate: coupon.expiryDate,
    },
  });
});

const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    description,
    discountType,
    discountValue,
    minimumOrderAmount = 0,
    maximumDiscount = null,
    usageLimit = null,
    expiryDate,
  } = req.body;

  if (
    !code ||
    !discountType ||
    discountValue === undefined ||
    !expiryDate
  ) {
    res.status(400);
    throw new Error(
      "Code, discount type, discount value and expiry date are required."
    );
  }

  const validationErrors = validateCouponConfiguration({
    discountType,
    discountValue,
    minimumOrderAmount,
    maximumDiscount,
    usageLimit,
    expiryDate,
  });

  if (validationErrors.length > 0) {
    res.status(400);

    const error = new Error("Coupon validation failed.");
    error.errors = validationErrors;

    throw error;
  }

  const normalizedCode =
    typeof code === "string"
      ? code.trim().toUpperCase()
      : "";

  if (!/^[A-Z0-9_-]{3,30}$/.test(normalizedCode)) {
    res.status(400);

    throw new Error(
      "Coupon code must contain 3-30 letters, numbers, underscores, or hyphens."
    );
  }

  const existingCoupon = await Coupon.findOne({
    code: normalizedCode,
  });

  if (existingCoupon) {
    res.status(400);
    throw new Error("Coupon code already exists.");
  }

  const coupon = await Coupon.create({
    code: normalizedCode,
    description:
      typeof description === "string"
        ? description.trim()
        : "",
    discountType,
    discountValue: Number(discountValue),
    minimumOrderAmount: Number(minimumOrderAmount) || 0,
    maximumDiscount:
      maximumDiscount === null ||
      maximumDiscount === ""
        ? null
        : Number(maximumDiscount),
    usageLimit:
      usageLimit === null || usageLimit === ""
        ? null
        : Number(usageLimit),
    expiryDate,
  });

  res.status(201).json({
    success: true,
    message: "Coupon created successfully.",
    data: coupon,
  });
});

const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({
    isActive: true,
    expiryDate: { $gte: new Date() },
  }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    success: true,
    data: coupons,
  });
});

const getAvailableCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({
    isActive: true,
    expiryDate: { $gte: new Date() },
  }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    success: true,
    data: { coupons },
  });
});

const deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid coupon ID.");
  }

  const coupon = await Coupon.findByIdAndDelete(id);

  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found.");
  }

  res.status(200).json({
    success: true,
    message: "Coupon deleted successfully.",
  });
});

export {
  validateCoupon,
  createCoupon,
  getCoupons,
  getAvailableCoupons,
  deleteCoupon,
};