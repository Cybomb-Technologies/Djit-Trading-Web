const axios = require("axios");
const cashfree = require("../config/cashfree");
require("dotenv").config();

// ✅ Create Cashfree Order
const createOrder = async (req, res) => {
  try {
    const { amount, name, email, phone } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount is missing" });
    }

    const response = await axios.post(
      "https://api.cashfree.com/pg/orders", // ✅ LIVE URL
      {
        order_id: "ORDER_" + Date.now(),
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: "CUST_" + Date.now(),
          customer_name: name || "Guest User",
          customer_email: email || "test@gmail.com",
          customer_phone: phone || "9999999999",
        },
        order_meta: {
          // ✅ Your live site return URL (change this to your deployed domain later)
          return_url: "https://localhost:3000/payment-success?order_id={order_id}",
        },
        order_note: "Website Course Enrollment",
      },
      {
        headers: {
          accept: "application/json",
          "x-api-version": "2022-09-01",
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const { order_id, payment_session_id } = response.data;

    console.log("✅ Order Created:", order_id);
    console.log("🧾 Full Response:", response.data);

    if (!payment_session_id) {
      console.error("❌ payment_session_id missing");
      return res.status(400).json({
        success: false,
        message: "Payment session not created",
        data: response.data,
      });
    }

    // ✅ LIVE Payment URL
   const paymentLink = `https://www.cashfree.com/pg/checkout?payment_session_id=${payment_session_id}`;


    console.log("🔗 Payment Link:", paymentLink);

    res.json({
      success: true,
      paymentLink,
      orderId: order_id,
    });
  } catch (error) {
    console.error("❌ Cashfree order error:", error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
};

// ✅ Verify Cashfree Payment
const verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    const response = await cashfree.get(`/pg/orders/${orderId}`);
    console.log("✅ Payment verified:", response.data);

    res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error("❌ Verify error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error: error.response?.data || error.message,
    });
  }
};

module.exports = { createOrder, verifyPayment };
