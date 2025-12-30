const express = require('express');
const router = express.Router();
const { createCoupon, getAllCoupons, validateCoupon, applyCoupon } = require('../controllers/couponController');

const adminAuth = require('../middleware/adminAuth');

// Create coupon
router.post('/create', adminAuth, createCoupon);

// Get all coupons
router.get('/', adminAuth, getAllCoupons);

// Validate coupon
router.post('/validate', validateCoupon);

// ✅ Apply coupon
router.post('/apply', applyCoupon);

// Update coupon
router.put('/:id', adminAuth, require('../controllers/couponController').updateCoupon);

// Delete coupon
router.delete('/:id', adminAuth, require('../controllers/couponController').deleteCoupon);

module.exports = router;