const express = require('express');
const router = express.Router();
const { createCoupon, getAllCoupons, validateCoupon, applyCoupon } = require('../controllers/couponController');

// Create coupon
router.post('/create', createCoupon);

// Get all coupons
router.get('/', getAllCoupons);

// Validate coupon
router.post('/validate', validateCoupon);

// ✅ Apply coupon
router.post('/apply', applyCoupon);

module.exports = router;