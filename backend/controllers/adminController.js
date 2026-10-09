import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Category from "../models/Category.js";
import Review from "../models/Review.js";
import Coupon from "../models/Coupon.js";

export const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalProducts,
    totalOrders,
    totalCategories,
    totalReviews,
    totalCoupons,
  ] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(),
    Category.countDocuments({ isActive: true }),
    Review.countDocuments(),
    Coupon.countDocuments({ isActive: true }),
  ]);

  const revenueResult = await Order.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        orderStatus: {
          $ne: "cancelled",
        },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: {
          $sum: "$totalAmount",
        },
      },
    },
  ]);

  const totalRevenue =
    revenueResult.length > 0
      ? revenueResult[0].totalRevenue
      : 0;

  const pendingOrders = await Order.countDocuments({
    orderStatus: {
      $in: [
        "pending",
        "confirmed",
        "processing",
      ],
    },
  });

  const deliveredOrders = await Order.countDocuments({
    orderStatus: "delivered",
  });

  const cancelledOrders = await Order.countDocuments({
    orderStatus: "cancelled",
  });

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalProducts,
      totalOrders,
      totalCategories,
      totalReviews,
      totalCoupons,
      totalRevenue,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
    },
  });
});

export const getRecentOrders = asyncHandler(
  async (req, res) => {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        "_id user items totalAmount paymentMethod paymentStatus orderStatus createdAt"
      );

    res.status(200).json({
      success: true,
      data: orders,
    });
  }
);

export const getLowStockProducts = asyncHandler(
  async (req, res) => {
    const products = await Product.find({
      isActive: true,
      stock: { $lte: 5 },
    })
      .sort({ stock: 1 })
      .limit(10)
      .select(
        "name price stock images sku"
      );

    res.status(200).json({
      success: true,
      data: products,
    });
  }
);

export const getRecentUsers = asyncHandler(
  async (req, res) => {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        "name email role isActive createdAt lastLogin"
      );

    res.status(200).json({
      success: true,
      data: users,
    });
  }
);
