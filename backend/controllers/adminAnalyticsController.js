import asyncHandler from "express-async-handler";

import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

const VALID_RANGES = [
  "7d",
  "30d",
  "3m",
  "12m",
];

const validateAnalyticsRange = (range) => {
  if (!VALID_RANGES.includes(range)) {
    const error = new Error(
      "Range must be one of: 7d, 30d, 3m, 12m."
    );
    error.statusCode = 400;
    throw error;
  }
};

const getDateRange = (range) => {
  const endDate = new Date();
  const startDate = new Date();

  switch (range) {
    case "7d":
      startDate.setDate(startDate.getDate() - 7);
      break;

    case "30d":
      startDate.setDate(startDate.getDate() - 30);
      break;

    case "3m":
      startDate.setMonth(startDate.getMonth() - 3);
      break;

    case "12m":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;

    default:
      startDate.setDate(startDate.getDate() - 30);
  }

  return {
    startDate,
    endDate,
  };
};

const getSalesMatch = (startDate, endDate) => ({
  createdAt: {
    $gte: startDate,
    $lte: endDate,
  },
  orderStatus: {
    $ne: "cancelled",
  },
  paymentStatus: {
    $in: ["paid", "pending"],
  },
});

export const getAnalyticsOverview = asyncHandler(
  async (req, res) => {
    const { range = "30d" } = req.query;
    validateAnalyticsRange(range);

    const { startDate, endDate } =
      getDateRange(range);

    const dateFilter = {
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    const salesMatch = getSalesMatch(
      startDate,
      endDate
    );

    const [
      totalOrders,
      cancelledOrders,
      totalCustomers,
      totalProducts,
      revenueResult,
      orderStatusResult,
    ] = await Promise.all([
      Order.countDocuments(salesMatch),

      Order.countDocuments({
        ...dateFilter,
        orderStatus: "cancelled",
      }),

      User.countDocuments({
        role: "customer",
      }),

      Product.countDocuments({
        isActive: true,
      }),

      Order.aggregate([
        {
          $match: salesMatch,
        },
        {
          $group: {
            _id: null,
            revenue: {
              $sum: "$totalAmount",
            },
            subtotal: {
              $sum: "$subtotal",
            },
            discount: {
              $sum: "$discount",
            },
            shipping: {
              $sum: "$shippingFee",
            },
          },
        },
      ]),

      Order.aggregate([
        {
          $match: dateFilter,
        },
        {
          $group: {
            _id: "$orderStatus",
            count: {
              $sum: 1,
            },
          },
        },
      ]),
    ]);

    const revenue = revenueResult[0] || {
      revenue: 0,
      subtotal: 0,
      discount: 0,
      shipping: 0,
    };

    const orderStatus = {};

    orderStatusResult.forEach((item) => {
      orderStatus[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      data: {
        range,
        startDate,
        endDate,

        revenue: Number(
          revenue.revenue.toFixed(2)
        ),

        subtotal: Number(
          revenue.subtotal.toFixed(2)
        ),

        discount: Number(
          revenue.discount.toFixed(2)
        ),

        shipping: Number(
          revenue.shipping.toFixed(2)
        ),

        totalOrders,
        cancelledOrders,
        totalCustomers,
        totalProducts,

        orderStatus,
      },
    });
  }
);

export const getRevenueAnalytics = asyncHandler(
  async (req, res) => {
    const { range = "30d" } = req.query;
    validateAnalyticsRange(range);

    const { startDate, endDate } =
      getDateRange(range);

    const revenueData = await Order.aggregate([
      {
        $match: getSalesMatch(
          startDate,
          endDate
        ),
      },

      {
        $group: {
          _id: {
            year: {
              $year: "$createdAt",
            },
            month: {
              $month: "$createdAt",
            },
            day: {
              $dayOfMonth: "$createdAt",
            },
          },

          revenue: {
            $sum: "$totalAmount",
          },

          orders: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1,
        },
      },
    ]);

    const formattedData =
      revenueData.map((item) => ({
        date: `${item._id.year}-${String(
          item._id.month
        ).padStart(2, "0")}-${String(
          item._id.day
        ).padStart(2, "0")}`,

        revenue: Number(
          item.revenue.toFixed(2)
        ),

        orders: item.orders,
      }));

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  }
);

export const getOrderAnalytics = asyncHandler(
  async (req, res) => {
    const { range = "30d" } = req.query;
    validateAnalyticsRange(range);

    const { startDate, endDate } =
      getDateRange(range);

    const data = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },

      {
        $group: {
          _id: "$orderStatus",
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    const formattedData = data.map((item) => ({
      status: item._id,
      count: item.count,
    }));

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  }
);

export const getTopProducts = asyncHandler(
  async (req, res) => {
    const { range = "30d" } = req.query;
    validateAnalyticsRange(range);

    const { startDate, endDate } =
      getDateRange(range);

    const products = await Order.aggregate([
      {
        $match: getSalesMatch(
          startDate,
          endDate
        ),
      },

      {
        $unwind: "$items",
      },

      {
        $group: {
          _id: "$items.product",

          name: {
            $first: "$items.name",
          },

          image: {
            $first: "$items.image",
          },

          unitsSold: {
            $sum: "$items.quantity",
          },

          revenue: {
            $sum: {
              $multiply: [
                "$items.price",
                "$items.quantity",
              ],
            },
          },
        },
      },

      {
        $sort: {
          unitsSold: -1,
        },
      },

      {
        $limit: 10,
      },
    ]);

    const currentProducts = await Product.find({
      _id: { $in: products.map((product) => product._id) },
    }).select("images");

    const currentImageById = new Map(
      currentProducts.map((product) => {
        const image = product.images?.[0];

        return [
          product._id.toString(),
          typeof image === "string" ? image : image?.url || "",
        ];
      })
    );

    const formattedProducts =
      products.map((product) => ({
        productId: product._id,
        name: product.name,
        image: product.image || "",
        currentImage:
          currentImageById.get(product._id.toString()) || "",
        unitsSold: product.unitsSold,
        revenue: Number(
          product.revenue.toFixed(2)
        ),
      }));

    res.status(200).json({
      success: true,
      data: formattedProducts,
    });
  }
);

export const getCategoryAnalytics =
  asyncHandler(async (req, res) => {
    const { range = "30d" } = req.query;
    validateAnalyticsRange(range);

    const { startDate, endDate } =
      getDateRange(range);

    const categoryData =
      await Order.aggregate([
        {
          $match: getSalesMatch(
            startDate,
            endDate
          ),
        },

        {
          $unwind: "$items",
        },

        {
          $lookup: {
            from: "products",
            localField: "items.product",
            foreignField: "_id",
            as: "product",
          },
        },

        {
          $unwind: {
            path: "$product",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $lookup: {
            from: "categories",
            localField: "product.category",
            foreignField: "_id",
            as: "category",
          },
        },

        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $group: {
            _id: "$category._id",

            categoryName: {
              $first: {
                $ifNull: [
                  "$category.name",
                  "Uncategorized",
                ],
              },
            },

            unitsSold: {
              $sum: "$items.quantity",
            },

            revenue: {
              $sum: {
                $multiply: [
                  "$items.price",
                  "$items.quantity",
                ],
              },
            },
          },
        },

        {
          $sort: {
            revenue: -1,
          },
        },
      ]);

    const formattedData =
      categoryData.map((category) => ({
        categoryId: category._id,
        categoryName: category.categoryName,
        unitsSold: category.unitsSold,
        revenue: Number(
          category.revenue.toFixed(2)
        ),
      }));

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  });