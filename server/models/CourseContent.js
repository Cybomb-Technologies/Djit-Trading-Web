const mongoose = require('mongoose');

const courseContentSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Content title is required'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [1000, 'Description cannot be more than 1000 characters'],
    },
    type: {
      type: String,
      enum: ['video', 'pdf', 'document', 'quiz', 'assignment', 'excel'],
      required: [true, 'Content type is required'],
    },
    videoFile: {
      filename: String,
      originalName: String,
      path: String,
      size: Number,
      mimetype: String,
      url: String,
    },
    documentFile: {
      filename: String,
      originalName: String,
      path: String,
      size: Number,
      mimetype: String,
      url: String,
    },
    videoUrl: { type: String, default: '' },
    documentUrl: { type: String, default: '' },
    duration: { type: String, default: '', maxlength: [50, 'Duration cannot be more than 50 characters'] },
    order: { type: Number, required: true, min: [1, 'Order must be at least 1'] },
    isFree: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

// Index for query performance
courseContentSchema.index({ course: 1, order: 1 });
courseContentSchema.index({ course: 1, status: 1 });

// Pre-save validation - FIXED: Check for path instead of url
courseContentSchema.pre('save', function (next) {
  if (this.type === 'video' && !this.videoUrl && !this.videoFile?.path) {
    return next(new Error('Video content must have either a video URL or video file'));
  }

  if ((this.type === 'document' || this.type === 'pdf' || this.type === 'excel') && !this.documentUrl && !this.documentFile?.path) {
    return next(new Error('Document/Excel content must have either a document URL or document file'));
  }

  next();
});

module.exports = mongoose.model('CourseContent', courseContentSchema);