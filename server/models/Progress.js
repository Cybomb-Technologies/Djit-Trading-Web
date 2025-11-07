// models/Progress.js
const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourseContent',
      required: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    timeSpent: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed'],
      default: 'completed',
    },
  },
  { timestamps: true }
);

// Ensure a user can only have one progress record per content
progressSchema.index({ user: 1, content: 1 }, { unique: true });
progressSchema.index({ user: 1, course: 1 });
progressSchema.index({ course: 1, content: 1 });

module.exports = mongoose.model('Progress', progressSchema);