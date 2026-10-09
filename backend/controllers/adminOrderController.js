import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import createNotification from "../utils/createNotification.js";
import { sendOrderStatusEmail } from "../utils/sendOrderEmail.js";
import InventoryLog from "../models/InventoryLog.js";
import {
  increaseProductStock,
} from "../utils/updateInventoryStock.js";

const getSafeAdminOrder = (order) => ({
  id: order._id,

  user: order.user
    ? {
        id: order.user._id,
        name: order.user.name,
        email: order.user.email,
        phone: order.user.phone || "",
      }
    : null,

  items: Array.isArray(order.items)
    ? order.items.map((item) => ({
        product: item.product,
        name: item.name,
        image: item.image || "",
        price: item.price,
        quantity: item.quantity,
      }))
    : [],

  shippingAddress: order.shippingAddress
    ? {
        fullName: order.shippingAddress.fullName || "",
        phone: order.shippingAddress.phone || "",
        addressLine1: order.shippingAddress.addressLine1 || "",
        addressLine2: order.shippingAddress.addressLine2 || "",
        city: order.shippingAddress.city || "",
        state: order.shippingAddress.state || "",
        postalCode: order.shippingAddress.postalCode || "",
        country: order.shippingAddress.country || "",
      }
    : null,

  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,

  orderStatus: order.orderStatus,

  subtotal: order.subtotal,
  shippingFee: order.shippingFee,
  discount: order.discount,
  tax: order.tax,
  totalAmount: order.totalAmount,

  couponCode: order.couponCode || "",

  statusHistory: Array.isArray(order.statusHistory)
    ? order.statusHistory.map((history) => ({
        status: history.status,
        note: history.note || "",
        createdAt: history.createdAt,
      }))
    : [],

  deliveredAt: order.deliveredAt || null,
  cancelledAt: order.cancelledAt || null,

  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});

const VALID_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

const STATUS_MESSAGES = {
  pending: "Your order is pending confirmation.",
  confirmed: "Your order has been confirmed.",
  processing: "Your order is being prepared.",
  shipped: "Your order has been shipped.",
  out_for_delivery: "Your order is out for delivery.",
  delivered: "Your order has been delivered.",
  cancelled: "Your order has been cancelled.",
};

const STATUS_NOTIFICATION_TYPES = {
  shipped: "order_shipped",
  out_for_delivery: "out_for_delivery",
  delivered: "order_delivered",
  cancelled: "order_cancelled",
};

export const getAdminOrders = asyncHandler(async (req, res) => {
  const {
    search = "",
    status = "",
    paymentStatus = "",
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
    throw new Error("Limit must be an integer between 1 and 50.");
  }

  const pageNumber = parsedPage;
  const limitNumber = parsedLimit;

  const filter = {};

  if (status) {
    if (
      typeof status !== "string" ||
      !VALID_STATUSES.includes(status.trim().toLowerCase())
    ) {
      res.status(400);
      throw new Error("Invalid order status filter.");
    }

    filter.orderStatus = status.trim().toLowerCase();
  }

  const VALID_PAYMENT_STATUSES = [
    "pending",
    "paid",
    "failed",
    "refunded",
  ];

  if (paymentStatus) {
    if (
      typeof paymentStatus !== "string" ||
      !VALID_PAYMENT_STATUSES.includes(
        paymentStatus.trim().toLowerCase()
      )
    ) {
      res.status(400);
      throw new Error("Invalid payment status filter.");
    }

    filter.paymentStatus = paymentStatus.trim().toLowerCase();
  }

  const escapeRegex = (value) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  if (typeof search !== "string") {
    res.status(400);
    throw new Error("Search must be a string.");
  }

  const searchValue = escapeRegex(search.trim());

  const users = await mongoose
    .model("User")
    .find({
      $or: [
        { name: { $regex: searchValue, $options: "i" } },
        { email: { $regex: searchValue, $options: "i" } },
      ],
    })
    .select("_id");

  const userIds = users.map((user) => user._id);

  const searchConditions = [
    ...(userIds.length > 0 ? [{ user: { $in: userIds } }] : []),
  ];

  if (mongoose.Types.ObjectId.isValid(searchValue)) {
    searchConditions.push({
      _id: new mongoose.Types.ObjectId(searchValue),
    });
  }

  if (searchConditions.length > 0) {
    filter.$or = searchConditions;
  } else {
    return res.status(200).json({
      success: true,
      data: {
        orders: [],
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total: 0,
          pages: 0,
        },
      },
    });
  }
  

  const total = await Order.countDocuments(filter);

  const orders = await Order.find(filter)
    .populate("user", "name email phone")
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber);

  res.status(200).json({
    success: true,
    data: {
      orders: orders.map(getSafeAdminOrder),
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber),
      },
    },
  });
});

export const getAdminOrderById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid order ID.");
  }
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email phone"
  );

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  res.status(200).json({
    success: true,
    data: {
      order: getSafeAdminOrder(order),
    },
  });
});

export const updateAdminOrderStatus = asyncHandler(async (req, res) => {
  const { status, note = "" } = req.body;

  if (typeof status !== "string") {
    res.status(400);
    throw new Error("Order status must be a string.");
  }

  if (typeof note !== "string") {
    res.status(400);
    throw new Error("Order note must be a string.");
  }

  const normalizedStatus = status.trim().toLowerCase();
  const normalizedNote = note.trim();

  if (!VALID_STATUSES.includes(normalizedStatus)) {
    res.status(400);
    throw new Error("Invalid order status");
  }
  
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid order ID.");
  }

  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email phone"
  );

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Do not allow an already cancelled order to become active again.
  if (order.orderStatus === "cancelled" && normalizedStatus !== "cancelled") {
    res.status(400);
    throw new Error("A cancelled order cannot be reactivated");
  }

  // Do nothing if status has not changed.
  if (order.orderStatus === normalizedStatus) {
    res.status(400);
    throw new Error("Order is already in this status");
  }

  const previousStatus = order.orderStatus;

  // Restore stock only when cancelling for the first time.
  if (status === "cancelled" && previousStatus !== "cancelled") {
    for (const item of order.items) {
      await increaseProductStock({
        productId: item.product,
        quantity: item.quantity,
        userId: req.user._id,
        adjustmentType: "cancellation",
        reason: ` Admin Order #${order._id} cancelled`,
      });
    }
  }

  if (normalizedStatus === "cancelled") {
    order.cancelledAt = new Date();
  }

  if (normalizedStatus === "delivered") {
    order.deliveredAt = new Date();
  }

  order.orderStatus = normalizedStatus;

  order.statusHistory.push({
    status: normalizedStatus,
    note: normalizedNote,
    createdAt: new Date(),
  });

  await order.save();

  const notificationType =
    STATUS_NOTIFICATION_TYPES[status] || "general";

  await createNotification({
    user: order.user._id,
    type: notificationType,
    title: `Order ${status.replaceAll("_", " ")}`,
    message: STATUS_MESSAGES[status],
    order: order._id,
  });

  if (
    ["shipped", "out_for_delivery", "delivered", "cancelled"].includes(
      status
    )
  ) {
    await sendOrderStatusEmail(order, normalizedStatus, normalizedNote);
  }

  res.status(200).json({
    success: true,
    message: `Order status updated to ${normalizedStatus.replaceAll("_", " ")}`,
    data: {
      order: getSafeAdminOrder(order),
    },
  });
});