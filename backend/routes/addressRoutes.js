import express from "express";

import {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/addressController.js";

import  { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getAddresses);

router.get("/:id", protect, getAddressById);

router.post("/", protect, createAddress);

router.put("/:id", protect, updateAddress);

router.patch("/:id/default", protect, setDefaultAddress);

router.delete("/:id", protect, deleteAddress);

export default router;