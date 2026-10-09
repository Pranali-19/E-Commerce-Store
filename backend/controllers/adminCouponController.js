import asyncHandler from "express-async-handler";
import Coupon from "../models/Coupon.js";
import mongoose from "mongoose";

const validateCouponId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid coupon ID.");
    error.statusCode = 400;
    throw error;
  }
};

const getSafeAdminCoupon = (coupon) => ({
  id: coupon._id,
  code: coupon.code,
  description: coupon.description || "",
  discountType: coupon.discountType,
  discountValue: coupon.discountValue,
  minimumOrderAmount: coupon.minimumOrderAmount,
  maximumDiscount: coupon.maximumDiscount,
  usageLimit: coupon.usageLimit,
  usedCount: coupon.usedCount,
  expiryDate: coupon.expiryDate,
  isActive: coupon.isActive,
  createdAt: coupon.createdAt,
  updatedAt: coupon.updatedAt,
});

const validateCouponData = ({
  code,
  discountType,
  discountValue,
  minimumOrderAmount,
  maximumDiscount,
  usageLimit,
  expiryDate,
}) => {
  if (!code?.trim()) {
    return "Coupon code is required";
  }

  if (!["percentage", "fixed"].includes(discountType)) {
    return "Discount type must be percentage or fixed";
  }

  const numericDiscountValue = Number(discountValue);

  if (
    discountValue === undefined ||
    discountValue === null ||
    discountValue === "" ||
    !Number.isFinite(numericDiscountValue) ||
    numericDiscountValue < 0
  ) {
    return "Discount value must be a valid number greater than or equal to 0";
  }

  if (
    discountType === "percentage" &&
    numericDiscountValue > 100
  ) {
    return "Percentage discount cannot exceed 100";
  }

  if (
    minimumOrderAmount !== undefined &&
    minimumOrderAmount !== null &&
    minimumOrderAmount !== ""
  ) {
    const value = Number(minimumOrderAmount);

    if (!Number.isFinite(value) || value < 0) {
      return "Minimum order amount must be a valid non-negative number";
    }
  }

  if (
    maximumDiscount !== undefined &&
    maximumDiscount !== null &&
    maximumDiscount !== ""
  ) {
    const value = Number(maximumDiscount);

    if (!Number.isFinite(value) || value < 0) {
      return "Maximum discount must be a valid non-negative number";
    }
  }

  if (
    usageLimit !== undefined &&
    usageLimit !== null &&
    usageLimit !== ""
  ) {
    const value = Number(usageLimit);

    if (
      !Number.isInteger(value) ||
      value < 1
    ) {
      return "Usage limit must be a positive whole number";
    }
  }

  if (!expiryDate) {
    return "Expiry date is required";
  }

  if (new Date(expiryDate) <= new Date()) {
    return "Expiry date must be in the future";
  }

  return null;
};

/**
 * GET /api/admin/coupons
 */
export const getAdminCoupons = asyncHandler(async (req, res) => {
  const {
    search = "",
    status = "",
    discountType = "",
    page = 1,
    limit = 10,
  } = req.query;

  const parsedPage = Number(page);
  const parsedLimit = Number(limit);

  if (!Number.isInteger(parsedPage) || parsedPage < 1) {
    res.status(400);
    throw new Error("Page must be a positive integer.");
  }

  if (
    !Number.isInteger(parsedLimit) ||
    parsedLimit < 1 ||
    parsedLimit > 50
  ) {
    res.status(400);
    throw new Error("Limit must be an integer between 1 and 50.");
  }

  const pageNumber = parsedPage;
  const limitNumber = parsedLimit;

  const filter = {};

  const escapeRegex = (value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  if (typeof search !== "string") {
    res.status(400);
    throw new Error("Search must be a string.");
  }

  const searchValue = escapeRegex(search.trim());

  if (searchValue) {
    filter.$or = [
      {
        code: {
          $regex: searchValue,
          $options: "i",
        },
      },
      {
        description: {
          $regex: searchValue,
          $options: "i",
        },
      },
    ];
  }

  if (
    status &&
    !["active", "inactive"].includes(status)
  ) {
    res.status(400);
    throw new Error(
      "Invalid coupon status. Use active or inactive."
    );
  }

  if (
    discountType &&
    !["percentage", "fixed"].includes(discountType)
  ) {
    res.status(400);
    throw new Error(
      "Invalid discount type. Use percentage or fixed."
    );
  }

  if (status === "active") {
    filter.isActive = true;
  }

  if (status === "inactive") {
    filter.isActive = false;
  }

  if (discountType === "percentage") {
    filter.discountType = "percentage";
  }

  if (discountType === "fixed") {
    filter.discountType = "fixed";
  }

  const total = await Coupon.countDocuments(filter);

  const coupons = await Coupon.find(filter)
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber);

  res.status(200).json({
    success: true,
    data: {
      coupons: coupons.map(getSafeAdminCoupon),
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber),
      },
    },
  });
});

/**
 * GET /api/admin/coupons/:id
 */
export const getAdminCouponById = asyncHandler(
  async (req, res) => {
    validateCouponId(req.params.id);
    
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      res.status(404);
      throw new Error("Coupon not found");
    }

    res.status(200).json({
      success: true,
      data: {
        coupon: getSafeAdminCoupon(coupon),
      },
    });
  }
);

/**
 * POST /api/admin/coupons
 */
export const createAdminCoupon = asyncHandler(
  async (req, res) => {
    const {
      code,
      description,
      discountType,
      discountValue,
      minimumOrderAmount,
      maximumDiscount,
      usageLimit,
      expiryDate,
      isActive,
    } = req.body;

    const validationError = validateCouponData({
      code,
      discountType,
      discountValue,
      minimumOrderAmount,
      maximumDiscount,
      usageLimit,
      expiryDate,
    });

    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }

    const normalizedCode = code.trim().toUpperCase();
    
    if (!/^[A-Z0-9_-]{3,30}$/.test(normalizedCode)) {
      res.status(400);
      throw new Error(
        "Coupon code must be 3-30 characters and contain only letters, numbers, hyphens, or underscores."
      );
    }

    const existingCoupon = await Coupon.findOne({
      code: normalizedCode,
    });

    if (existingCoupon) {
      res.status(409);
      throw new Error("Coupon code already exists");
    }

    const coupon = await Coupon.create({
      code: normalizedCode,
      description: description?.trim() || "",
      discountType,
      discountValue: Number(discountValue),
      minimumOrderAmount: Number(minimumOrderAmount) || 0,
      maximumDiscount:
        maximumDiscount === "" ||
        maximumDiscount === null ||
        maximumDiscount === undefined
          ? null
          : Number(maximumDiscount),
      usageLimit:
        usageLimit === "" ||
        usageLimit === null ||
        usageLimit === undefined
          ? null
          : Number(usageLimit),
      expiryDate: new Date(expiryDate),
      isActive:
        typeof isActive === "boolean"
          ? isActive
          : true,
    });

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: {
        coupon: getSafeAdminCoupon(coupon),
      },
    });
  }
);

/**
 * PUT /api/admin/coupons/:id
 */
export const updateAdminCoupon = asyncHandler(
  async (req, res) => {
    validateCouponId(req.params.id);

    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      res.status(404);
      throw new Error("Coupon not found");
    }

    const {
      code,
      description,
      discountType,
      discountValue,
      minimumOrderAmount,
      maximumDiscount,
      usageLimit,
      expiryDate,
      isActive,
    } = req.body;

    const validationError = validateCouponData({
      code,
      discountType,
      discountValue,
      minimumOrderAmount,
      maximumDiscount,
      usageLimit,
      expiryDate,
    });

    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }

    const normalizedCode = code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,30}$/.test(normalizedCode)) {
      res.status(400);
      throw new Error(
        "Coupon code must be 3-30 characters and contain only letters, numbers, hyphens, or underscores."
      );
    }

    const existingCoupon = await Coupon.findOne({
      code: normalizedCode,
      _id: { $ne: req.params.id },
    });

    if (existingCoupon) {
      res.status(409);
      throw new Error("Coupon code already exists");
    }

    coupon.code = normalizedCode;
    coupon.description = description?.trim() || "";
    coupon.discountType = discountType;
    coupon.discountValue = Number(discountValue);
    coupon.minimumOrderAmount =
      Number(minimumOrderAmount) || 0;

    coupon.maximumDiscount =
      maximumDiscount === "" ||
      maximumDiscount === null ||
      maximumDiscount === undefined
        ? null
        : Number(maximumDiscount);

    coupon.usageLimit =
      usageLimit === "" ||
      usageLimit === null ||
      usageLimit === undefined
        ? null
        : Number(usageLimit);

    coupon.expiryDate = new Date(expiryDate);

    if (typeof isActive === "boolean") {
      coupon.isActive = isActive;
    }

    await coupon.save();

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      data: {
        coupon: getSafeAdminCoupon(coupon),
      },
    });
  }
);

/**
 * PATCH /api/admin/coupons/:id/status
 */
export const toggleCouponStatus = asyncHandler(
  async (req, res) => {
    validateCouponId(req.params.id);

    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      res.status(404);
      throw new Error("Coupon not found");
    }

    coupon.isActive = !coupon.isActive;

    await coupon.save();

    res.status(200).json({
      success: true,
      message: `Coupon ${
        coupon.isActive
          ? "activated"
          : "deactivated"
      } successfully`,
      data: {
        coupon: getSafeAdminCoupon(coupon),
      },
    });
  }
);

/**
 * DELETE /api/admin/coupons/:id
 */
export const deleteAdminCoupon = asyncHandler(
  async (req, res) => {
    validateCouponId(req.params.id);

    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      res.status(404);
      throw new Error("Coupon not found");
    }

    await Coupon.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  }
);