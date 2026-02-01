import Invoice from "../model/Invoice.js";

/* =========================
   GET /api/invoice
========================= */
export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   GET /api/invoice/summary
========================= */
export const getInvoiceSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    const totalInvoices = await Invoice.countDocuments({ userId });
    const paidInvoices = await Invoice.countDocuments({
      userId,
      status: "paid",
    });
    const unpaidInvoices = await Invoice.countDocuments({
      userId,
      status: "unpaid",
    });

    const paidAmount = await Invoice.aggregate([
      { $match: { userId, status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const unpaidAmount = await Invoice.aggregate([
      { $match: { userId, status: "unpaid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.json({
      totalInvoices,
      paidInvoices,
      unpaidInvoices,
      paidAmount: paidAmount[0]?.total || 0,
      unpaidAmount: unpaidAmount[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   PATCH /api/invoice/:id/status
========================= */
export const updateInvoiceStatus = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status: req.body.status },
      { new: true },
    );

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   DELETE /api/invoice/:id
========================= */
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json({ message: "Invoice deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
