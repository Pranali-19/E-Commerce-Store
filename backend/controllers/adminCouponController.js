import asyncHandler from "express-async-handler";
import mongoose from "mongoose";

import Coupon from "../models/Coupon.js";
import {
  createCoupon as createAdminCoupon,
  deleteCoupon as deleteAdminCoupon,
} from "./couponController.js";

export const getAdminCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: coupons });
});

export const getAdminCouponById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid coupon ID.");
  }

  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found.");
  }

  res.status(200).json({ success: true, data: coupon });
});

export { createAdminCoupon, deleteAdminCoupon };

export const updateAdminCoupon = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid coupon ID.");
  }

  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found.");
  }

  const fields = [
    "code",
    "description",
    "discountType",
    "discountValue",
    "minimumOrderAmount",
    "maximumDiscount",
    "usageLimit",
    "expiryDate",
    "isActive",
  ];

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      coupon[field] = req.body[field];
    }
  }

  if (typeof coupon.code === "string") {
    coupon.code = coupon.code.trim().toUpperCase();
  }

  await coupon.save();
  res.status(200).json({ success: true, data: coupon });
});

export const toggleCouponStatus = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid coupon ID.");
  }

  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found.");
  }

  coupon.isActive = !coupon.isActive;
  await coupon.save();
  res.status(200).json({ success: true, data: coupon });
});