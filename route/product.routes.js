import express from "express";
import auth from "../middleware/auth.middleware.js";
import {
  addProduct,
  getProducts,
  buyProduct,
  checkProductId,
} from "../controllers/product.controller.js";
import { uploadCSV } from "../controllers/product.csv.controller.js";

const router = express.Router();

router.post("/", auth, addProduct);
router.get("/", auth, getProducts);
router.get("/check-product-id", auth, checkProductId); // ✅ FIX
router.post("/buy", auth, buyProduct);

router.post("/upload-csv", auth, uploadCSV);

export default router;
