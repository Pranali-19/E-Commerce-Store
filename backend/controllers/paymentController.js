import asyncHandler from "express-async-handler";
import crypto from "crypto";
import createNotification from "../utils/createNotification.js";
import { sendOrderConfirmationEmail , sendPaymentSuccessEmail } from "../utils/sendOrderEmail.js";
import razorpay from "../config/razorpay.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Address from "../models/Address.js";
import Coupon from "../models/Coupon.js";
import Order from "../models/Order.js";
import StoreSettings from "../models/StoreSettings.js";
import InventoryLog from "../models/InventoryLog.js";
import { decreaseProductStock } from "../utils/updateInventoryStock.js";
import { getSafeCustomerOrder } from "../utils/orderSerializer.js";

const calculateCouponDiscount = (coupon, subtotal) => {
  let discount = 0;

  if (coupon.discountType === "percentage") {
    discount =
      (subtotal * coupon.discountValue) / 100;

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

const calculateCartTotals = async (userId, couponCode = "") => {
  const cart = await Cart.findOne({
    user: userId,
  }).populate("items.product");

  if (!cart || cart.items.length === 0) {
    const error = new Error("Your cart is empty.");
    error.statusCode = 400;
    throw error;
  }

  // Get store settings
  let settings = await StoreSettings.findOne();

  if (!settings) {
    settings = await StoreSettings.create({});
  }

  // Minimum order validation
  const minimumOrderAmount = Number(
    settings.minimumOrderAmount || 0
  );

  let subtotal = 0;

  for (const item of cart.items) {
    const product = await Product.findById(
      item.product._id
    );

    if (!product || !product.isActive) {
      const error = new Error(
        `${item.product.name} is no longer available.`
      );
      error.statusCode = 400;
      throw error;
    }

    if (product.stock < item.quantity) {
      const error = new Error(
        `Only ${product.stock} units of ${product.name} are available.`
      );
      error.statusCode = 400;
      throw error;
    }

    const currentPrice =
      product.discountPrice ?? product.price;

    subtotal += currentPrice * item.quantity;
  }

  subtotal = Number(subtotal.toFixed(2));

  // Minimum order amount
  if (
    minimumOrderAmount > 0 &&
    subtotal < minimumOrderAmount
  ) {
    const error = new Error(
      `Minimum order amount is ₹${minimumOrderAmount}.`
    );
    error.statusCode = 400;
    throw error;
  }

  // Shipping calculation
  let shippingFee = 0;

  if (settings.shippingEnabled) {
    const shippingCharge = Number(
      settings.shippingCharge || 0
    );

    const freeShippingMinimum = Number(
      settings.freeShippingMinimum || 0
    );

    if (
      freeShippingMinimum > 0 &&
      subtotal >= freeShippingMinimum
    ) {
      shippingFee = 0;
    } else {
      shippingFee = shippingCharge;
    }
  }

  shippingFee = Number(shippingFee.toFixed(2));

  // Coupon calculation
  let discount = 0;
  let appliedCouponCode = "";

  if (couponCode?.trim()) {
    const coupon = await Coupon.findOne({
      code: couponCode.trim().toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      const error = new Error(
        "Invalid coupon code."
      );
      error.statusCode = 400;
      throw error;
    }

    if (
      new Date() >= coupon.expiryDate
    ) {
      const error = new Error(
        "This coupon has expired."
      );
      error.statusCode = 400;
      throw error;
    }

    if (
      coupon.usageLimit !== null &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      const error = new Error(
        "This coupon usage limit has been reached."
      );
      error.statusCode = 400;
      throw error;
    }

    if (
      subtotal < coupon.minimumOrderAmount
    ) {
      const error = new Error(
        `Minimum order amount for this coupon is ₹${coupon.minimumOrderAmount}.`
      );
      error.statusCode = 400;
      throw error;
    }

    discount = calculateCouponDiscount(
      coupon,
      subtotal
    );

    appliedCouponCode = coupon.code;
  }

  // Tax calculation
  let tax = 0;

  if (settings.taxEnabled) {
    const taxPercentage = Number(
      settings.taxPercentage || 0
    );

    const taxableAmount = Math.max(
      0,
      subtotal +
        shippingFee -
        discount
    );

    tax =
      (taxableAmount * taxPercentage) /
      100;

    tax = Number(tax.toFixed(2));
  }

  // Final total
  const totalAmount = Number(
    (
      subtotal +
      shippingFee -
      discount +
      tax
    ).toFixed(2)
  );

  return {
    cart,
    subtotal,
    shippingFee,
    discount,
    tax,
    totalAmount,
    appliedCouponCode,

    // Useful for payment/order processing
    currency:
      settings.currency || "INR",

    currencySymbol:
      settings.currencySymbol || "₹",

    storeName:
      settings.storeName || "My Store",
  };
};

const createRazorpayOrder = asyncHandler(
  async (req, res) => {
    const { couponCode = "" } = req.body;

    const totals = await calculateCartTotals(
      req.user._id,
      couponCode
    );

    const razorpayOrder =
      await razorpay.orders.create({
        amount: Math.round(
          totals.totalAmount * 100
        ),
        currency: totals.currency,
        receipt: `receipt_${Date.now()}`,
        notes: {
          userId: req.user._id.toString(),
          couponCode:
            totals.appliedCouponCode || "",
        },
      });

    res.status(201).json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        subtotal: totals.subtotal,
        shippingFee: totals.shippingFee,
        discount: totals.discount,
        tax: totals.tax,
        totalAmount: totals.totalAmount,
        couponCode: totals.appliedCouponCode,
      },
    });
  }
);

const verifyRazorpayPayment = asyncHandler(
  async (req, res) => {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      addressId,
      couponCode = "",
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      res.status(400);
      throw new Error(
        "Payment information is incomplete."
      );
    }

    if (!addressId) {
      res.status(400);
      throw new Error(
        "Delivery address is required."
      );
    }

    // verify razorpay signature
    const generatedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(
          `${razorpay_order_id}|${razorpay_payment_id}`
        )
        .digest("hex");

    const generatedSignatureBuffer = Buffer.from(
      generatedSignature,
      "utf8"
    );

    const providedSignatureBuffer = Buffer.from(
      razorpay_signature,
      "utf8"
    );

    const signatureMatches =
      generatedSignatureBuffer.length ===
        providedSignatureBuffer.length &&
      crypto.timingSafeEqual(
        generatedSignatureBuffer,
        providedSignatureBuffer
      );

    if (!signatureMatches) {
      res.status(400);
      throw new Error(
        "Payment verification failed."
      );
    }

    // fetch razorpay order
    const razorpayOrder =
      await razorpay.orders.fetch(
        razorpay_order_id
      );
    
    if (!razorpayOrder) {
      res.status(400);
      throw new Error("Razorpay order could not be found.");
    }

    const razorpayUserId = razorpayOrder.notes?.userId;

    if (!razorpayUserId || razorpayUserId !== req.user._id.toString()) {
      res.status(403);
      throw new Error("This payment does not belong to your account.");
    }

    // fetch razorpay payment
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
      if (!payment) {
        res.status(400);
        throw new Error("Payment details could not be verified.");
      }

    // verify payment
    if (payment.status !== "captured") {
      res.status(400);
      throw new Error(
        `Payment was not captured. Current status: ${payment.status}`
      );
    }

    // duplicate payments
    const existingOrder = await Order.findOne({
      user: req.user._id,
      "paymentDetails.razorpayOrderId": razorpay_order_id,
    });

    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: "Payment already processed.",
        data: {
          order: getSafeCustomerOrder(existingOrder),
          alreadyProcessed: true,
        },
      });
    }

    // validate adress
    const address = await Address.findOne({
      _id: addressId,
      user: req.user._id,
    });

    if (!address) {
      res.status(404);
      throw new Error(
        "Delivery address not found."
      );
    }

    // recalculute cart
    const totals = await calculateCartTotals(
      req.user._id,
      couponCode
    );

    // verify amount
    const expectedAmount = Math.round(
      totals.totalAmount * 100
    );

    if (
      Number(razorpayOrder.amount) !==
        expectedAmount ||
      razorpayOrder.currency !==
        totals.currency
    ) {
      res.status(400);
      throw new Error(
        "Payment amount does not match the order total."
      );
    }

    if (Number(payment.amount) !== expectedAmount) {
      res.status(400);
      throw new Error("Payment amount does not match the order total.");
    }

    if (payment.currency !== totals.currency) {
      res.status(400);
      throw new Error("Payment currency does not match the order currency.");
    }

    // verify razorpay payment belong to razorpay order 
    if (payment.order_id !== razorpay_order_id) {
      res.status(400);
      throw new Error("Payment does not belong to this Razorpay order.");
    }

    // build order items
    const orderItems = [];

    for (const item of totals.cart.items) {
      const product = await Product.findById(
        item.product._id
      );

      if (!product || !product.isActive) {
        res.status(400);
        throw new Error(`${item.product.name} is no longer available.`);
      }

      if (product.stock < item.quantity) {
        res.status(400);
        throw new Error(`Only ${product.stock} units of ${product.name} are available.`);
      }

      const currentPrice =
        product.discountPrice ?? product.price;

      orderItems.push({
        product: product._id,
        name: product.name,
        
        image:
          typeof product.images?.[0] === "string"
            ? product.images[0]
            : product.images?.[0]?.url || "",
        
        price: currentPrice,
        quantity: item.quantity,
      });
    }

    // create order
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

      paymentMethod: "razorpay",

      paymentStatus: "paid",

      orderStatus: "confirmed",

      subtotal: totals.subtotal,

      shippingFee: totals.shippingFee,

      discount: totals.discount,

      tax: totals.tax,

      totalAmount: totals.totalAmount,

      couponCode: totals.appliedCouponCode,

      paymentDetails: {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },

      statusHistory: [
        {
          status: "confirmed",
          note: "Online payment successful and order confirmed",
        },
      ],
    });

    // Reduce stock
    for (const item of totals.cart.items) {
      await decreaseProductStock({
        productId: item.product._id,
        quantity: item.quantity,
        userId: req.user._id,
        reason: `Razor order #${order._id}`
      });
    }

    // Increment coupon usage
    if (totals.appliedCouponCode) {
      const coupon = await Coupon.findOneAndUpdate(
        {
          code: totals.appliedCouponCode,
          isActive: true,
          $or: [
            { usageLimit: null },
            { $expr: { $lt: ["$usedCount", "$usageLimit"] } },
          ],
        },
        {
          $inc: { usedCount: 1 },
        },
        {
          new: true,
        }
      );

      if (!coupon) {
        res.status(400);
        throw new Error(
          "This coupon is no longer available. Please try again."
        );
      }
    }
    
    // Clear cart
    totals.cart.items = [];
    totals.cart.subtotal = 0;
    totals.cart.discount = 0;
    totals.cart.total = 0;

    await totals.cart.save();

    const populatedOrder =
      await Order.findById(order._id).populate(
        "user",
        "name email"
      );

    await createNotification({
      user: req.user._id,
      type: "order_confirmed",
      title: "Payment Successful 🎉",
      message: `Your payment was successful and order #${order._id} has been confirmed.`,
      order: order._id,
    });

    await sendOrderConfirmationEmail(order);
    await sendPaymentSuccessEmail(order);

    res.status(200).json({
      success: true,
      message:
        "Payment verified and order created successfully.",
      data: getSafeCustomerOrder(populatedOrder),
    });
    
  }
);

export {
  createRazorpayOrder,
  verifyRazorpayPayment,
};