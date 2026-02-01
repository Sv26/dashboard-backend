import Transaction from "../model/Transaction.js";
import Product from "../model/Product.js";

export const statistics = async (req, res) => {
  const userId = req.user._id;

  const revenueAgg = await Transaction.aggregate([
    { $match: { type: "SALE", userId } },
    { $group: { _id: null, revenue: { $sum: "$totalAmount" } } },
  ]);

  const soldAgg = await Transaction.aggregate([
    { $match: { type: "SALE", userId } },
    { $group: { _id: null, sold: { $sum: "$quantity" } } },
  ]);

  const inStock = await Product.countDocuments({
    status: "IN_STOCK",
    userId,
  });

  res.json({
    cards: {
      totalRevenue: revenueAgg[0]?.revenue || 0,
      productsSold: soldAgg[0]?.sold || 0,
      productsInStock: inStock,
    },
  });
};
