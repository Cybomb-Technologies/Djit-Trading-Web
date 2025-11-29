const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },

  // OrderId required only for paid enrollments
  orderId: { 
    type: String, 
    required: function() {
      return this.amountPaid > 0;  // Only required when payment > 0
    },
    unique: false
  },

  enrollmentDate: {
    type: Date,
    default: Date.now
  },

  progress: {
    type: Number,
    default: 0
  },

  completed: {
    type: Boolean,
    default: false
  },

  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },

  amountPaid: {
    type: Number,
    default: 0
  },

  // Save the coupon ID
  couponUsed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    default: null
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('Enrollment', enrollmentSchema);
