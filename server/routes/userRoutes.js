const express = require('express');
const { 
  getUsers, 
  updateProfile, 
  getUserById, 
  getCurrentUser,
  uploadProfilePicture,
  importUsers,
  getUserDetails,
  updateUserRole,
  deleteUser
} = require('../controllers/userController');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Public routes (if any)

// Protected routes
router.post('/upload-profile-picture', auth, uploadProfilePicture);
router.get('/me', auth, getCurrentUser);
router.put('/profile', auth, updateProfile);
router.get('/:id', auth, getUserById);

// Admin only routes
router.get('/', auth, adminAuth, getUsers);
router.post('/import', auth, adminAuth, importUsers);
router.get('/:id/details', auth, adminAuth, getUserDetails);
router.put('/:id/role', auth, adminAuth, updateUserRole);
router.delete('/:id', auth, adminAuth, deleteUser);

module.exports = router;