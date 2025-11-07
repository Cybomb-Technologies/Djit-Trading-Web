const express = require('express');
const { 
  subscribe, 
  getSubscribers, 
  unsubscribe, 
  sendNewsletter,
  getSubscriberStats 
} = require('../controllers/newsletterController');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/', subscribe);
router.post('/unsubscribe', unsubscribe);

// Admin protected routes
router.get('/', adminAuth, getSubscribers);
router.get('/stats', adminAuth, getSubscriberStats);
router.post('/send', adminAuth, sendNewsletter);

module.exports = router;