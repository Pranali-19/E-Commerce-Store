import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";

const MAX_WISHLIST_ITEMS = 500;

const getSafeWishlist = (wishlist) => ({
  id: wishlist._id,
  products: Array.isArray(wishlist.products)
    ? wishlist.products.map((product) => {
        if (!product) {
          return null;
        }

        return {
          id: product._id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          discountPrice: product.discountPrice,
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
          stock: product.stock,
          brand: product.brand || "",
          ratings: product.ratings
            ? {
                average: product.ratings.average || 0,
                count: product.ratings.count || 0,
              }
            : {
                average: 0,
                count: 0,
              },
          category: product.category
            ? {
                id: product.category._id,
                name: product.category.name,
                slug: product.category.slug,
              }
            : null,
          isActive: product.isActive,
        };
      }).filter(Boolean)
    : [],
  createdAt: wishlist.createdAt,
  updatedAt: wishlist.updatedAt,
});

const getOrCreateWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: userId,
      products: [],
    });
  }

  return wishlist;
};

const populateWishlist = async (wishlist) => {
  await wishlist.populate({
    path: "products",
    select:
      "name slug price discountPrice images stock brand ratings category isActive",
  });

  return wishlist;
};

// GET /api/wishlist
const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.user._id);

  const validProducts = [];

  for (const productId of wishlist.products) {
    const product = await Product.findOne({
      _id: productId,
      isActive: true,
    }).select("_id");

    if (product) {
      validProducts.push(product._id);
    }
  }

  if (validProducts.length !== wishlist.products.length) {
    wishlist.products = validProducts;
    await wishlist.save();
  }

  await populateWishlist(wishlist);

  res.status(200).json({
    success: true,
    data: getSafeWishlist(wishlist),
  });
});

// POST /api/wishlist/:productId
const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error("Invalid product ID.");
  }

  const product = await Product.findOne({
    _id: productId,
    isActive: true,
  });

  if (!product) {
    res.status(404);
    throw new Error("Product not found.");
  }

  const wishlist = await getOrCreateWishlist(req.user._id);

  const alreadyExists = wishlist.products.some(
    (id) => id.toString() === productId
  );

  if (alreadyExists) {
    await populateWishlist(wishlist);

    return res.status(200).json({
      success: true,
      message: "Product is already in your wishlist.",
      data: getSafeWishlist(wishlist),
    });
  }

  if (wishlist.products.length >= MAX_WISHLIST_ITEMS) {
    res.status(400);
    throw new Error(
      `Wishlist can contain a maximum of ${MAX_WISHLIST_ITEMS} products.`
    );
  }
  
  wishlist.products.push(product._id);

  await wishlist.save();
  await populateWishlist(wishlist);

  res.status(200).json({
    success: true,
    message: "Product added to wishlist.",
    data: wishlist,
  });
});

// DELETE /api/wishlist/:productId
const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error("Invalid product ID.");
  }

  const wishlist = await getOrCreateWishlist(req.user._id);

  const exists = wishlist.products.some(
    (id) => id.toString() === productId
  );

  if (!exists) {
    res.status(404);
    throw new Error("Product is not in your wishlist.");
  }

  wishlist.products = wishlist.products.filter(
    (id) => id.toString() !== productId
  );

  await wishlist.save();
  await populateWishlist(wishlist);

  res.status(200).json({
    success: true,
    message: "Product removed from wishlist.",
    data: getSafeWishlist(wishlist),
  });
});

// DELETE /api/wishlist
const clearWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.user._id);

  wishlist.products = [];

  await wishlist.save();

  res.status(200).json({
    success: true,
    message: "Wishlist cleared.",
    data: getSafeWishlist(wishlist),
  });
});

export {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
};