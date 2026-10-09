import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import createNotification from "../utils/createNotification.js";
import { validateRequest } from "../utils/validation.js";
import { sendOrderConfirmationEmail , sendOrderCancelledEmail} from "../utils/sendOrderEmail.js";
// import InventoryLog from "../models/InventoryLog.js";
import StoreSettings from "../models/StoreSettings.js";
import { decreaseProductStock , increaseProductStock} from "../utils/updateInventoryStock.js";

import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Address from "../models/Address.js";
import Order from "../models/Order.js";
import Coupon from "../models/Coupon.js";
import { getSafeCustomerOrder } from "../utils/orderSerializer.js";

// const getSafeCustomerOrder = (order) => ({
//   id: order._id,

//   items: Array.isArray(order.items)
//     ? order.items.map((item) => ({
//         product: item.product,
//         name: item.name,
//         image: item.image || "",
//         price: item.price,
//         quantity: item.quantity,
//       }))
//     : [],

//   shippingAddress: order.shippingAddress
//     ? {
//         fullName: order.shippingAddress.fullName || "",
//         phone: order.shippingAddress.phone || "",
//         addressLine1:
//           order.shippingAddress.addressLine1 || "",
//         addressLine2:
//           order.shippingAddress.addressLine2 || "",
//         city: order.shippingAddress.city || "",
//         state: order.shippingAddress.state || "",
//         postalCode:
//           order.shippingAddress.postalCode || "",
//         country:
//           order.shippingAddress.country || "",
//       }
//     : null,

//   paymentMethod: order.paymentMethod,
//   paymentStatus: order.paymentStatus,
//   orderStatus: order.orderStatus,

//   subtotal: order.subtotal,
//   shippingFee: order.shippingFee,
//   discount: order.discount,
//   tax: order.tax,
//   totalAmount: order.totalAmount,

//   couponCode: order.couponCode || "",

//   statusHistory: Array.isArray(order.statusHistory)
//     ? order.statusHistory.map((history) => ({
//         status: history.status,
//         note: history.note || "",
//         createdAt: history.createdAt,
//       }))
//     : [],

//   deliveredAt: order.deliveredAt || null,
//   cancelledAt: order.cancelledAt || null,

//   createdAt: order.createdAt,
//   updatedAt: order.updatedAt,
// });

const calculateCouponDiscount = (coupon, subtotal) => {
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

const validateCheckoutInput = ({
  addressId,
  paymentMethod,
  couponCode,
}) => {
  const requiredValidation = validateRequest({ addressId, paymentMethod }, ["addressId", "paymentMethod"]);
  const errors = [...requiredValidation.errors];

  if (
    !addressId ||
    typeof addressId !== "string" ||
    !mongoose.Types.ObjectId.isValid(addressId)
  ) {
    errors.push({
      field: "addressId",
      message: "A valid delivery address is required.",
    });
  }

  if (
    typeof paymentMethod !== "string" ||
    !["cod"].includes(paymentMethod.toLowerCase())
  ) {
    errors.push({
      field: "paymentMethod",
      message: "Invalid payment method.",
    });
  }

  if (
    couponCode !== undefined &&
    couponCode !== null &&
    typeof couponCode !== "string"
  ) {
    errors.push({
      field: "couponCode",
      message: "Coupon code must be a text value.",
    });
  }

  return errors;
};

const createOrder = asyncHandler(async (req, res) => {
  const {
    addressId,
    paymentMethod = "cod",
    couponCode = "",
  } = req.body;

  const normalizedPaymentMethod = 
    typeof paymentMethod === "string"
      ? paymentMethod.trim().toLowerCase()
      : ""; 

  const normalizedCouponCode =
    typeof couponCode === "string"
      ? couponCode.trim().toUpperCase()
      : "";

  const validationErrors = validateCheckoutInput({
    addressId,
    paymentMethod: normalizedPaymentMethod,
    couponCode,
  });

  if (validationErrors.length > 0) {
    res.status(400);

    const error = new Error("Checkout validation failed.");
    error.errors = validationErrors;

    throw error;
  }

  const address = await Address.findOne({
    _id: addressId,
    user: req.user._id,
  });

  if (!address) {
    res.status(404);
    throw new Error("Delivery address not found.");
  }

  // Get store settings
  let settings = await StoreSettings.findOne();

  if (!settings) {
    settings = await StoreSettings.create({});
  }

  const cart = await Cart.findOne({
    user: req.user._id,
  }).populate("items.product");

  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error("Your cart is empty.");
  }

  // Validate minimum order amount
  // This is checked after calculating the subtotal below.
  
  // Validate stock before creating the order
  for (const item of cart.items) {
    if (
      !item.quantity ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    ) {
      res.status(400);

      throw new Error(
        "Invalid product quantity in your cart."
      );
    }

    if (!item.product?._id) {
      res.status(400);

      throw new Error(
        "A product in your cart is no longer available."
      );
    }

    const product = await Product.findById(
      item.product._id
    );

    if (!product || !product.isActive) {
      res.status(400);
      throw new Error(
        `${item.product.name} is no longer available.`
      );
    }

    if (product.stock < item.quantity) {
      res.status(400);
      throw new Error(
        `Only ${product.stock} units of ${product.name} are available.`
      );
    }
  }

  const orderItems = [];

  let subtotal = 0;

  for (const item of cart.items) {
    const product = await Product.findById(item.product._id);

    const currentPrice =
      product.discountPrice ?? product.price;

    const itemTotal =
      currentPrice * item.quantity;

    subtotal += itemTotal;

    orderItems.push({
      product: product._id,
      name: product.name,

      // Support new Cloudinary image object
      // and legacy string image format.
      image:
        typeof product.images?.[0] === "string"
          ? product.images[0]
          : product.images?.[0]?.url || "",

      price: currentPrice,
      quantity: item.quantity,
    });
  }

  // Minimum order amount from Store Settings
  if (
    settings.minimumOrderAmount > 0 &&
    subtotal < settings.minimumOrderAmount
  ) {
    res.status(400);
    throw new Error(
      `Minimum order amount is ₹${settings.minimumOrderAmount}.`
    );
  }

  // Calculate shipping using Store Settings
  let shippingFee = 0;

  if (settings.shippingEnabled) {
    if (
      settings.freeShippingMinimum > 0 &&
      subtotal >= settings.freeShippingMinimum
    ) {
      shippingFee = 0;
    } else {
      shippingFee = settings.shippingCharge;
    }
  }

  // Calculate coupon discount
  let discount = 0;
  let appliedCouponCode = "";

  if (couponCode && couponCode.trim()) {
    if(normalizedCouponCode) {
      const coupon = await Coupon.findOne({
        code: normalizedCouponCode,
        isActive: true,
      });
    
    if (!coupon) {
      res.status(400);
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
      throw new Error(
        "This coupon usage limit has been reached."
      );
    }

    if (subtotal < coupon.minimumOrderAmount) {
      res.status(400);
      throw new Error(
        `Minimum order amount for this coupon is ₹${coupon.minimumOrderAmount}.`
      );
    }

    discount = calculateCouponDiscount(
      coupon,
      subtotal
    );

    appliedCouponCode = coupon.code;
  }}


  // Calculate tax
  let tax = 0;

  if (settings.taxEnabled && settings.taxPercentage > 0) {
    const taxableAmount =
      subtotal + shippingFee - discount;

    tax =
      (taxableAmount * settings.taxPercentage) / 100;
  }

  // Prevent negative total
  const totalAmount = Math.max(
    0,
    subtotal +
      shippingFee -
      discount +
      tax
  );
  if (
    !Number.isFinite(subtotal) ||
    !Number.isFinite(shippingFee) ||
    !Number.isFinite(discount) ||
    !Number.isFinite(tax) ||
    !Number.isFinite(totalAmount)
  ) {
    res.status(400);

    throw new Error(
      "Unable to calculate a valid order total."
    );
  }

  const order = await Order.create({
    user: req.user._id,

    items: orderItems,

    shippingAddress: {
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    },

    paymentMethod: "cod",
    paymentStatus: "pending",

    orderStatus: "confirmed",

    subtotal,
    shippingFee,
    discount,

    // Only include tax if your Order model supports it.
    tax,

    totalAmount,

    couponCode: appliedCouponCode,

    statusHistory: [
      {
        status: "confirmed",
        note: "Order confirmed successfully",
      },
    ],
  });

  // Reduce stock atomically
  const stockReducedItems = [];

  try {
    for (const item of cart.items) {
      await decreaseProductStock({
        productId: item.product._id,
        quantity: item.quantity,
        userId: req.user._id,
        reason: `COD order #${order._id}`,
      });

      stockReducedItems.push({
        productId: item.product._id,
        quantity: item.quantity,
      });
    }
  } catch (error) {
    // Roll back any stock reductions already completed
    for (const item of stockReducedItems) {
      try {
        await increaseProductStock({
          productId: item.productId,
          quantity: item.quantity,
          userId: req.user._id,
          adjustmentType: "cancellation",
          reason: `Rollback failed COD order #${order._id}`,
        });
      } catch (rollbackError) {
        console.error(
          `Failed to rollback stock for product ${item.productId}:`,
          rollbackError
        );
      }
    }
    // Roll back coupon usage
    if (appliedCouponCode) {
      await Coupon.findOneAndUpdate(
        {
          code: appliedCouponCode,
          usedCount: { $gt: 0 },
        },
        {
          $inc: { usedCount: -1 },
        }
      );
    }

    // Remove the order because stock could not be reserved
    await Order.findByIdAndDelete(order._id);

    res.status(400);
    throw new Error(
      error.message || "Unable to reserve stock. Please try again."
    );
  }

  // Atomically increase coupon usage
  if (appliedCouponCode) {
    const updatedCoupon =
      await Coupon.findOneAndUpdate(
        {
          code: appliedCouponCode,
          isActive: true,
          $or: [
            { usageLimit: null },
            {
              $expr: {
                $lt: [
                  "$usedCount",
                  "$usageLimit",
                ],
              },
            },
          ],
        },
        {
          $inc: {
            usedCount: 1,
          },
        },
        {
          new: true,
        }
      );

    if (!updatedCoupon) {
      await Order.findByIdAndDelete(order._id);

      res.status(400);
      throw new Error(
        "This coupon is no longer available. Please try again."
      );
    }
  }

  // Empty cart
  cart.items = [];
  cart.subtotal = 0;
  cart.discount = 0;
  cart.total = 0;

  await cart.save();

  const populatedOrder = await Order.findById(
    order._id
  ).populate("user", "name email");

  // Notification
  await createNotification({
    user: req.user._id,
    type: "order_confirmed",
    title: "Order Confirmed 🎉",
    message: `Your order #${order._id} has been confirmed successfully.`,
    order: order._id,
  });

  // Email
  await sendOrderConfirmationEmail(order);

  res.status(201).json({
    success: true,
    message: "Order placed successfully.",
    data: getSafeCustomerOrder(populatedOrder),
  });
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    user: req.user._id,
  }).populate("items.product", "images").sort({
    createdAt: -1,
  });

  res.status(200).json({
    success: true,
    data: orders.map(getSafeCustomerOrder),
  });
});

const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid order ID.");
  }

  const order = await Order.findOne({
    _id: id,
    user: req.user._id,
  })
    .populate("user", "name email")
    .populate("items.product", "images");

  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }

  res.status(200).json({
    success: true,
    data: getSafeCustomerOrder(order),
  });
});

const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid order ID.");
  }

  const order = await Order.findOne({
    _id: id,
    user: req.user._id,
  });

  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }

  const previousStatus = order.orderStatus;

  const cancellableStatuses = [
    "pending",
    "confirmed",
    "processing",
  ];

  if (!cancellableStatuses.includes(previousStatus)) {
    res.status(400);
    throw new Error(
      `Order cannot be cancelled because it is already ${previousStatus.replaceAll(
        "_",
        " "
      )}.`
    );
  }

  // Only restore stock when actually transitioning to cancelled
  const isTransitioningToCancelled =
    previousStatus !== "cancelled";

  if (isTransitioningToCancelled) {
    for (const item of order.items) {
      await increaseProductStock({
        productId: item.product,
        quantity: item.quantity,
        userId: req.user._id,
        adjustmentType: "cancellation",
        reason: `Order ${order._id} cancelled`,
      });
    }
  }

  order.orderStatus = "cancelled";
  order.cancelledAt = new Date();

  order.statusHistory.push({
    status: "cancelled",
    note: "Order cancelled by customer",
  });

  await order.save();

  // Restore coupon usage only after successfull cancellation
  if (order.couponCode) {
    await Coupon.findOneAndUpdate(
      {
        code: order.couponCode,
        usedCount: { $gt: 0 },
      },
      {
        $inc: {
          usedCount: -1,
        },
      }
    );
  }

  await sendOrderCancelledEmail(order);

  res.status(200).json({
    success: true,
    message: "Order cancelled successfully.",
    data: getSafeCustomerOrder(order),
  });
});

export {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
};