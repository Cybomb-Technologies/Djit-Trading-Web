const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  orderId: String,
  amount: Number,
  status: String,
  customerEmail: String,
  customerPhone: String
});

module.exports = mongoose.model("Payment", paymentSchema);
