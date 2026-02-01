import Product from "../model/Product.js";
import Transaction from "../model/Transaction.js";

export const homeDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const range = req.query.range || "month";

    let dateFormat;
    if (range === "day") dateFormat = "%Y-%m-%d";
    else if (range === "week") dateFormat = "%Y-%U";
    else dateFormat = "%Y-%m";

    /* ======================
       SALES + PURCHASE + GRAPH
    ====================== */
    const transactionAgg = await Transaction.aggregate([
      { $match: { userId } },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: "$type",
                totalValue: { $sum: "$totalAmount" },
                count: { $sum: 1 },
              },
            },
          ],

          graph: [
            {
              $group: {
                _id: {
                  period: {
                    $dateToString: {
                      format: dateFormat,
                      date: "$createdAt",
                    },
                  },
                  type: "$type",
                },
                total: { $sum: "$totalAmount" },
              },
            },
            {
              $group: {
                _id: "$_id.period",
                sales: {
                  $sum: {
                    $cond: [{ $eq: ["$_id.type", "SALE"] }, "$total", 0],
                  },
                },
                purchase: {
                  $sum: {
                    $cond: [{ $eq: ["$_id.type", "PURCHASE"] }, "$total", 0],
                  },
                },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    const summary = transactionAgg[0]?.summary || [];
    const graph = transactionAgg[0]?.graph || [];

    const salesSummary = summary.find((s) => s._id === "SALE") || {};
    const purchaseSummary = summary.find((s) => s._id === "PURCHASE") || {};

    /* ======================
       INVENTORY SUMMARY
    ====================== */
    const inventoryAgg = await Product.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          inStock: {
            $sum: { $cond: [{ $eq: ["$status", "IN_STOCK"] }, 1, 0] },
          },
          lowStock: {
            $sum: { $cond: [{ $eq: ["$status", "LOW_STOCK"] }, 1, 0] },
          },
          categories: { $addToSet: "$category" },
        },
      },
    ]);

    const inventory = inventoryAgg[0] || {
      totalProducts: 0,
      inStock: 0,
      lowStock: 0,
      categories: [],
    };

    /* ======================
       TOP SELLING (LAST 7 DAYS)
    ====================== */
    const topSellingAgg = await Transaction.aggregate([
      {
        $match: {
          type: "SALE",
          userId,
          createdAt: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
        },
      },
      {
        $group: {
          _id: "$productId",
          soldQty: { $sum: "$quantity" },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { soldQty: -1 } },
      { $limit: 6 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
    ]);

    const topSelling = topSellingAgg.map((item) => ({
      name: item.product?.name || "—",
      count: item.soldQty || 0,
      revenue: item.revenue || 0,
    }));

    /* ======================
       RESPONSE
    ====================== */
    res.json({
      sales: {
        totalValue: salesSummary.totalValue || 0,
        count: salesSummary.count || 0,
      },

      purchase: {
        totalValue: purchaseSummary.totalValue || 0,
        count: purchaseSummary.count || 0,
      },

      inventory: {
        totalProducts: inventory.totalProducts,
        inStock: inventory.inStock,
        lowStock: inventory.lowStock,
      },

      products: {
        totalProducts: inventory.totalProducts,
        categories: inventory.categories.length,
      },

      topSelling, // ✅ THIS IS THE KEY LINE

      graph,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Dashboard fetch failed" });
  }
};
