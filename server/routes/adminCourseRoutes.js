
const express = require('express');
const { adminAuth } = require('../middleware/auth'); // FIXED: Changed from adminAuth to { adminAuth }
const Course = require('../models/Course');
const Notification = require('../models/Notification'); // <-- Include Notification model
const router = express.Router();

// All routes are protected with adminAuth
router.use(adminAuth);

// Get all courses (admin version)
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
});

// Create course (admin version) WITH Notification
router.post('/', async (req, res) => {
  try {
    const courseData = {
      ...req.body,
      createdBy: req.admin._id
    };

    const course = await Course.create(courseData);
    console.log('✅ Course created:', course._id);

    // 🔔 Create notification for admin
    let notification;
    try {
      notification = await Notification.create({
        title: 'New Course Created',
        message: `A new course "${course.title}" has been created.`,
        type: 'course',           // must match enum in Notification model
        relatedId: course._id,
        isRead: false
      });
      console.log('✅ Notification created:', notification._id);
    } catch (notifError) {
      console.error('❌ Error creating notification:', notifError.message);
    }

    // Optional: emit real-time alert via Socket.IO
    if (global.io) {
      const unreadCount = await Notification.countDocuments({ isRead: false });
      global.io.emit('newNotification', {
        notification: notification || { title: 'N/A', message: 'N/A', type: 'course' },
        unreadCount
      });
      console.log('📡 Socket.IO emitted newNotification event');
    }

    res.status(201).json({ success: true, course });

  } catch (error) {
    console.error('❌ Error creating course:', error.message);
    res.status(500).json({ success: false, message: 'Error creating course', error: error.message });
  }
});


// Update course (admin version)
router.put('/:id', async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    res.json({
      success: true,
      course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating course',
      error: error.message
    });
  }
});

// Delete course (admin version)
router.delete('/:id', async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting course',
      error: error.message
    });
  }
});

// Get single course (admin version)
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    res.json({
      success: true,
      course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching course',
      error: error.message
    });
  }
});

// Add to your adminCourseRoutes.js
router.get('/:id/content', async (req, res) => {
  try {
    const content = await CourseContent.find({ course: req.params.id }).sort({ order: 1 });
    res.json({
      success: true,
      content
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching course content',
      error: error.message
    });
  }
});

router.post('/:id/content', async (req, res) => {
  try {
    const contentData = {
      ...req.body,
      course: req.params.id
    };

    const content = await CourseContent.create(contentData);
    
    res.status(201).json({
      success: true,
      content
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating course content',
      error: error.message
    });
  }
});

router.delete('/:courseId/content/:contentId', async (req, res) => {
  try {
    const content = await CourseContent.findOneAndDelete({
      _id: req.params.contentId,
      course: req.params.courseId
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting content',
      error: error.message
    });
  }
});

module.exports = router;
