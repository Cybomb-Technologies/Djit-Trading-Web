const express = require('express');
const { 
  getDashboardStats, 
  getEnrollmentReports, 
  getRevenueReports, 
  getUserActivityReports,
  exportReports 
} = require('../controllers/reportController');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', auth, adminAuth, getDashboardStats);
router.get('/enrollments', auth, adminAuth, getEnrollmentReports);
router.get('/revenue', auth, adminAuth, getRevenueReports);
router.get('/users', auth, adminAuth, getUserActivityReports);
router.get('/export', auth, adminAuth, exportReports);

module.exports = router;