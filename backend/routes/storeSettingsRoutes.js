import express from "express";

import {
  getStoreSettings,
  updateStoreSettings,
} from "../controllers/storeSettingsController.js";

import {protect} from "../middleware/authMiddleware.js";
import {admin}  from "../middleware/adminMiddleware.js";

const router = express.Router();

// Get settings
router.get("/", protect, admin, getStoreSettings);

// Update settings
router.put("/", protect, admin, updateStoreSettings);

export default router;