import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { validateRequest } from "../utils/validation.js";

const MAX_CART_QUANTITY = 100;

const calculateTotals = (items) => {
  let subtotal = 0;

  for (const item of items) {
    if (
      !Number.isFinite(item.price) ||
      item.price < 0 ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    ) {
      throw new Error("Invalid cart item data.");
    }

    const itemTotal = item.price * item.quantity;

    if (!Number.isFinite(itemTotal)) {
      throw new Error("Unable to calculate cart total.");
    }

    subtotal += itemTotal;
  }

  if (!Number.isFinite(subtotal) || subtotal < 0) {
    throw new Error("Unable to calculate cart subtotal.");
  }

  const discount = 0;
  const total = subtotal - discount;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(discount.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
};

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [],
      subtotal: 0,
      discount: 0,
      total: 0,
    });
  }

  return cart;
};

const populateCart = async (cart) => {
  await cart.populate({
    path: "items.product",
    select:
      "name slug price discountPrice images stock brand ratings category isActive",
  });

  return cart;
};

const getSafeCart = (cart) => ({
  id: cart._id,
  items: Array.isArray(cart.items)
    ? cart.items.map((item) => ({
        id: item._id,
        product: item.product
          ? {
              id: item.product._id,
              name: item.product.name,
              slug: item.product.slug,
              price: item.product.price,
              discountPrice: item.product.discountPrice,
              images: Array.isArray(item.product.images)
                ? item.product.images
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
              stock: item.product.stock,
              brand: item.product.brand || "",
              ratings: item.product.ratings
                ? {
                    average: item.product.ratings.average || 0,
                    count: item.product.ratings.count || 0,
                  }
                : {
                    average: 0,
                    count: 0,
                  },
              category: item.product.category
                ? {
                    id: item.product.category._id,
                    name: item.product.category.name,
                    slug: item.product.category.slug,
                  }
                : null,
              isActive: item.product.isActive,
            }
          : null,
        price: item.price,
        quantity: item.quantity,
      }))
    : [],
  subtotal: cart.subtotal,
  discount: cart.discount,
  total: cart.total,
  createdAt: cart.createdAt,
  updatedAt: cart.updatedAt,
});

const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);

  const validItems = [];

  for (const item of cart.items) {
    const product = await Product.findOne({
      _id: item.product,
      isActive: true,
    });

    if (!product) {
      continue;
    }

    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      continue;
    }

    if (product.stock <= 0) {
      continue;
    }

    item.price = product.discountPrice ?? product.price;

    if (item.quantity > product.stock) {
      item.quantity = product.stock;
    }

    if (item.quantity > 0) {
      validItems.push(item);
    }
  }

  cart.items = validItems;

  const totals = calculateTotals(cart.items);

  cart.subtotal = totals.subtotal;
  cart.discount = totals.discount;
  cart.total = totals.total;

  await cart.save();
  await populateCart(cart);

  res.status(200).json({
    success: true,
    data: getSafeCart(cart),
  });
});

const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  const requiredValidation = validateRequest(req.body, ["productId"]);

  if (!requiredValidation.isValid) {
    res.status(400);

    const error = new Error(requiredValidation.message);
    error.errors = requiredValidation.errors;

    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error("Valid product ID is required.");
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_CART_QUANTITY) {
    res.status(400);
    throw new Error(`Quantity must be between 1 and ${MAX_CART_QUANTITY}.`);
  }

  const product = await Product.findOne({
    _id: productId,
    isActive: true,
  });

  if (!product) {
    res.status(404);
    throw new Error("Product not found.");
  }

  if (product.stock <= 0) {
    res.status(400);
    throw new Error("This product is out of stock.");
  }

  if (quantity > product.stock) {
    res.status(400);
    throw new Error(`Only ${product.stock} items are available.`);
  }

  const cart = await getOrCreateCart(req.user._id);

  const existingItem = cart.items.find(
    (item) => item.product.toString() === productId
  );

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;

    if (newQuantity > product.stock) {
      res.status(400);
      throw new Error(
        `Only ${product.stock} items are available.`
      );
    }

    existingItem.quantity = newQuantity;
    existingItem.price =
      product.discountPrice ?? product.price;
  } else {
    cart.items.push({
      product: product._id,
      quantity,
      price: product.discountPrice ?? product.price,
    });
  }

  const totals = calculateTotals(cart.items);

  cart.subtotal = totals.subtotal;
  cart.discount = totals.discount;
  cart.total = totals.total;

  await cart.save();
  await populateCart(cart);

  res.status(200).json({
    success: true,
    message: "Product added to cart.",
    data: getSafeCart(cart),
  });
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  const requiredValidation = validateRequest({ quantity }, ["quantity"]);

  if (!requiredValidation.isValid) {
    res.status(400);

    const error = new Error(requiredValidation.message);
    error.errors = requiredValidation.errors;

    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error("Invalid product ID.");
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_CART_QUANTITY) {
    res.status(400);
    throw new Error(`Quantity must be between 1 and ${MAX_CART_QUANTITY}.`);
  }


  const product = await Product.findOne({
    _id: productId,
    isActive: true,
  });

  if (!product) {
    res.status(404);
    throw new Error("Product not found.");
  }

  if (quantity > product.stock) {
    res.status(400);
    throw new Error(
      `Only ${product.stock} items are available.`
    );
  }

  const cart = await getOrCreateCart(req.user._id);

  const item = cart.items.find(
    (item) => item.product.toString() === productId
  );

  if (!item) {
    res.status(404);
    throw new Error("Product is not in your cart.");
  }

  item.quantity = quantity;
  item.price = product.discountPrice ?? product.price;

  const totals = calculateTotals(cart.items);

  cart.subtotal = totals.subtotal;
  cart.discount = totals.discount;
  cart.total = totals.total;

  await cart.save();
  await populateCart(cart);

  res.status(200).json({
    success: true,
    message: "Cart updated.",
    data: getSafeCart(cart),
  });
});

const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error("Invalid product ID.");
  }

  const cart = await getOrCreateCart(req.user._id);

  const itemExists = cart.items.some(
    (item) => item.product.toString() === productId
  );

  if (!itemExists) {
    res.status(404);
    throw new Error("Product is not in your cart.");
  }

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId
  );

  const totals = calculateTotals(cart.items);

  cart.subtotal = totals.subtotal;
  cart.discount = totals.discount;
  cart.total = totals.total;

  await cart.save();
  await populateCart(cart);

  res.status(200).json({
    success: true,
    message: "Product removed from cart.",
    data: getSafeCart(cart),
  });
});

const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);

  cart.items = [];
  cart.subtotal = 0;
  cart.discount = 0;
  cart.total = 0;

  await cart.save();

  res.status(200).json({
    success: true,
    message: "Cart cleared.",
    data: getSafeCart(cart),
  });
});

export {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};