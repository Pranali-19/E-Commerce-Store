import sendEmail from "./sendEmail.js";

import {
  orderConfirmedEmail,
  paymentSuccessEmail,
  orderCancelledEmail,
  orderStatusEmail,
} from "./emailTemplates.js";

const getCustomerName = (order) => {
  return order.user?.name || "Customer";
};

export const sendOrderConfirmationEmail = async (order) => {
  if (!order.user?.email) return;

  const html = orderConfirmedEmail({
    customerName: getCustomerName(order),
    orderId: order._id,
    totalAmount: order.totalAmount,
    paymentMethod:
      order.paymentMethod === "razorpay"
        ? "Online Payment"
        : "Cash on Delivery",
  });

  await sendEmail({
    to: order.user.email,
    subject: `Order Confirmed - #${order._id}`,
    html,
    text: `Your order #${order._id} has been confirmed.`,
  });
};

export const sendPaymentSuccessEmail = async (order) => {
  if (!order.user?.email) return;

  const html = paymentSuccessEmail({
    customerName: getCustomerName(order),
    orderId: order._id,
    totalAmount: order.totalAmount,
  });

  await sendEmail({
    to: order.user.email,
    subject: `Payment Successful - #${order._id}`,
    html,
    text: `Payment for order #${order._id} was successful.`,
  });
};

export const sendOrderCancelledEmail = async (order) => {
  if (!order.user?.email) return;

  const html = orderCancelledEmail({
    customerName: getCustomerName(order),
    orderId: order._id,
    totalAmount: order.totalAmount,
  });

  await sendEmail({
    to: order.user.email,
    subject: `Order Cancelled - #${order._id}`,
    html,
    text: `Your order #${order._id} has been cancelled.`,
  });
};

export const sendOrderStatusEmail = async (
  order,
  status,
  message
) => {
  if (!order.user?.email) return;

  const html = orderStatusEmail({
    customerName: getCustomerName(order),
    orderId: order._id,
    status,
    message,
  });

  await sendEmail({
    to: order.user.email,
    subject: `Order Update - #${order._id}`,
    html,
    text: message,
  });
};