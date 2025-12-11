const mongoose = require('mongoose');
const Review = require('../models/Review');

// ============= PUBLIC ROUTES =============

// Get all reviews (public - NO AUTH REQUIRED)
exports.getAllReviews = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      courseName,
      rating,
      sortBy = '-createdAt'
    } = req.query;

    console.log('📥 Public getAllReviews called with:', { page, limit, courseName, rating, sortBy });

    const query = {};

    // Filter by course name
    if (courseName && courseName !== 'all') {
      query.courseName = new RegExp(courseName, 'i');
    }

    // Filter by rating
    if (rating && rating !== 'all') {
      query.rating = parseInt(rating);
    }

    // Only show approved AND NOT hidden reviews for public access
    query.status = 'approved';
    query.hidden = false;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Review.countDocuments(query);

    console.log('✅ Found', reviews.length, 'reviews');

    res.status(200).json({
      success: true,
      data: reviews,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page)
    });

  } catch (error) {
    console.error('❌ Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

// Get reviews by course name (public - NO AUTH REQUIRED)
exports.getReviewsByCourse = async (req, res) => {
  try {
    const { courseName } = req.params;
    
    console.log('📥 Public getReviewsByCourse called for:', courseName);

    const reviews = await Review.find({ 
      courseName: new RegExp(courseName, 'i'),
      status: 'approved',
      hidden: false
    })
      .sort({ createdAt: -1 });

    console.log('✅ Found', reviews.length, 'reviews for course:', courseName);

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });

  } catch (error) {
    console.error('❌ Error fetching course reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course reviews',
      error: error.message
    });
  }
};

// ============= USER ROUTES (Optional Auth) =============

// Create a new review (Public - NO AUTH REQUIRED)
exports.createReview = async (req, res) => {
  try {
    const { 
      reviewerName, 
      rating, 
      reviewText, 
      title, 
      courseName, 
      anonymous,
      userEmail = 'guest@example.com',
      userId = 'guest'
    } = req.body;

    console.log('📝 Creating review from:', reviewerName);

    // Validation
    if (!reviewerName || !rating || !reviewText) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    if (reviewText.length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Review must be at least 20 characters'
      });
    }

    // Create review (auto-approved)
    const review = await Review.create({
      reviewerName: anonymous ? 'Anonymous' : reviewerName,
      userId: userId || 'guest',
      userEmail: userEmail || 'guest@example.com',
      rating: parseInt(rating),
      reviewText,
      title: title || '',
      courseName: courseName.trim() || 'General Platform Review',
      anonymous: anonymous || false,
      status: 'approved',
      hidden: false
    });

    console.log('✅ Review created successfully:', review._id);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });

  } catch (error) {
    console.error('❌ Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting review',
      error: error.message
    });
  }
};

// Get single review details (public - NO AUTH REQUIRED)
exports.getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📥 Getting review by ID:', id);
    
    const review = await Review.findById(id).lean();

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Hide user info if review is anonymous
    if (review.anonymous) {
      review.userEmail = 'anonymous@example.com';
    }

    console.log('✅ Found review:', review._id);

    res.status(200).json({
      success: true,
      data: review
    });

  } catch (error) {
    console.error('❌ Error fetching review:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching review',
      error: error.message
    });
  }
};

// ============= ADMIN ROUTES (Without Auth - for testing) =============

// Get all reviews for admin (NO AUTH REQUIRED - for testing)
exports.adminGetAllReviews = async (req, res) => {
  try {
    console.log('👑 Admin getAllReviews called (no auth)');
    
    const { 
      page = 1, 
      limit = 20, 
      sortBy = '-createdAt',
      courseName,
      rating,
      status,
      search,
      showHidden = false
    } = req.query;

    console.log('📋 Query params:', { 
      page, limit, sortBy, courseName, rating, status, search, showHidden 
    });

    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { reviewerName: new RegExp(search, 'i') },
        { reviewText: new RegExp(search, 'i') },
        { courseName: new RegExp(search, 'i') },
        { userEmail: new RegExp(search, 'i') }
      ];
    }

    // Course filter
    if (courseName && courseName !== 'all') {
      query.courseName = courseName;
    }

    // Rating filter
    if (rating && rating !== 'all') {
      query.rating = parseInt(rating);
    }

    // Status filter
    if (status && status !== 'all') {
      if (status === 'hidden') {
        query.hidden = true;
      } else {
        query.status = status;
        query.hidden = false;
      }
    }

    // Show hidden filter
    if (showHidden === 'true') {
      query.hidden = true;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Review.countDocuments(query);

    console.log('✅ Found', reviews.length, 'reviews (total:', total, ')');

    res.status(200).json({
      success: true,
      data: reviews,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page)
    });

  } catch (error) {
    console.error('❌ Error fetching admin reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

// Update review status (NO AUTH REQUIRED - for testing)
exports.adminUpdateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log('👑 Updating review status:', { id, status });

    if (!status || !['pending', 'approved', 'rejected', 'hidden'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (pending, approved, rejected, hidden)'
      });
    }

    const updateData = { status };
    
    // If status is hidden, set hidden to true
    if (status === 'hidden') {
      updateData.hidden = true;
    } else {
      updateData.hidden = false;
    }

    const review = await Review.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    console.log('✅ Review updated:', review._id);

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });

  } catch (error) {
    console.error('❌ Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review',
      error: error.message
    });
  }
};

// Hide a review (NO AUTH REQUIRED - for testing)
exports.adminHideReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { hideReason } = req.body;

    console.log('👑 Hiding review:', { id, hideReason });

    const review = await Review.findByIdAndUpdate(
      id,
      { 
        hidden: true,
        status: 'hidden',
        hideReason: hideReason || 'Inappropriate content'
      },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    console.log('✅ Review hidden:', review._id);

    res.status(200).json({
      success: true,
      message: 'Review hidden successfully',
      data: review
    });

  } catch (error) {
    console.error('❌ Error hiding review:', error);
    res.status(500).json({
      success: false,
      message: 'Error hiding review',
      error: error.message
    });
  }
};

// Unhide a review (NO AUTH REQUIRED - for testing)
exports.adminUnhideReview = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('👑 Unhiding review:', id);

    const review = await Review.findByIdAndUpdate(
      id,
      { 
        hidden: false,
        status: 'approved',
        $unset: { hideReason: 1 }
      },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    console.log('✅ Review unhidden:', review._id);

    res.status(200).json({
      success: true,
      message: 'Review unhidden successfully',
      data: review
    });

  } catch (error) {
    console.error('❌ Error unhiding review:', error);
    res.status(500).json({
      success: false,
      message: 'Error unhiding review',
      error: error.message
    });
  }
};

// Delete review (NO AUTH REQUIRED - for testing)
exports.adminDeleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('👑 Deleting review:', id);

    const review = await Review.findByIdAndDelete(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    console.log('✅ Review deleted:', id);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
};

// Get review statistics (NO AUTH REQUIRED - for testing)
exports.getReviewStats = async (req, res) => {
  try {
    console.log('📊 Getting review statistics (no auth)');

    const totalReviews = await Review.countDocuments();
    
    const averageRating = await Review.aggregate([
      {
        $match: { hidden: false }
      },
      {
        $group: {
          _id: null,
          average: { $avg: '$rating' }
        }
      }
    ]);

    const byCourse = await Review.aggregate([
      {
        $match: { hidden: false }
      },
      {
        $group: {
          _id: '$courseName',
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const byRating = await Review.aggregate([
      {
        $match: { hidden: false }
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    const recentReviews = await Review.find({ hidden: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const hiddenCount = await Review.countDocuments({ hidden: true });

    console.log('✅ Stats calculated:', { 
      totalReviews, 
      averageRating: averageRating[0]?.average,
      hiddenCount 
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalReviews,
        averageRating: averageRating[0]?.average ? parseFloat(averageRating[0].average.toFixed(1)) : 0,
        hiddenCount,
        byCourse,
        byRating,
        recentReviews
      }
    });

  } catch (error) {
    console.error('❌ Error fetching review stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching review statistics',
      error: error.message
    });
  }
};