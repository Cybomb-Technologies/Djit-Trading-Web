const mongoose = require('mongoose');

const courseDetailsSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    unique: true
  },
  objectives: [{
    type: String,
    required: true
  }],
  targetAudience: {
    type: String,
    required: true
  },
  prerequisites: [{
    type: String
  }],
  courseStructure: {
    type: String,
    required: true
  },
  additionalInfo: {
    type: String
  },
  whatYouGet: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CourseDetails', courseDetailsSchema);