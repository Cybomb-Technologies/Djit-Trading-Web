const Course = require('../models/Course');
const Coupon = require('../models/Coupon.js');
const CourseContent = require('../models/CourseContent'); 
// =============================
// Get all courses
// =============================
exports.getCourses = async (req, res) => {
  try {
    const { category, level, featured } = req.query;
    let filter = { status: 'active' };

    if (category) filter.category = category;
    if (level) filter.level = level;
    if (featured) filter.featured = featured === 'true';

    const courses = await Course.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching courses',
      error: error.message
    });
  }
};

// =============================
// Get single course
// =============================
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ success: true, course });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching course',
      error: error.message
    });
  }
};

// =============================
// Create course (Admin only)
// =============================
exports.createCourse = async (req, res) => {
  try {
    // Set default values for new fields
    const courseData = {
      ...req.body,
      steps: req.body.steps || [],
      courseContains: req.body.courseContains || [],
      indicators: req.body.indicators || [],
      notes: req.body.notes || [],
      detailedDescription: req.body.detailedDescription || '',
      deliveryTime: req.body.deliveryTime || '48 Working Hours',
      language: req.body.language || 'Tamil',
      disclaimer: req.body.disclaimer || 'This course is offered solely for educational purposes and is intended for beginners who wish to learn about trading indicators. Participation in this course is voluntary. By purchasing, you acknowledge and agree that no refunds will be granted once access is provided. Trading involves inherent risk and may not be suitable for everyone.'
    };

    const course = await Course.create(courseData);
    res.status(201).json({
      success: true,
      course
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error creating course',
      error: error.message
    });
  }
};

// =============================
// Update course (Admin only)
// =============================
exports.updateCourse = async (req, res) => {
  try {
    // Clean up the data - remove empty strings from arrays
    const cleanData = { ...req.body };
    
    // Filter out empty strings from arrays
    if (cleanData.steps) {
      cleanData.steps = cleanData.steps.filter(step => step.trim() !== '');
    }
    if (cleanData.courseContains) {
      cleanData.courseContains = cleanData.courseContains.filter(item => item.trim() !== '');
    }
    if (cleanData.notes) {
      cleanData.notes = cleanData.notes.filter(note => note.trim() !== '');
    }
    if (cleanData.indicators) {
      cleanData.indicators = cleanData.indicators.filter(indicator => 
        indicator.name.trim() !== '' || indicator.description.trim() !== ''
      );
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      cleanData,
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({
      success: true,
      course
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating course',
      error: error.message
    });
  }
};

// =============================
// Update course details specifically (Admin only)
// =============================
exports.updateCourseDetails = async (req, res) => {
  try {
    const {
      steps,
      courseContains,
      indicators,
      notes,
      detailedDescription,
      deliveryTime,
      language,
      disclaimer
    } = req.body;

    // Clean up the data - remove empty strings from arrays
    const cleanData = {};
    
    if (steps) {
      cleanData.steps = steps.filter(step => step.trim() !== '');
    }
    if (courseContains) {
      cleanData.courseContains = courseContains.filter(item => item.trim() !== '');
    }
    if (notes) {
      cleanData.notes = notes.filter(note => note.trim() !== '');
    }
    if (indicators) {
      cleanData.indicators = indicators.filter(indicator => 
        indicator.name.trim() !== '' || indicator.description.trim() !== ''
      );
    }
    if (detailedDescription !== undefined) {
      cleanData.detailedDescription = detailedDescription;
    }
    if (deliveryTime !== undefined) {
      cleanData.deliveryTime = deliveryTime;
    }
    if (language !== undefined) {
      cleanData.language = language;
    }
    if (disclaimer !== undefined) {
      cleanData.disclaimer = disclaimer;
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      cleanData,
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({
      success: true,
      message: 'Course details updated successfully',
      course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating course details',
      error: error.message
    });
  }
};

// =============================
// Delete course (Admin only)
// =============================
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting course',
      error: error.message
    });
  }
};

// =============================
// Purchase Course (with coupon)
// =============================
exports.purchaseCourse = async (req, res) => {
  try {
    const { courseId, couponCode } = req.body;
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    let totalAmount = course.price;
    let discountAmount = 0;

    // If coupon applied
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });

      if (!coupon) {
        return res.status(400).json({ success: false, message: 'Invalid coupon code' });
      }

      if (coupon.courseId && coupon.courseId.toString() !== courseId.toString()) {
        return res.status(400).json({ success: false, message: 'This coupon is not valid for this course' });
      }

      const now = new Date();
      if (now < coupon.validFrom || now > coupon.validUntil) {
        return res.status(400).json({ success: false, message: 'Coupon expired or not valid' });
      }

      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
      }

      if (coupon.minPurchase && totalAmount < coupon.minPurchase) {
        return res.status(400).json({ success: false, message: `Minimum purchase of ₹${coupon.minPurchase} required` });
      }

      if (coupon.discountType === 'percentage') {
        discountAmount = (totalAmount * coupon.discountValue) / 100;
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
      } else {
        discountAmount = coupon.discountValue;
      }

      totalAmount = totalAmount - discountAmount;

      coupon.usedCount += 1;
      await coupon.save();
    }

    // TODO: Implement saving the order in Order Model (optional)

    res.json({
      success: true,
      message: 'Course purchased successfully',
      course,
      discountAmount,
      finalAmount: totalAmount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error purchasing course',
      error: error.message
    });
  }
};

// =============================
// Get course with full details
// =============================
// =============================
// Get course with full details including content
// =============================
exports.getCourseWithDetails = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get course content from CourseContent collection
    const courseContents = await CourseContent.find(
      { 
        course: req.params.id, 
        status: 'active' 
      },
      'title type duration order isFree' // Only return these fields
    ).sort({ order: 1 });

    // Transform course contents to get only video information if needed
    const videos = courseContents
      .filter(content => content.type === 'video')
      .map(video => ({
        title: video.title,
        type: video.type,
        duration: video.duration,
        order: video.order,
        isFree: video.isFree
      }));

    // Return course with all details including content
    res.json({
      success: true,
      course: {
        ...course.toObject(),
        // Ensure arrays are always returned (even if empty)
        steps: course.steps || [],
        courseContains: course.courseContains || [],
        indicators: course.indicators || [],
        notes: course.notes || [],
        detailedDescription: course.detailedDescription || '',
        deliveryTime: course.deliveryTime || '48 Working Hours',
        language: course.language || 'Tamil',
        disclaimer: course.disclaimer || 'This course is offered solely for educational purposes and is intended for beginners who wish to learn about trading indicators. Participation in this course is voluntary. By purchasing, you acknowledge and agree that no refunds will be granted once access is provided. Trading involves inherent risk and may not be suitable for everyone.',
        // Add course contents
        courseContents: courseContents,
        // If you only want videos specifically:
        videos: videos
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching course details',
      error: error.message
    });
  }
};
// =============================
// Add specific course content item
// =============================
exports.addCourseContent = async (req, res) => {
  try {
    const { type, content } = req.body; // type: 'step', 'courseContains', 'indicator', 'note'
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    let updateField = {};
    
    switch (type) {
      case 'step':
        updateField = { $push: { steps: content } };
        break;
      case 'courseContains':
        updateField = { $push: { courseContains: content } };
        break;
      case 'note':
        updateField = { $push: { notes: content } };
        break;
      case 'indicator':
        updateField = { $push: { indicators: content } };
        break;
      default:
        return res.status(400).json({ message: 'Invalid content type' });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      updateField,
      { new: true }
    );

    res.json({
      success: true,
      message: 'Content added successfully',
      course: updatedCourse
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error adding course content',
      error: error.message
    });
  }
};

// =============================
// Remove specific course content item
// =============================
exports.removeCourseContent = async (req, res) => {
  try {
    const { type, index } = req.body; // type: 'step', 'courseContains', 'indicator', 'note'
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    let updateField = {};
    
    switch (type) {
      case 'step':
        updateField = { $pull: { steps: course.steps[index] } };
        break;
      case 'courseContains':
        updateField = { $pull: { courseContains: course.courseContains[index] } };
        break;
      case 'note':
        updateField = { $pull: { notes: course.notes[index] } };
        break;
      case 'indicator':
        updateField = { $pull: { indicators: course.indicators[index] } };
        break;
      default:
        return res.status(400).json({ message: 'Invalid content type' });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      updateField,
      { new: true }
    );

    res.json({
      success: true,
      message: 'Content removed successfully',
      course: updatedCourse
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error removing course content',
      error: error.message
    });
  }
};