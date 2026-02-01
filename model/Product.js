import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
    },

    productId: {
      type: String,
      required: true,
      index: true,
    },

    category: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
    },

    unit: {
      type: String,
      required: true,
    },

    expiryDate: Date,

    threshold: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"],
      default: "IN_STOCK",
    },
  },
  { timestamps: true },
);

/* ✅ UNIQUE PER USER */
productSchema.index({ userId: 1, productId: 1 }, { unique: true });

export default mongoose.model("Product", productSchema);
