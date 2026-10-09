import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import InventoryLog from "../models/InventoryLog.js";

const getStockStatus = (stock) => {
  if (stock === 0) return "out_of_stock";
  if (stock <= 5) return "critical";
  if (stock <= 10) return "low";

  return "in_stock";
};

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getSafeInventoryProduct = (product) => ({
  id: product._id,
  name: product.name,
  slug: product.slug,
  sku: product.sku || "",
  brand: product.brand || "",
  category: product.category
    ? {
        id: product.category._id,
        name: product.category.name,
        slug: product.category.slug,
      }
    : null,
  price: product.price,
  discountPrice: product.discountPrice,
  stock: product.stock,
  images: Array.isArray(product.images)
    ? product.images
        .map((image) => {
          if (typeof image === "string") {
            return { url: image };
          }

          if (!image?.url) {
            return null;
          }

          return { url: image.url };
        })
        .filter(Boolean)
    : [],
  isActive: product.isActive,
  stockStatus: getStockStatus(product.stock),
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

const getSafeInventoryLog = (log) => ({
  id: log._id,
  product: log.product,
  previousStock: log.previousStock,
  newStock: log.newStock,
  quantityChanged: log.quantityChanged,
  adjustmentType: log.adjustmentType,
  reason: log.reason || "",
  adjustedBy: log.adjustedBy
    ? {
        id: log.adjustedBy._id,
        name: log.adjustedBy.name,
        email: log.adjustedBy.email,
      }
    : null,
  createdAt: log.createdAt,
  updatedAt: log.updatedAt,
});

const validateProductId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid product ID.");
    error.statusCode = 400;
    throw error;
  }
};

/*
 * GET /api/admin/inventory/overview
 */
export const getInventoryOverview =
  asyncHandler(async (req, res) => {
    const [
      totalProducts,
      outOfStock,
      criticalStock,
      lowStock,
      inventoryResult,
    ] = await Promise.all([
      Product.countDocuments({
        isActive: true,
      }),

      Product.countDocuments({
        isActive: true,
        stock: 0,
      }),

      Product.countDocuments({
        isActive: true,
        stock: {
          $gte: 1,
          $lte: 5,
        },
      }),

      Product.countDocuments({
        isActive: true,
        stock: {
          $gte: 6,
          $lte: 10,
        },
      }),

      Product.aggregate([
        {
          $match: {
            isActive: true,
          },
        },
        {
          $group: {
            _id: null,
            totalUnits: {
              $sum: "$stock",
            },
          },
        },
      ]),
    ]);

    const totalUnits =
      inventoryResult[0]?.totalUnits || 0;

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        totalUnits,
        outOfStock,
        criticalStock,
        lowStock,
        inStock:
          totalProducts -
          outOfStock -
          criticalStock -
          lowStock,
      },
    });
  });

/*
 * GET /api/admin/inventory
 */
export const getInventoryProducts =
  asyncHandler(async (req, res) => {
    const {
      search = "",
      status = "",
      category = "",
      page = 1,
      limit = 10,
    } = req.query;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    if (
      !Number.isInteger(parsedPage) ||
      parsedPage < 1
    ) {
      res.status(400);
      throw new Error("Page must be a positive integer.");
    }

    if (
      !Number.isInteger(parsedLimit) ||
      parsedLimit < 1 ||
      parsedLimit > 50
    ) {
      res.status(400);
      throw new Error(
        "Limit must be an integer between 1 and 50."
      );
    }

    const pageNumber = parsedPage;
    const limitNumber = parsedLimit;

    const filter = {};

    if (typeof search !== "string") {
      res.status(400);
      throw new Error("Search must be a string.");
    }

    const trimmedSearch = search.trim();

    if (trimmedSearch) {
      const escapedSearch = escapeRegex(trimmedSearch);

      filter.$or = [
        {
          name: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          sku: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          brand: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
      ];
    }

    if (category) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        res.status(400);
        throw new Error("Invalid category ID.");
      }

      filter.category = category;
    }

    const validStatuses = [
      "out_of_stock",
      "critical",
      "low",
      "in_stock",
    ];

    if (
      status &&
      !validStatuses.includes(status)
    ) {
      res.status(400);
      throw new Error("Invalid inventory status.");
    }

    if (status === "out_of_stock") {
      filter.stock = 0;
    }

    if (status === "critical") {
      filter.stock = {
        $gte: 1,
        $lte: 5,
      };
    }

    if (status === "low") {
      filter.stock = {
        $gte: 6,
        $lte: 10,
      };
    }

    if (status === "in_stock") {
      filter.stock = {
        $gte: 11,
      };
    }

    const total =
      await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .populate(
        "category",
        "name slug"
      )
      .sort({
        stock: 1,
        createdAt: -1,
      })
      .skip(
        (pageNumber - 1) * limitNumber
      )
      .limit(limitNumber);

    const formattedProducts =
      products.map(getSafeInventoryProduct);
      
    res.status(200).json({
      success: true,
      data: {
        products: formattedProducts,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          pages: Math.ceil(
            total / limitNumber
          ),
        },
      },
    });
  });

/*
 * GET /api/admin/inventory/:id
 */
export const getInventoryProduct =
  asyncHandler(async (req, res) => {
    validateProductId(req.params.id);

    const product =
      await Product.findById(req.params.id)
        .populate(
          "category",
          "name slug"
        );

    if (!product) {
      res.status(404);
      throw new Error(
        "Product not found."
      );
    }

    const logs =
      await InventoryLog.find({
        product: product._id,
      })
        .populate(
          "adjustedBy",
          "name email"
        )
        .sort({
          createdAt: -1,
        })
        .limit(50);

    res.status(200).json({
      success: true,
      data: {
        product: getSafeInventoryProduct(product),
        logs: logs.map(getSafeInventoryLog),
      },
    });
  });

/*
 * PATCH /api/admin/inventory/:id/adjust
 */
export const adjustInventory =
  asyncHandler(async (req, res) => {
    validateProductId(req.params.id);
    
    const { id } = req.params;

    const {
      adjustmentType,
      quantity,
      reason = "",
    } = req.body;

    if (
      ![
        "restock",
        "remove",
        "set",
      ].includes(adjustmentType)
    ) {
      res.status(400);
      throw new Error(
        "Invalid adjustment type."
      );
    }

    const parsedQuantity =
      Number(quantity);

    if (
      Number.isNaN(parsedQuantity) ||
      parsedQuantity < 0
    ) {
      res.status(400);
      throw new Error(
        "Quantity must be a valid non-negative number."
      );
    }

    if (
      adjustmentType !== "set" &&
      parsedQuantity === 0
    ) {
      res.status(400);
      throw new Error(
        "Adjustment quantity must be greater than 0."
      );
    }

    const product =
      await Product.findById(id);

    if (!product) {
      res.status(404);
      throw new Error(
        "Product not found."
      );
    }

    const previousStock =
      product.stock;

    let newStock;

    if (
      adjustmentType === "restock"
    ) {
      newStock =
        previousStock +
        parsedQuantity;
    } else if (
      adjustmentType === "remove"
    ) {
      if (
        parsedQuantity >
        previousStock
      ) {
        res.status(400);
        throw new Error(
          "Cannot remove more stock than currently available."
        );
      }

      newStock =
        previousStock -
        parsedQuantity;
    } else {
      newStock = parsedQuantity;
    }

    const quantityChanged =
      newStock - previousStock;

    product.stock = newStock;

    if (typeof reason !== "string") {
      res.status(400);
      throw new Error("Reason must be a string.");
    }

    await product.save();

    await InventoryLog.create({
      product: product._id,
      previousStock,
      newStock,
      quantityChanged,
      adjustmentType,
      reason: reason.trim(),
      adjustedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message:
        "Inventory updated successfully.",
      data: {
        product: getSafeInventoryProduct(product),
        previousStock,
        newStock,
        quantityChanged,
      },
    });
  });

/*
 * GET /api/admin/inventory/:id/logs
 */
export const getInventoryLogs =
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product =
      await Product.findById(id).select(
        "_id name sku stock"
      );

    if (!product) {
      res.status(404);
      throw new Error(
        "Product not found."
      );
    }

    const logs =
      await InventoryLog.find({
        product: id,
      })
        .populate(
          "adjustedBy",
          "name email"
        )
        .sort({
          createdAt: -1,
        })
        .limit(100);

    res.status(200).json({
      success: true,
      data: {
        product : {
          id: product._id,
          name: product.name,
          sku: product.sku || "",
          stock: product.stock,
        },
        logs: logs.map(getSafeInventoryLog),
      },
    });
  });