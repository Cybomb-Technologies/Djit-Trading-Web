// routes/enrollmentRoutes.js
const express = require('express');
const { 
  createEnrollment, 
  getUserEnrollments, 
  updateProgress,
  getAllEnrollments,
  updateEnrollmentStatus,
  getEnrollmentStats
} = require('../controllers/enrollmentController');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// User routes
router.post('/', auth, createEnrollment);
router.get('/user/:userId', auth, getUserEnrollments);
router.put('/:id/progress', auth, updateProgress);

// Admin routes
router.get('/admin/enrollments', auth, adminAuth, getAllEnrollments);
router.put('/admin/enrollments/:id', auth, adminAuth, updateEnrollmentStatus);
router.get('/admin/enrollments/stats', auth, adminAuth, getEnrollmentStats);

module.exports = router;