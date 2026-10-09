import Notification from "../models/Notification.js";

const createNotification = async ({
  user,
  type,
  title,
  message,
  order = null,
}) => {
  try {
    const notification = await Notification.create({
      user,
      type,
      title,
      message,
      order,
    });

    return notification;
  } catch (error) {
    console.error("Notification creation failed:", error.message);

    // Notification failure should not break the main order/payment operation.
    return null;
  }
};

export default createNotification;