import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    type: {
      type: String,
      enum: ["SALE", "PURCHASE"],
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Transaction", transactionSchema);
