const express = require('express');
const router = express.Router();
const { 
  // Public routes (NO AUTH)
  getAllReviews,
  getReviewsByCourse,
  createReview,
  getReviewById,
  
  // Admin routes (NO AUTH - for testing)
  adminGetAllReviews,
  adminUpdateReview,
  adminHideReview,
  adminUnhideReview,
  adminDeleteReview,
  getReviewStats
} = require('../controllers/reviewController');

// NO AUTHENTICATION MIDDLEWARE USED ANYWHERE

// ============= PUBLIC ROUTES (NO AUTH) =============
router.get('/', getAllReviews); // Get all reviews
router.get('/course/:courseName', getReviewsByCourse); // Get reviews by course
router.get('/:id', getReviewById); // Get single review by ID
router.post('/', createReview); // Submit a new review (public)

// ============= ADMIN ROUTES (NO AUTH - for testing) =============
router.get('/admin/all', adminGetAllReviews); // Get all reviews with filters
router.put('/admin/:id/status', adminUpdateReview); // Update review status
router.put('/admin/:id/hide', adminHideReview); // Hide review
router.put('/admin/:id/unhide', adminUnhideReview); // Unhide review
router.delete('/admin/:id', adminDeleteReview); // Delete review
router.get('/admin/stats/summary', getReviewStats); // Get review statistics

module.exports = router;