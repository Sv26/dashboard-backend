import Product from "../model/Product.js";
import Transaction from "../model/Transaction.js";
import Invoice from "../model/Invoice.js";
import runStockCheck from "../utils/stockCheck.js";

/* =========================
   ADD PRODUCT
========================= */
export const addProduct = async (req, res) => {
  try {
    const { name, productId, price, quantity, threshold } = req.body;

    if (!name || !productId || price <= 0 || quantity <= 0 || threshold < 0) {
      return res.status(400).json({ message: "Invalid product data" });
    }

    const exists = await Product.findOne({
      userId: req.user._id,
      productId,
    });

    if (exists) {
      return res.status(400).json({ message: "Product ID already exists" });
    }

    const product = await Product.create({
      ...req.body,
      userId: req.user._id,
    });

    await Transaction.create({
      productId: product._id,
      quantity: product.quantity,
      totalAmount: product.price * product.quantity,
      type: "PURCHASE",
      userId: req.user._id,
    });

    await runStockCheck(req.user._id);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* =========================
   CHECK PRODUCT ID
========================= */
export const checkProductId = async (req, res) => {
  const { productId } = req.query;

  if (!productId) return res.json({ exists: false });

  const exists = await Product.exists({
    userId: req.user._id,
    productId,
  });

  res.json({ exists: !!exists });
};

/* =========================
   GET PRODUCTS
========================= */
export const getProducts = async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const search = req.query.search || "";

  const query = {
    userId: req.user._id,
    ...(search && {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { productId: { $regex: search, $options: "i" } },
      ],
    }),
  };

  const products = await Product.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const total = await Product.countDocuments(query);

  res.json({ products, total });
};

/* =========================
   BUY PRODUCT
========================= */
export const buyProduct = async (req, res) => {
  const { productId, quantity } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ message: "Invalid quantity" });
  }

  const product = await Product.findOneAndUpdate(
    {
      _id: productId,
      userId: req.user._id,
      quantity: { $gte: quantity },
    },
    { $inc: { quantity: -quantity } },
    { new: true },
  );

  if (!product) {
    return res.status(400).json({ message: "Insufficient stock" });
  }

  const amount = product.price * quantity;

  await Transaction.create({
    productId: product._id,
    quantity,
    totalAmount: amount,
    type: "SALE",
    userId: req.user._id,
  });

  await Invoice.create({
    invoiceId: `INV-${Date.now()}`,
    referenceNumber: product.productId,
    amount,
    dueDate: new Date(Date.now() + 7 * 86400000),
    userId: req.user._id,
  });

  await runStockCheck(req.user._id);
  res.json({ message: "Purchase successful" });
};
