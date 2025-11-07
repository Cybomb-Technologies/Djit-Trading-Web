const Video = require('../models/Video');
const Course = require('../models/Course');

// Get all videos for a course
exports.getCourseVideos = async (req, res) => {
  try {
    const videos = await Video.find({ 
      course: req.params.courseId,
      status: 'active'
    }).sort({ order: 1 });

    res.json({
      success: true,
      videos
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching videos',
      error: error.message
    });
  }
};

// Create video (admin only)
exports.createVideo = async (req, res) => {
  try {
    const video = await Video.create(req.body);
    
    res.status(201).json({
      success: true,
      video
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error creating video',
      error: error.message
    });
  }
};

// Update video (admin only)
exports.updateVideo = async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!video) {
      return res.status(404).json({
        message: 'Video not found'
      });
    }

    res.json({
      success: true,
      video
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating video',
      error: error.message
    });
  }
};

// Delete video (admin only)
exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findByIdAndDelete(req.params.id);

    if (!video) {
      return res.status(404).json({
        message: 'Video not found'
      });
    }

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting video',
      error: error.message
    });
  }
};