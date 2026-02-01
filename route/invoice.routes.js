import express from "express";
import auth from "../middleware/auth.middleware.js";
import {
  getInvoices,
  getInvoiceSummary,
  updateInvoiceStatus,
  deleteInvoice,
} from "../controllers/invoice.controller.js";

const router = express.Router();

router.get("/", auth, getInvoices);
router.get("/summary", auth, getInvoiceSummary);
router.patch("/:id/status", auth, updateInvoiceStatus);
router.delete("/:id", auth, deleteInvoice);

export default router;
