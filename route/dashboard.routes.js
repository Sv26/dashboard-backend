import express from "express";
import auth from "../middleware/auth.middleware.js";
import { homeDashboard } from "../controllers/dashboard.controller.js";

const router = express.Router();

/**
 * @route GET /api/dashboard/home
 * @desc Home dashboard data
 */
router.get("/home", auth, homeDashboard);

export default router;
