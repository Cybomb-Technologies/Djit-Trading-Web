// routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const { 
  createOrder, 
  verifyPayment, 
  createMobileOrder, 
  verifyMobilePayment, 
  mobileWebhook 
} = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

// ✅ Web Payment Routes
router.post("/create", protect, createOrder);
router.post("/verify", protect, verifyPayment);

// ✅ Mobile Payment Routes
router.post("/create-mobile", protect, createMobileOrder);
router.post("/verify-mobile", protect, verifyMobilePayment);
router.post("/mobile-webhook", mobileWebhook); // No auth for webhooks

module.exports = router;