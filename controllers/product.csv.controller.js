import Product from "../model/Product.js";
import Transaction from "../model/Transaction.js";
import runStockCheck from "../utils/stockCheck.js";

/* =========================
   NORMALIZE CSV ROW
========================= */
const normalizeRow = (row) => {
  const map = {};
  for (const key in row) {
    map[key.trim().toLowerCase()] = row[key];
  }

  return {
    name: map.name,
    price: map.price,
    quantity: map.quantity,
    category: map.category,
    unit: map.unit,
    threshold: map.threshold,
  };
};

/* =========================
   GENERATE PRODUCT ID (BACKEND)
========================= */
const generateProductId = async (userId) => {
  const count = await Product.countDocuments({ userId });
  return `P-${count + 1}-${Date.now()}`;
};

/* =========================
   UPLOAD CSV
========================= */
export const uploadCSV = async (req, res) => {
  const rows = Array.isArray(req.body.rows) ? req.body.rows : [];

  let success = 0;
  const failed = [];

  for (let i = 0; i < rows.length; i++) {
    try {
      const r = normalizeRow(rows[i]);

      // ❌ productId NOT required anymore
      if (!r.name || Number(r.price) <= 0 || Number(r.quantity) <= 0) {
        throw new Error("Invalid data");
      }

      // ✅ BACKEND GENERATED ID
      const productId = await generateProductId(req.user._id);

      const product = await Product.create({
        name: r.name,
        productId, // ✅ GENERATED HERE
        price: Number(r.price),
        quantity: Number(r.quantity),

        category: r.category || "General",
        unit: r.unit || "pcs",
        threshold: Number(r.threshold ?? 10),

        userId: req.user._id,
      });

      await Transaction.create({
        productId: product._id,
        quantity: product.quantity,
        totalAmount: product.price * product.quantity,
        type: "PURCHASE",
        userId: req.user._id,
      });

      success++;
    } catch (err) {
      failed.push({ row: i + 1, error: err.message });
    }
  }

  if (success > 0) {
    await runStockCheck(req.user._id);
  }

  res.json({ success, failed });
};
