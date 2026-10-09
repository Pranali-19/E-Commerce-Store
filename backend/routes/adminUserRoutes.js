import express from "express";

import {
  getAdminUsers,
  getAdminUserById,
  toggleUserStatus,
  updateUserRole,
} from "../controllers/adminUserController.js";

import {protect} from "../middleware/authMiddleware.js";
import {admin} from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/", protect, admin, getAdminUsers);

router.get("/:id", protect, admin, getAdminUserById);

router.patch("/:id/status", protect, admin, toggleUserStatus);

router.patch("/:id/role", protect, admin, updateUserRole);

export default router;