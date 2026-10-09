import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Notification from "../models/Notification.js";

const getSafeNotification = (notification) => ({
  id: notification._id,
  type: notification.type,
  title: notification.title,
  message: notification.message,
  isRead: notification.isRead,
  order: notification.order
    ? {
        id: notification.order._id,
        orderStatus: notification.order.orderStatus,
        paymentStatus: notification.order.paymentStatus,
        totalAmount: notification.order.totalAmount,
      }
    : null,
  createdAt: notification.createdAt,
  updatedAt: notification.updatedAt,
});

// GET /api/notifications
export const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    user: req.user._id,
  })
    .populate("order", "_id orderStatus paymentStatus totalAmount")
    .sort({ createdAt: -1 })
    .limit(50);

  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    isRead: false,
  });

  res.status(200).json({
    success: true,
    data: {
      notifications : notifications.map(getSafeNotification),
      unreadCount,
    },
  });
});

// PATCH /api/notifications/:id/read
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid notification ID.");
  }

  const notification = await Notification.findOne({
    _id: id,
    user: req.user._id,
  });

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found.");
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({
    success: true,
    message: "Notification marked as read.",
    data: getSafeNotification(notification),
  });
});

// PATCH /api/notifications/read-all
export const markAllNotificationsAsRead = asyncHandler(
  async (req, res) => {
    await Notification.updateMany(
      {
        user: req.user._id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  }
);

// DELETE /api/notifications/:id
export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid notification ID.");
  }

  const notification = await Notification.findOneAndDelete({
    _id: id,
    user: req.user._id,
  });

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found.");
  }

  res.status(200).json({
    success: true,
    message: "Notification deleted.",
  });
});

// DELETE /api/notifications
export const clearNotifications = asyncHandler(async (req, res) => {
  await Notification.deleteMany({
    user: req.user._id,
  });

  res.status(200).json({
    success: true,
    message: "All notifications cleared.",
  });
});