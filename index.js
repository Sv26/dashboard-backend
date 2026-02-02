import express from "express";
import "./config/env.js";
import connectDB from "./config/db.js";
import authRoutes from "./route/auth.routes.js";
import productRoutes from "./route/product.routes.js";
import dashboardRoutes from "./route/dashboard.routes.js";
import statisticsRoutes from "./route/statistics.routes.js";
import invoiceRoutes from "./route/invoice.routes.js";

import cors from "cors";
import cron from "node-cron";
import runStockCheck from "./utils/stockCheck.js";

const app = express();
const port = process.env.PORT || 3000;

// Cron job
cron.schedule("*/5 * * * *", runStockCheck);

connectDB();

const allowedOrigins = [
  "http://localhost:3000",
  "https://clinquant-biscotti-6d0817.netlify.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/invoice", invoiceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/statistics", statisticsRoutes);

app.get("/", (req, res) => {
  res.send("API running");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
