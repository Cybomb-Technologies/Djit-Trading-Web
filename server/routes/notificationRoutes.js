const express = require('express');
const { 
  getNotifications, 
  markAsRead, 
  markAllAsRead 
} = require('../controllers/notificationController');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// All routes are protected with admin auth
router.get('/', adminAuth, getNotifications);
router.put('/:id/read', adminAuth, markAsRead);
router.put('/read-all', adminAuth, markAllAsRead);

module.exports = router;