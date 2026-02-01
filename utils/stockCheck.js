import mongoose from "mongoose";
import Product from "../model/Product.js";

export default async function runStockCheck(userId) {
  // 🚫 Ignore cron metadata / invalid calls
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return;
  }

  await Product.updateMany(
    { userId, quantity: { $lte: 0 } },
    { status: "OUT_OF_STOCK" },
  );

  await Product.updateMany(
    {
      userId,
      quantity: { $gt: 0 },
      $expr: { $lte: ["$quantity", "$threshold"] },
    },
    { status: "LOW_STOCK" },
  );

  await Product.updateMany(
    {
      userId,
      $expr: { $gt: ["$quantity", "$threshold"] },
    },
    { status: "IN_STOCK" },
  );
}
