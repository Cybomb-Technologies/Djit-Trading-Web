// server/controllers/paymentController.js
const axios = require("axios");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
require("dotenv").config();

const CASHFREE_BASE_URL = process.env.CASHFREE_BASE_URL;

// ✅ Create Order (called by frontend)
const createOrder = async (req, res) => {
  try {
    const { amount, name, email, phone, courseId, userId } = req.body;

    if (!name || !email || !phone || !courseId || !userId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const orderPayload = {
      order_id: `ORDER_${Date.now()}`,
      order_amount: amount,
      customer_details: {
        customer_id: userId,        // ✅ added
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
      },
      order_currency: "INR",
      order_note: `Course Enrollment: ${courseId}`,
    };

    const response = await axios.post(CASHFREE_BASE_URL, orderPayload, {
      headers: {
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        "x-api-version": "2022-01-01",
        "Content-Type": "application/json",
      },
    });

    res.json({
      paymentLink: response.data.payment_link,
      orderId: response.data.order_id,
      paymentSessionId: response.data.order_token, // optional for SDK
    });
  } catch (err) {
    console.error("Cashfree Create Order Error:", err.response?.data || err.message);
    res.status(500).json({
      message: err.response?.data?.message || "Failed to create order",
    });
  }
};


// ✅ Verify Payment (called by frontend polling)
const verifyPayment = async (req, res) => {
  try {
    const { orderId, courseId, userId } = req.body;

    if (!orderId || !courseId || !userId) {
      return res.status(400).json({ success: false, message: "Missing required data" });
    }

    // Get order status from Cashfree
    const response = await axios.get(`${CASHFREE_BASE_URL}/${orderId}`, {
      headers: {
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        "x-api-version": "2022-01-01",
      },
    });

    const data = response.data;

    if (data.order_status === "PAID") {
      // Check if already enrolled
      const existing = await Enrollment.findOne({ user: userId, course: courseId });
      if (existing) {
        return res.status(400).json({ success: false, message: "Already enrolled in this course" });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ success: false, message: "Course not found" });
      }

      // Create enrollment
      const enrollment = new Enrollment({
        user: userId,
        course: courseId,
        amountPaid: data.order_amount,
        paymentMethod: "Cashfree",
        paymentStatus: "completed",
        transactionId: orderId,
        enrolledAt: new Date(),
      });

      await enrollment.save();

      return res.status(200).json({
        success: true,
        message: "Payment verified and enrollment successful",
        enrollment: {
          id: enrollment._id,
          course: course.title,
          enrolledAt: enrollment.enrolledAt,
        },
      });
    } else {
      return res.status(200).json({
        success: false,
        message: "Payment not completed yet",
        orderStatus: data.order_status,
      });
    }
  } catch (err) {
    console.error("Cashfree Verify Payment Error:", err.response?.data || err.message);
    res.status(500).json({ success: false, message: "Failed to verify payment" });
  }
};

module.exports = { createOrder, verifyPayment };
