import express from "express";

import {
  getPublicStoreSettings,
} from "../controllers/storeSettingsController.js";

const router = express.Router();

router.get("/", getPublicStoreSettings);

export default router;