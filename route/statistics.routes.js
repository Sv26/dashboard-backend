import express from "express";
import auth from "../middleware/auth.middleware.js";
import { statistics } from "../controllers/statistics.controller.js";

const router = express.Router();

/**
 * @route GET /api/statistics
 */
router.get("/", auth, statistics);

export default router;
