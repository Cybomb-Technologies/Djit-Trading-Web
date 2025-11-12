// routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const { createOrder, verifyPayment } = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

// ✅ Protect payment routes
router.post("/create", protect, createOrder);
router.post("/verify", protect, verifyPayment);


module.exports = router;