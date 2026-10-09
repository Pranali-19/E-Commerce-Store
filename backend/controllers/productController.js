import asyncHandler from "express-async-handler";
import Product from "../models/Product.js";
import deleteCloudinaryImage from "../utils/deleteCloudinaryImage.js";
import {
  isValidObjectId, 
  parsePositiveNumber,
  parsePositiveInteger,
  createSlug,
  validateRequest,
} from "../utils/validation.js";

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getSafeProduct = (product) => ({
  id: product._id,
  name: product.name,
  slug: product.slug,
  description: product.description,
  price: product.price,
  discountPrice: product.discountPrice,

  category: product.category
    ? {
        id: product.category._id,
        name: product.category.name,
        slug: product.category.slug,
      }
    : null,

  brand: product.brand || "",
  stock: product.stock,
  sku: product.sku || "",

  images: Array.isArray(product.images)
    ? product.images
        .map((image) => {
          if (typeof image === "string") {
            return { url: image };
          }

          if (!image?.url) {
            return null;
          }

          return {
            url: image.url,
          };
        })
        .filter(Boolean)
    : [],

  specifications: product.specifications || {},
  tags: Array.isArray(product.tags) ? product.tags : [],

  ratings: product.ratings
    ? {
        average: product.ratings.average || 0,
        count: product.ratings.count || 0,
      }
    : {
        average: 0,
        count: 0,
      },

  isFeatured: product.isFeatured,
  isActive: product.isActive,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

// GET ALL PRODUCTS
const getProducts = asyncHandler(async (req, res) => {
  const {
    search = "",
    category = "",
    brand = "",
    minPrice,
    maxPrice,
    sort = "newest",
    featured,
    // OnSale,
    page = 1,
    limit = 12,
  } = req.query;

  const pageNumber = parsePositiveInteger(page, 1);
  const limitNumber = parsePositiveInteger(limit, 12);

  if (pageNumber === null) {
    res.status(400);
    throw new Error("Page must be a positive integer.");
  }

  if (limitNumber === null) {
    res.status(400);
    throw new Error("Limit must be a positive integer.");
  }

  if (limitNumber > 50) {
    res.status(400);
    throw new Error("Limit cannot be greater than 50.");
  }

  if (category && !isValidObjectId(category)) {
    res.status(400);
    throw new Error("Invalid category ID.");
  }

  const minPriceNumber = parsePositiveNumber(minPrice);
  const maxPriceNumber = parsePositiveNumber(maxPrice);

  if (minPrice !== undefined && minPriceNumber === null) {
    res.status(400);
    throw new Error("Minimum price must be a valid positive number.");
  }

  if (maxPrice !== undefined && maxPriceNumber === null) {
    res.status(400);
    throw new Error("Maximum price must be a valid positive number.");
  }

  if (
    minPriceNumber !== null &&
    maxPriceNumber !== null &&
    minPriceNumber !== undefined &&
    maxPriceNumber !== undefined &&
    minPriceNumber > maxPriceNumber
  ) {
    res.status(400);
    throw new Error(
      "Minimum price cannot be greater than maximum price."
    );
  }

  const query = {
    isActive: true,
  };

  const normalizedSearch =
    typeof search === "string"
      ? search.trim().slice(0, 100)
      : "";

  const normalizedBrand =
    typeof brand === "string"
      ? brand.trim().slice(0, 100)
      : "";

  const escapedSearch = escapeRegex(normalizedSearch);
  const escapedBrand = escapeRegex(normalizedBrand);

  // Search
  if (escapedSearch) {
    query.$or = [
      {
        name: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        description: {
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

  // Category
  if (category) {
    query.category = category;
  }

  // Brand
  if (escapedBrand) {
    query.brand = {
      $regex: escapedBrand,
      $options: "i",
    };
  }

  // Price
  if (
    minPriceNumber !== null ||
    maxPriceNumber !== null
  ) {
    query.price = {};

    if (minPriceNumber !== null) {
      query.price.$gte = minPriceNumber;
    }

    if (maxPriceNumber !== null) {
      query.price.$lte = maxPriceNumber;
    }
  }

  // Featured
  if (featured !== undefined) {
    if (featured !== "true" && featured !== "false") {
      res.status(400);
      throw new Error(
        "Featured must be either true or false."
      );
    }

    query.isFeatured = featured === "true";
  }

  let sortOption = {
    createdAt: -1,
  };

  switch (sort) {
    case "price-low":
      sortOption = { price: 1 };
      break;

    case "price-high":
      sortOption = { price: -1 };
      break;

    case "rating":
      sortOption = { "ratings.average": -1 };
      break;

    case "name":
      sortOption = { name: 1 };
      break;

    case "newest":
      sortOption = { createdAt: -1 };
      break;

    default:
      res.status(400);
      throw new Error(
        "Invalid sort option. Use price-low, price-high, rating, name, or newest."
      );
  }

  // Discounted products only
  // if (onSale !== undefined) {
  //   if (onSale !== "true") {
  //     res.status(400);
  //     throw new Error("onSale must be true when provided.");
  //   }

  //   query.discountPrice = { $ne: null };
  //   query.$expr = {
  //     $lt: ["$discountPrice", "$price"],
  //   };
  // }

  const skip = (pageNumber - 1) * limitNumber;

  const products = await Product.find(query)
    .populate("category", "name slug")
    .sort(sortOption)
    .skip(skip)
    .limit(limitNumber);

  const total = await Product.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      products: products.map(getSafeProduct),
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    },
  });
});

// GET SINGLE PRODUCT
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error("Invalid product ID.");
  }

  const product = await Product.findById(id)
    .populate("category", "name slug");

  if (!product || !product.isActive) {
    res.status(404);
    throw new Error("Product not found.");
  }

  res.status(200).json({
    success: true,
    data: {
      product: getSafeProduct(product),
    },
  });
});

// CREATE PRODUCT
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    slug,
    description,
    price,
    discountPrice,
    category,
    brand,
    stock,
    sku,
    images,
    specifications,
    tags,
    isFeatured,
  } = req.body;

  const requiredValidation = validateRequest(
    {
      name,
      description,
      category,
      price,
    },
    ["name", "description", "category", "price"]
  );

  if (!requiredValidation.isValid) {
    res.status(400);
    const error = new Error(requiredValidation.message);
    error.errors = requiredValidation.errors;

    throw error;
  }

  if (!isValidObjectId(category)) {
    res.status(400);
    throw new Error("Invalid category ID.");
  }

  const productPrice = Number(price);

  if (!Number.isFinite(productPrice) || productPrice <= 0) {
    res.status(400);
    throw new Error("Product price must be greater than 0.");
  }

  let productDiscountPrice = null;

  if (
    discountPrice !== undefined &&
    discountPrice !== null &&
    discountPrice !== ""
  ) {
    productDiscountPrice = Number(discountPrice);

    if (
      !Number.isFinite(productDiscountPrice) ||
      productDiscountPrice < 0
    ) {
      res.status(400);
      throw new Error("Discount price must be a valid number.");
    }

    if (productDiscountPrice >= productPrice) {
      res.status(400);
      throw new Error(
        "Discount price must be less than the original price."
      );
    }
  }

  const productStock =
    stock === undefined || stock === ""
      ? 0
      : Number(stock);

  if (
    !Number.isInteger(productStock) ||
    productStock < 0
  ) {
    res.status(400);
    throw new Error(
      "Stock must be a non-negative whole number."
    );
  }

  const normalizedName = name.trim();

  const normalizedSlug = slug?.trim()
    ? createSlug(slug)
    : createSlug(normalizedName);

  if (!normalizedSlug) {
    res.status(400);
    throw new Error("A valid product slug is required.");
  }

  const normalizedSku = sku?.trim() || "";

  const duplicateConditions = [
    { slug: normalizedSlug },
  ];

  if (normalizedSku) {
    duplicateConditions.push({
      sku: normalizedSku,
    });
  }

  const existingProduct = await Product.findOne({
    $or: duplicateConditions,
  });

  if (existingProduct) {
    res.status(409);
    throw new Error(
      "Product with this slug or SKU already exists."
    );
  }

  const normalizedImages = (
    Array.isArray(images) ? images : []
  )
    .map((image) => {
      if (typeof image === "string") {
        return {
          url: image,
          publicId: "",
        };
      }

      if (!image || !image.url) {
        return null;
      }

      return {
        url: image.url,
        publicId: image.publicId || "",
      };
    })
    .filter(Boolean);

  const product = await Product.create({
    name: normalizedName,
    slug: normalizedSlug,
    description: description.trim(),
    price: productPrice,
    discountPrice: productDiscountPrice,
    category,
    brand: brand?.trim() || "",
    stock: productStock,
    sku: normalizedSku || undefined,
    images: normalizedImages,
    specifications,
    tags,
    isFeatured: isFeatured === true,
  });

  res.status(201).json({
    success: true,
    message: "Product created successfully.",
    data: {
      product: getSafeProduct(product),
    },
  });
});

// UPDATE PRODUCT
const updateProduct = asyncHandler(async (req, res) => {
  const {id} = req.params;

  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error("Invalid product ID");
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // if imges in there
  if (req.body.images !== undefined) {
    const images = req.body.images;
    const previousImages = Array.isArray(product.images)
      ? product.images
      : [];
    const getExistingImage = (url) =>
      previousImages.find(
        (image) =>
          typeof image !== "string" && image.url === url
      );

    const normalizedImages = (Array.isArray(images) ? images : [])
      .map((image) => {
        if (typeof image === "string") {
          const existingImage = getExistingImage(image);

          return {
            url: image,
            publicId: existingImage?.publicId || "",
          };
        }

        const url =
          typeof image?.url === "string" ? image.url.trim() : "";

        if (!url) {
          return null;
        }

        const existingImage = getExistingImage(url);
  
        return {
          url,
          publicId: image.publicId || existingImage?.publicId || "",
        };
      })
      .filter(Boolean);

      // Find removed Cloudinary images
      const newPublicIds = new Set(
        normalizedImages
          .map((image) => image.publicId)
          .filter(Boolean)
      );

    const removedImages = previousImages.filter((image) => {
      if (typeof image === "string") {
        return false;
      }

      return (
        image.publicId &&
        !newPublicIds.has(image.publicId)
      );
    });

    // Delete removed images from Cloudinary
    for (const image of removedImages) {
      await deleteCloudinaryImage(image.publicId);
    }

      product.images = normalizedImages;
    }

    const allowedFields = [
      "description",
      "brand",
      "specifications",
      "tags",
      "isFeatured",
      "isActive",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    if (req.body.category !== undefined) {
      if (!isValidObjectId(req.body.category)) {
        res.status(400);
        throw new Error("Invalid category ID.");
      }

      product.category = req.body.category;
    }

    if (req.body.price !== undefined) {
      const price = Number(req.body.price);

      if (!Number.isFinite(price) || price <= 0) {
        res.status(400);
        throw new Error("Product price must be greater than 0.");
      }

      product.price = price;
    }

    if (req.body.discountPrice !== undefined) {
      const discountPrice =
        req.body.discountPrice === null ||
        req.body.discountPrice === ""
          ? null
          : Number(req.body.discountPrice);

      if (
        discountPrice !== null &&
        (!Number.isFinite(discountPrice) ||
          discountPrice < 0)
      ) {
        res.status(400);
        throw new Error("Invalid discount price.");
      }

      if (
        discountPrice !== null &&
        discountPrice >= product.price
      ) {
        res.status(400);
        throw new Error(
          "Discount price must be less than the original price."
        );
      }

      product.discountPrice = discountPrice;
    }

    if (req.body.stock !== undefined) {
      const stock = Number(req.body.stock);

      if (
        !Number.isInteger(stock) ||
        stock < 0
      ) {
        res.status(400);
        throw new Error(
          "Stock must be a non-negative whole number."
        );
      }

      product.stock = stock;
    }

    if (req.body.slug !== undefined) {
      const normalizedSlug = createSlug(req.body.slug);

      if (!normalizedSlug) {
        res.status(400);
        throw new Error("Invalid product slug.");
      }

      product.slug = normalizedSlug;
    }

    if (req.body.name !== undefined) {
      if (!req.body.name.trim()) {
        res.status(400);
        throw new Error("Product name cannot be empty.");
      }

      product.name = req.body.name.trim();
    }

    if (req.body.sku !== undefined) {
      product.sku = req.body.sku?.trim() || undefined;
    }

    const updatedProduct = await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: {
        product: getSafeProduct(updatedProduct),
      },
    });
});

// DELETE PRODUCT
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Soft delete
  product.isActive = false;

  await product.save();

  res.status(200).json({
    success: true,
    message: "Product removed successfully",
  });
});

// Admin pages
export const getAdminProducts = asyncHandler(async (req, res) => {
  const {
    search = "",
    category = "",
    status = "",
    page = 1,
    limit = 10,
  } = req.query;

  if(category && !isValidObjectId(category)) {
    res.status(400);
    throw new Error("Invalid category ID");
  }

  const pageNumber = Math.max(Number(page), 1);
  const limitNumber = Math.min(Math.max(Number(limit), 1), 50);

  const filter = {};

  // Search
  if (search.trim()) {
    filter.$or = [
      {
        name: {
          $regex: search.trim(),
          $options: "i",
        },
      },
      {
        brand: {
          $regex: search.trim(),
          $options: "i",
        },
      },
      {
        sku: {
          $regex: search.trim(),
          $options: "i",
        },
      },
    ];
  }

  // Category
  if (category) {
    filter.category = category;
  }

  // Status
  if (status === "active") {
    filter.isActive = true;
  }

  if (status === "inactive") {
    filter.isActive = false;
  }

  const total = await Product.countDocuments(filter);

  const products = await Product.find(filter)
    .populate("category", "name slug")
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber);

  res.status(200).json({
    success: true,
    data: {
      products: products.map(getSafeProduct),
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber),
      },
    },
  });
});

export const toggleProductStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error("Invalid product ID");
  }
  
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  product.isActive = !product.isActive;

  await product.save();

  res.status(200).json({
    success: true,
    message: `Product ${
      product.isActive ? "activated" : "deactivated"
    } successfully`,
    data: {
      product: getSafeProduct(product),
    },
  });
});


export {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};