import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized. Please log in.");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      res.status(401);
      throw new Error("Invalid authentication token.");
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      res.status(401);
      throw new Error("User account no longer exists.");
    }

    if (!user.isActive) {
      res.status(403);
      throw new Error("Your account has been deactivated.");
    }

    req.user = user;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      res.status(401);
      throw new Error("Your session has expired. Please log in again.");
    }

    if (error.name === "JsonWebTokenError") {
      res.status(401);
      throw new Error("Invalid authentication token.");
    }

    throw error;
  }
});
