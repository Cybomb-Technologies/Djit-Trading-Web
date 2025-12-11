const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reviewerName: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  reviewText: {
    type: String,
    required: true,
    minlength: 20,
    maxlength: 500
  },
  title: {
    type: String,
    default: ''
  },
  courseName: {
    type: String,
    default: 'General Platform Review'
  },
  anonymous: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'hidden'],
    default: 'approved'
  },
  hidden: {
    type: Boolean,
    default: false
  },
  hideReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Review', reviewSchema);