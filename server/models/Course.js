const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  instructor: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  discountedPrice: Number,
  category: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  thumbnail: String,
  duration: String,
  lessons: Number,
  studentsEnrolled: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0
  },
  reviews: Number,
  featured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  // New fields for detailed course information
  detailedDescription: {
    type: String,
    default: ''
  },
  steps: [{
    type: String
  }],
  courseContains: [{
    type: String
  }],
  indicators: [{
    name: String,
    description: String
  }],
  notes: [{
    type: String
  }],
  disclaimer: {
    type: String,
    default: 'This course is offered solely for educational purposes and is intended for beginners who wish to learn about trading indicators. Participation in this course is voluntary. By purchasing, you acknowledge and agree that no refunds will be granted once access is provided. Trading involves inherent risk and may not be suitable for everyone.'
  },
  deliveryTime: {
    type: String,
    default: '48 Working Hours'
  },
  language: {
    type: String,
    default: 'Tamil'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);