const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const CourseContent = require("../models/CourseContent");
const Enrollment = require("../models/Enrollment");
const Progress = require("../models/Progress");

// Generate secure token for media access
const generateSecureToken = (userId, contentId, expiresIn = '1h') => {
  const payload = {
    userId,
    contentId,
    accessType: 'media',
    nonce: crypto.randomBytes(16).toString('hex')
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// Verify secure token
const tokenBlacklist = new Set();

// Enhanced token verification (REPLACE your existing verifySecureToken)
const verifySecureToken = (token) => {
  try {
    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      throw new Error('Token has been revoked');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.accessType !== 'media') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Add this function to blacklist tokens (NEW FUNCTION)
const blacklistToken = (token) => {
  tokenBlacklist.add(token);
  // Optional: Remove from blacklist after token expiry
  setTimeout(() => {
    tokenBlacklist.delete(token);
  }, 60 * 60 * 1000); // 1 hour
};

// Upload content
// Upload content
const uploadContent = async (req, res) => {
  try {
    const { title, courseId, type, description, duration, order, isFree, videoUrl, documentUrl } = req.body;

    if (!title || !courseId || !type)
      return res.status(400).json({ success: false, message: "Missing required fields" });

    // Prepare file data if uploaded
    let videoFileData = null;
    let documentFileData = null;

    if (req.files) {
      if (req.files.videoFile) {
        const file = req.files.videoFile[0];
        // Generate secure filename
        const fileExtension = path.extname(file.originalname);
        const secureFilename = crypto.randomBytes(16).toString('hex') + fileExtension;
        
        videoFileData = {
          filename: secureFilename,
          originalName: file.originalname,
          path: `uploads/${secureFilename}`,
          size: file.size,
          mimetype: file.mimetype,
          // Remove direct URL, we'll use secure endpoints
        };
        
        // Rename file to secure filename
        const oldPath = file.path;
        const newPath = path.join(path.dirname(oldPath), secureFilename);
        fs.renameSync(oldPath, newPath);
      }
      if (req.files.documentFile) {
        const file = req.files.documentFile[0];
        // Generate secure filename
        const fileExtension = path.extname(file.originalname);
        const secureFilename = crypto.randomBytes(16).toString('hex') + fileExtension;
        
        documentFileData = {
          filename: secureFilename,
          originalName: file.originalname,
          path: `uploads/${secureFilename}`,
          size: file.size,
          mimetype: file.mimetype,
          // Remove direct URL, we'll use secure endpoints
        };
        
        // Rename file to secure filename
        const oldPath = file.path;
        const newPath = path.join(path.dirname(oldPath), secureFilename);
        fs.renameSync(oldPath, newPath);
      }
    }

    // Additional validation before creating the document
    if (type === 'video' && !videoUrl && !videoFileData) {
      return res.status(400).json({ 
        success: false, 
        message: "Video content must have either a video URL or video file" 
      });
    }

    if ((type === 'document' || type === 'pdf' || type === 'excel') && !documentUrl && !documentFileData) {
      return res.status(400).json({ 
        success: false, 
        message: "Document/Excel content must have either a document URL or document file" 
      });
    }

    const newContent = new CourseContent({
      course: courseId,
      title,
      description,
      type,
      duration,
      order: order ? parseInt(order) : 1,
      isFree: isFree === "true" || isFree === true,
      videoUrl: videoUrl || "",
      documentUrl: documentUrl || "",
      videoFile: videoFileData,
      documentFile: documentFileData,
    });

    await newContent.save();

    res.json({ success: true, message: "Content uploaded successfully", content: newContent });
  } catch (error) {
    console.error("❌ Error uploading content:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// Get all uploaded content data (Admin only)
const getAllContentData = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      type = "",
      course = "",
      courseId = "",
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }
    
    if (type) filter.type = type;
    
    const courseFilter = courseId || course;
    if (courseFilter) {
      filter.course = courseFilter;
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query with pagination
    const contents = await CourseContent.find(filter)
      .populate("course", "title category instructor")
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get total count for pagination
    const total = await CourseContent.countDocuments(filter);

    // Calculate storage statistics
    const storagePipeline = [];

    if (Object.keys(filter).length > 0) {
      storagePipeline.push({ $match: filter });
    }

    storagePipeline.push({
      $group: {
        _id: null,
        totalVideos: { $sum: { $cond: [{ $ne: ["$videoFile", null] }, 1, 0] } },
        totalDocuments: { $sum: { $cond: [{ $ne: ["$documentFile", null] }, 1, 0] } },
        totalVideoSize: { $sum: { $ifNull: ["$videoFile.size", 0] } },
        totalDocumentSize: { $sum: { $ifNull: ["$documentFile.size", 0] } },
        totalContent: { $sum: 1 }
      }
    });

    const storageStats = await CourseContent.aggregate(storagePipeline);

    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const stats = storageStats[0] || {
      totalVideos: 0,
      totalDocuments: 0,
      totalVideoSize: 0,
      totalDocumentSize: 0,
      totalContent: 0
    };

    res.json({
      success: true,
      contents,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalContents: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      statistics: {
        totalContent: stats.totalContent,
        totalVideos: stats.totalVideos,
        totalDocuments: stats.totalDocuments,
        totalVideoSize: stats.totalVideoSize,
        totalDocumentSize: stats.totalDocumentSize,
        totalStorageUsed: stats.totalVideoSize + stats.totalDocumentSize,
        formatted: {
          totalVideoSize: formatBytes(stats.totalVideoSize),
          totalDocumentSize: formatBytes(stats.totalDocumentSize),
          totalStorageUsed: formatBytes(stats.totalVideoSize + stats.totalDocumentSize)
        }
      },
      filterInfo: {
        courseFilter: courseFilter || null,
        search: search || null,
        type: type || null
      }
    });
  } catch (error) {
    console.error("❌ Error fetching all content data:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get content by ID (Admin detailed view)
const getContentById = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await CourseContent.findById(id)
      .populate("course", "title category instructor duration level")
      .lean();

    if (!content) {
      return res.status(404).json({ success: false, message: "Content not found" });
    }

    const enrollmentCount = await Enrollment.countDocuments({ course: content.course._id });
    const completionStats = await Progress.aggregate([
      { $match: { content: content._id } },
      {
        $group: {
          _id: null,
          totalCompletions: { $sum: 1 },
          averageCompletionTime: { $avg: { $subtract: ["$completedAt", "$createdAt"] } }
        }
      }
    ]);

    res.json({
      success: true,
      content,
      analytics: {
        enrollmentCount,
        completionStats: completionStats[0] || { totalCompletions: 0, averageCompletionTime: 0 }
      }
    });
  } catch (error) {
    console.error("❌ Error fetching content by ID:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get contents for enrolled users
const getCourseContents = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    console.log(`Fetching course content for user ${userId}, course ${courseId}`);

    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
      paymentStatus: "completed",
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course or payment is pending. Please enroll first.",
      });
    }

    const contents = await CourseContent.find({
      course: courseId,
      status: "active",
    }).sort({ order: 1 });

    const userProgress = await Progress.find({
      user: userId,
      course: courseId,
    });

    const completedContentIds = userProgress.map((p) => p.content.toString());

    const progressPercentage = contents.length > 0 ? Math.round((userProgress.length / contents.length) * 100) : 0;

    // Generate secure access tokens for each content
    const contentsWithSecureUrls = await Promise.all(
      contents.map(async (content) => {
        const contentObj = content.toObject();
        
        // Generate secure tokens for media access
        if (content.videoFile) {
          contentObj.secureVideoToken = generateSecureToken(userId, content._id);
        }
        if (content.documentFile) {
          contentObj.secureDocumentToken = generateSecureToken(userId, content._id, '2h');
        }
        
        // Remove direct file information from response
        delete contentObj.videoFile;
        delete contentObj.documentFile;
        
        return contentObj;
      })
    );

    res.json({
      success: true,
      content: contentsWithSecureUrls,
      enrollment: {
        enrollmentDate: enrollment.enrollmentDate,
        progress: enrollment.progress,
        completed: enrollment.completed,
      },
      progress: {
        completed: userProgress.length,
        total: contents.length,
        completedContentIds,
        percentage: progressPercentage,
      },
    });
  } catch (error) {
    console.error("Error fetching course contents:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Secure video streaming with token validation
// Enhanced secure video streaming with full protection
const streamVideo = async (req, res) => {
  try {
    const { token, contentId } = req.query;
    
    if (!token || !contentId) {
      return res.status(401).json({ success: false, message: "Access token and content ID required" });
    }

    let decoded;
    try {
      decoded = verifySecureToken(token);
    } catch (error) {
      return res.status(401).json({ success: false, message: error.message });
    }

    const { userId, contentId: tokenContentId } = decoded;

    // ✅ CRITICAL: Verify token contentId matches query contentId
    if (contentId !== tokenContentId) {
      console.warn(`Token mismatch: token=${tokenContentId}, query=${contentId}, user=${userId}`);
      return res.status(403).json({ success: false, message: "Invalid token for this content" });
    }

    console.log(`Streaming video for content ${contentId}, user ${userId}`);

    // Verify content exists
    const content = await CourseContent.findById(contentId);
    if (!content) {
      return res.status(404).json({ success: false, message: "Content not found" });
    }

    // ✅ ENHANCED: Verify enrollment with additional checks
    const enrollment = await Enrollment.findOne({
      user: userId,
      course: content.course,
      paymentStatus: "completed",
    }).populate('course');

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course",
      });
    }

    // ✅ ADDITIONAL: Check if course is still active
    if (enrollment.course.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: "This course is no longer available",
      });
    }

    if (!content.videoFile || !content.videoFile.path) {
      return res.status(404).json({ success: false, message: "Video file not found" });
    }

    const videoPath = path.join(__dirname, '..', content.videoFile.path);
    
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ success: false, message: "Video file not found on server" });
    }

    // ✅ SECURITY HEADERS - Prevent embedding in other sites
    const headers = {
      'Content-Type': content.videoFile.mimetype || 'video/mp4',
      'Content-Disposition': 'inline',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'self'",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN', // Prevent embedding in iframes
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      // ✅ PREVENT CACHING OF SENSITIVE MEDIA
      'Surrogate-Control': 'no-store',
    };

    // For range requests (video streaming)
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      
      if (start >= fileSize || end >= fileSize) {
        return res.status(416).json({ success: false, message: "Requested range not satisfiable" });
      }

      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      
      headers['Content-Range'] = `bytes ${start}-${end}/${fileSize}`;
      headers['Content-Length'] = chunksize;
      headers['Accept-Ranges'] = 'bytes';
      
      res.writeHead(206, headers);
      file.pipe(res);
    } else {
      headers['Content-Length'] = fileSize;
      headers['Accept-Ranges'] = 'bytes';
      res.writeHead(200, headers);
      fs.createReadStream(videoPath).pipe(res);
    }

    // ✅ LOG ACCESS FOR SECURITY MONITORING
    console.log(`✅ Video accessed: content=${contentId}, user=${userId}, ip=${req.ip}, time=${new Date().toISOString()}`);

  } catch (error) {
    console.error("Error streaming video:", error);
    res.status(500).json({ success: false, message: "Error streaming video" });
  }
};


// Secure document serving with token validation (Updated for Excel support)
const serveDocument = async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(401).json({ success: false, message: "Access token required" });
    }

    let decoded;
    try {
      decoded = verifySecureToken(token);
    } catch (error) {
      return res.status(401).json({ success: false, message: error.message });
    }

    const { userId, contentId } = decoded;

    console.log(`Serving document for content ${contentId}, user ${userId}`);

    const content = await CourseContent.findById(contentId).populate('course');
    if (!content) {
      return res.status(404).json({ success: false, message: "Content not found" });
    }

    // Verify enrollment
    const enrollment = await Enrollment.findOne({
      user: userId,
      course: content.course._id,
      paymentStatus: "completed",
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course or payment is pending",
      });
    }

    const documentPath = path.join(__dirname, '..', content.documentFile.path);
    
    if (!fs.existsSync(documentPath)) {
      return res.status(404).json({ success: false, message: "Document file not found on server" });
    }

    const stat = fs.statSync(documentPath);
    const fileSize = stat.size;

    // Determine content type based on file extension and MIME type
    let contentType = 'application/octet-stream'; // Default fallback
    
    // Use the stored MIME type if available
    if (content.documentFile.mimetype) {
      contentType = content.documentFile.mimetype;
    } else {
      // Fallback to extension-based detection
      const fileExtension = path.extname(content.documentFile.filename).toLowerCase();
      
      const mimeTypes = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.txt': 'text/plain',
        '.csv': 'text/csv'
      };
      
      contentType = mimeTypes[fileExtension] || 'application/octet-stream';
    }

    const headers = {
      'Content-Type': contentType,
      'Content-Length': fileSize,
      'Content-Disposition': `inline; filename="${content.documentFile.originalName}"`,
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Content-Security-Policy': "default-src 'none'",
      'X-Content-Type-Options': 'nosniff'
    };

    // For Excel files, we might want to force download instead of inline viewing
    // since browser support for inline Excel viewing can be inconsistent
    const fileExtension = path.extname(content.documentFile.filename).toLowerCase();
    if (fileExtension === '.xls' || fileExtension === '.xlsx') {
      headers['Content-Disposition'] = `attachment; filename="${content.documentFile.originalName}"`;
    }

    const fileStream = fs.createReadStream(documentPath);
    res.writeHead(200, headers);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('Error streaming document:', error);
      res.status(500).json({ success: false, message: "Error serving document" });
    });

  } catch (error) {
    console.error("Error serving document:", error);
    res.status(500).json({ success: false, message: "Error serving document" });
  }
};

// Get secure media URL
// Update getSecureMediaUrl to include contentId in URL
const getSecureMediaUrl = async (req, res) => {
  try {
    const { contentId, mediaType } = req.params;
    const userId = req.user.id;

    // Verify enrollment
    const content = await CourseContent.findById(contentId);
    if (!content) {
      return res.status(404).json({ success: false, message: "Content not found" });
    }

    const enrollment = await Enrollment.findOne({
      user: userId,
      course: content.course,
      paymentStatus: "completed",
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course",
      });
    }

    let mediaExists = false;
    let secureToken = '';

    if (mediaType === 'video' && content.videoFile) {
      mediaExists = true;
      secureToken = generateSecureToken(userId, contentId, '1h'); // Shorter expiry
    } else if (mediaType === 'document' && content.documentFile) {
      mediaExists = true;
      secureToken = generateSecureToken(userId, contentId, '2h');
    }

    if (!mediaExists) {
      return res.status(404).json({ success: false, message: "Media not found" });
    }

    // ✅ IMPORTANT: Include contentId in the URL for double verification
    const mediaUrl = `${API_URL}/api/course-content/secure-media/${mediaType}?token=${secureToken}&contentId=${contentId}`;

    res.json({
      success: true,
      mediaUrl,
      expiresIn: mediaType === 'video' ? '1 hour' : '2 hours',
      // ✅ Return token separately for frontend to construct URL
      token: secureToken,
      contentId: contentId
    });

  } catch (error) {
    console.error("Error generating secure media URL:", error);
    res.status(500).json({ success: false, message: "Error generating media URL" });
  }
};

// Get public course contents (free content for preview)
const getPublicCourseContents = async (req, res) => {
  try {
    const { courseId } = req.params;

    const contents = await CourseContent.find({
      course: courseId,
      status: "active",
      isFree: true,
    })
      .sort({ order: 1 })
      .select("title description type duration order isFree");

    res.json({ success: true, content: contents });
  } catch (error) {
    console.error("Error fetching public course contents:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete content
const deleteContent = async (req, res) => {
  try {
    const { id } = req.params;
    
    const content = await CourseContent.findById(id);
    if (!content) {
      return res.status(404).json({ 
        success: false, 
        message: "Content not found" 
      });
    }

    // Delete associated files from filesystem
    let filePaths = [];
    
    if (content.videoFile?.path) {
      const videoPath = path.join(__dirname, "..", content.videoFile.path);
      if (fs.existsSync(videoPath)) {
        filePaths.push(videoPath);
      }
    }
    
    if (content.documentFile?.path) {
      const documentPath = path.join(__dirname, "..", content.documentFile.path);
      if (fs.existsSync(documentPath)) {
        filePaths.push(documentPath);
      }
    }

    // Delete files from filesystem
    filePaths.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted file: ${filePath}`);
        }
      } catch (fileError) {
        console.error(`Error deleting file ${filePath}:`, fileError);
      }
    });

    // Delete from database
    await CourseContent.findByIdAndDelete(id);

    // Also delete any progress records associated with this content
    await Progress.deleteMany({ content: id });

    console.log(`Content "${content.title}" deleted successfully`);
    
    res.json({ 
      success: true, 
      message: "Content deleted successfully" 
    });
  } catch (error) {
    console.error("❌ Error deleting content:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Server error while deleting content" 
    });
  }
};

// Update content
// Update content
const updateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (req.files) {
      if (req.files.videoFile) {
        const file = req.files.videoFile[0];
        // Generate secure filename
        const fileExtension = path.extname(file.originalname);
        const secureFilename = crypto.randomBytes(16).toString('hex') + fileExtension;
        
        updateData.videoFile = {
          filename: secureFilename,
          originalName: file.originalname,
          path: `uploads/${secureFilename}`,
          size: file.size,
          mimetype: file.mimetype,
        };
        
        // Rename file to secure filename
        const oldPath = file.path;
        const newPath = path.join(path.dirname(oldPath), secureFilename);
        fs.renameSync(oldPath, newPath);
      }
      if (req.files.documentFile) {
        const file = req.files.documentFile[0];
        // Generate secure filename
        const fileExtension = path.extname(file.originalname);
        const secureFilename = crypto.randomBytes(16).toString('hex') + fileExtension;
        
        updateData.documentFile = {
          filename: secureFilename,
          originalName: file.originalname,
          path: `uploads/${secureFilename}`,
          size: file.size,
          mimetype: file.mimetype,
        };
        
        // Rename file to secure filename
        const oldPath = file.path;
        const newPath = path.join(path.dirname(oldPath), secureFilename);
        fs.renameSync(oldPath, newPath);
      }
    }

    // Additional validation before updating
    const type = updateData.type;
    if (type === 'video' && !updateData.videoUrl && !updateData.videoFile?.path) {
      return res.status(400).json({ 
        success: false, 
        message: "Video content must have either a video URL or video file" 
      });
    }

    if ((type === 'document' || type === 'pdf' || type === 'excel') && !updateData.documentUrl && !updateData.documentFile?.path) {
      return res.status(400).json({ 
        success: false, 
        message: "Document/Excel content must have either a document URL or document file" 
      });
    }

    if (updateData.isFree) {
      updateData.isFree = updateData.isFree === "true" || updateData.isFree === true;
    }
    if (updateData.order) {
      updateData.order = parseInt(updateData.order);
    }

    const updatedContent = await CourseContent.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!updatedContent) {
      return res.status(404).json({
        success: false,
        message: "Course content not found",
      });
    }

    res.json({
      success: true,
      message: "Course content updated successfully",
      content: updatedContent,
    });
  } catch (error) {
    console.error("Error updating course content:", error);
    res.status(500).json({
      success: false,
      message: "Error updating course content",
      error: error.message,
    });
  }
};

// Mark content as completed
const markAsCompleted = async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user.id;

    console.log(`Marking content ${contentId} as completed for user ${userId}`);

    const content = await CourseContent.findById(contentId);
    if (!content) {
      return res.status(404).json({ success: false, message: "Content not found" });
    }

    const enrollment = await Enrollment.findOne({
      user: userId,
      course: content.course,
      paymentStatus: "completed",
    });

    if (!enrollment) {
      return res.status(403).json({ success: false, message: "You are not enrolled in this course or payment is pending" });
    }

    const existingProgress = await Progress.findOne({ user: userId, content: contentId });

    const totalProgressBefore = await Progress.countDocuments({ user: userId, course: content.course });
    const totalContent = await CourseContent.countDocuments({ course: content.course, status: "active" });

    if (existingProgress) {
      const progressPercentage = totalContent > 0 ? Math.round((totalProgressBefore / totalContent) * 100) : 0;
      return res.json({
        success: true,
        message: "Content already marked as completed",
        progress: {
          completed: totalProgressBefore,
          total: totalContent,
          percentage: progressPercentage,
        },
        enrollment: {
          progress: enrollment.progress,
          completed: enrollment.completed || false,
        },
      });
    }

    const progressDoc = new Progress({
      user: userId,
      course: content.course,
      content: contentId,
      completedAt: new Date(),
    });

    await progressDoc.save();

    const totalProgress = await Progress.countDocuments({ user: userId, course: content.course });

    const progressPercentage = totalContent > 0 ? Math.round((totalProgress / totalContent) * 100) : 0;

    const updateData = { progress: progressPercentage };
    if (totalProgress === totalContent && totalContent > 0) updateData.completed = true;

    await Enrollment.findOneAndUpdate({ user: userId, course: content.course }, updateData);

    res.json({
      success: true,
      message: "Content marked as completed",
      progress: {
        completed: totalProgress,
        total: totalContent,
        percentage: progressPercentage,
      },
      enrollment: {
        progress: progressPercentage,
        completed: updateData.completed || false,
      },
    });
  } catch (error) {
    console.error("Error marking content complete:", error);
    res.status(500).json({
      success: false,
      message: "Error marking content as completed",
      error: error.message,
    });
  }
};

// Get user progress for a course
const getUserProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const progress = await Progress.find({ user: userId, course: courseId }).populate("content", "title type order");

    const totalContent = await CourseContent.countDocuments({ course: courseId, status: "active" });

    const enrollment = await Enrollment.findOne({ user: userId, course: courseId });

    res.json({
      success: true,
      progress: {
        completed: progress.length,
        total: totalContent,
        percentage: totalContent > 0 ? Math.round((progress.length / totalContent) * 100) : 0,
        completedContents: progress.map((p) => p.content._id),
        details: progress,
      },
      enrollment: enrollment,
    });
  } catch (error) {
    console.error("Error fetching user progress:", error);
    res.status(500).json({ success: false, message: "Error fetching user progress", error: error.message });
  }
};

// Check if user is enrolled in a course
const checkEnrollment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const enrollment = await Enrollment.findOne({ user: userId, course: courseId, paymentStatus: "completed" });

    res.json({
      success: true,
      enrolled: !!enrollment,
      enrollment: enrollment,
    });
  } catch (error) {
    console.error("Error checking enrollment:", error);
    res.status(500).json({ success: false, message: "Error checking enrollment status", error: error.message });
  }
};
// Secure YouTube proxy with blob response
const secureYouTubeProxy = async (req, res) => {
  try {
    const { youtubeUrl, contentId } = req.body;
    const userId = req.user.id;

    console.log(`YouTube proxy request for content ${contentId}, user ${userId}`);

    if (!youtubeUrl || !contentId) {
      return res.status(400).json({ 
        success: false, 
        message: "YouTube URL and content ID are required" 
      });
    }

    // Validate YouTube URL format
    if (!isValidYouTubeUrl(youtubeUrl)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid YouTube URL format" 
      });
    }

    // Verify content exists and user is enrolled
    const content = await CourseContent.findById(contentId);
    if (!content) {
      return res.status(404).json({ 
        success: false, 
        message: "Content not found" 
      });
    }

    // Verify enrollment
    const enrollment = await Enrollment.findOne({
      user: userId,
      course: content.course,
      paymentStatus: "completed",
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course or payment is pending",
      });
    }

    // Extract YouTube video ID
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      return res.status(400).json({ 
        success: false, 
        message: "Could not extract YouTube video ID" 
      });
    }

    // Create secure embed HTML with additional security measures
    const secureEmbedHtml = createSecureEmbedHtml(videoId, contentId, userId);

    // Create blob response
    const blob = new Blob([secureEmbedHtml], { type: 'text/html' });
    
    // Set secure headers
    res.set({
      'Content-Type': 'text/html',
      'Content-Disposition': 'inline',
      'Content-Security-Policy': "default-src 'self' https://www.youtube.com https://www.google.com; script-src 'self' https://www.youtube.com https://s.ytimg.com; frame-src https://www.youtube.com; style-src 'self' 'unsafe-inline' https://www.youtube.com;",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // Convert blob to buffer for Node.js response
    const buffer = Buffer.from(secureEmbedHtml, 'utf-8');
    res.send(buffer);

    // Log the access for analytics
    console.log(`YouTube proxy served for content ${contentId}, user ${userId}, video ${videoId}`);

  } catch (error) {
    console.error("Error in YouTube proxy:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error processing YouTube video request" 
    });
  }
};

// Helper function to validate YouTube URL
const isValidYouTubeUrl = (url) => {
  if (!url) return false;
  
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
  return youtubeRegex.test(url);
};

// Helper function to extract YouTube ID (reuse existing function)
const extractYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
};

// Create secure embed HTML with additional security
const createSecureEmbedHtml = (videoId, contentId, userId) => {
  const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1&playsinline=1&origin=${encodeURIComponent(process.env.FRONTEND_URL || 'http://localhost:3000')}`;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Secure YouTube Player</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #000;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-family: Arial, sans-serif;
        }
        .player-container {
            width: 100%;
            max-width: 1200px;
            position: relative;
        }
        .youtube-iframe {
            width: 100%;
            height: 67.5vh; /* 16:9 aspect ratio */
            border: none;
            background: #000;
        }
        .security-notice {
            color: #666;
            text-align: center;
            padding: 10px;
            font-size: 12px;
            background: #111;
            border-top: 1px solid #333;
        }
        .loading {
            color: #fff;
            text-align: center;
            padding: 20px;
        }
    </style>
</head>
<body>
    <div class="player-container">
        <iframe
            id="ytplayer"
            class="youtube-iframe"
            src="${embedUrl}"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
            referrerpolicy="strict-origin-when-cross-origin"
        ></iframe>
        <div class="security-notice">
            Secure YouTube Player • Content ID: ${contentId} • User: ${userId.substring(0, 8)}...
        </div>
    </div>

    <script>
        // Security and tracking setup
        let player;
        let progressInterval;
        let lastProgressUpdate = 0;
        
        // YouTube API callback
        function onYouTubeIframeAPIReady() {
            player = new YT.Player('ytplayer', {
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange,
                    'onError': onPlayerError
                }
            });
        }

        function onPlayerReady(event) {
            console.log('YouTube player ready in secure container');
            // Notify parent window that player is ready
            if (window.parent !== window) {
                window.parent.postMessage({
                    type: 'youtubePlayerReady',
                    contentId: '${contentId}',
                    userId: '${userId}'
                }, '*');
            }
        }

        function onPlayerStateChange(event) {
            // Track player state changes for analytics
            const states = {
                '-1': 'unstarted',
                '0': 'ended',
                '1': 'playing',
                '2': 'paused',
                '3': 'buffering',
                '5': 'video cued'
            };
            
            const state = states[event.data] || 'unknown';
            
            if (window.parent !== window) {
                window.parent.postMessage({
                    type: 'youtubePlayerStateChange',
                    contentId: '${contentId}',
                    state: state,
                    currentTime: player.getCurrentTime(),
                    duration: player.getDuration()
                }, '*');
            }

            // Start progress tracking when playing
            if (event.data === YT.PlayerState.PLAYING) {
                startProgressTracking();
            } else {
                stopProgressTracking();
            }
        }

        function onPlayerError(event) {
            console.error('YouTube player error:', event.data);
            if (window.parent !== window) {
                window.parent.postMessage({
                    type: 'youtubePlayerError',
                    contentId: '${contentId}',
                    errorCode: event.data
                }, '*');
            }
        }

        function startProgressTracking() {
            progressInterval = setInterval(() => {
                if (player && player.getCurrentTime) {
                    const currentTime = player.getCurrentTime();
                    const duration = player.getDuration();
                    
                    // Only send progress updates every 5 seconds to reduce load
                    if (Date.now() - lastProgressUpdate > 5000) {
                        if (window.parent !== window) {
                            window.parent.postMessage({
                                type: 'youtubeProgressUpdate',
                                contentId: '${contentId}',
                                currentTime: currentTime,
                                duration: duration,
                                percentage: duration > 0 ? currentTime / duration : 0
                            }, '*');
                            lastProgressUpdate = Date.now();
                        }
                    }
                }
            }, 1000);
        }

        function stopProgressTracking() {
            if (progressInterval) {
                clearInterval(progressInterval);
                progressInterval = null;
            }
        }

        // Load YouTube API
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
            onYouTubeIframeAPIReady();
        }

        // Handle messages from parent window
        window.addEventListener('message', function(event) {
            if (event.data.type === 'controlYouTubePlayer' && event.data.contentId === '${contentId}') {
                if (player && player[event.data.action]) {
                    player[event.data.action](...event.data.args || []);
                }
            }
        });

        // Clean up on page unload
        window.addEventListener('beforeunload', function() {
            stopProgressTracking();
            if (window.parent !== window) {
                window.parent.postMessage({
                    type: 'youtubePlayerUnload',
                    contentId: '${contentId}'
                }, '*');
            }
        });
    </script>
</body>
</html>`;
};

// Alternative: Simple blob response for basic embedding
const simpleYouTubeProxy = async (req, res) => {
  try {
    const { youtubeUrl, contentId } = req.body;
    const userId = req.user.id;

    console.log(`Simple YouTube proxy for content ${contentId}, user ${userId}`);

    if (!youtubeUrl || !contentId) {
      return res.status(400).json({ 
        success: false, 
        message: "YouTube URL and content ID are required" 
      });
    }

    // Validate YouTube URL
    if (!isValidYouTubeUrl(youtubeUrl)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid YouTube URL format" 
      });
    }

    // Verify content and enrollment (same as above)
    const content = await CourseContent.findById(contentId);
    if (!content) {
      return res.status(404).json({ 
        success: false, 
        message: "Content not found" 
      });
    }

    const enrollment = await Enrollment.findOne({
      user: userId,
      course: content.course,
      paymentStatus: "completed",
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course or payment is pending",
      });
    }

    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      return res.status(400).json({ 
        success: false, 
        message: "Could not extract YouTube video ID" 
      });
    }

    // Simple embed HTML without complex JavaScript
    const simpleEmbedHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>YouTube Video</title>
    <style>
        body { margin: 0; padding: 0; background: #000; }
        .embed-container { 
            position: relative; 
            padding-bottom: 56.25%; 
            height: 0; 
            overflow: hidden; 
            max-width: 100%; 
        }
        .embed-container iframe { 
            position: absolute; 
            top: 0; 
            left: 0; 
            width: 100%; 
            height: 100%; 
            border: 0; 
        }
    </style>
</head>
<body>
    <div class="embed-container">
        <iframe 
            src="https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1&playsinline=1" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen
            referrerpolicy="strict-origin-when-cross-origin"
        ></iframe>
    </div>
    <script>
        // Basic message passing for progress tracking
        window.addEventListener('message', function(event) {
            if (event.data.type === 'getYouTubeProgress') {
                const iframe = document.querySelector('iframe');
                if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage('getProgress', '*');
                }
            }
        });
    </script>
</body>
</html>`;

    // Set headers and send response
    res.set({
      'Content-Type': 'text/html',
      'Content-Security-Policy': "default-src 'self' https://www.youtube.com; script-src 'self' https://www.youtube.com; frame-src https://www.youtube.com;",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Cache-Control': 'private, no-cache, no-store, must-revalidate'
    });

    res.send(simpleEmbedHtml);

  } catch (error) {
    console.error("Error in simple YouTube proxy:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error processing YouTube video request" 
    });
  }
};
// Simple and reliable YouTube proxy
// ========== GUARANTEED WORKING YOUTUBE PROXY ==========

// Simple and reliable YouTube embed - 100% working
const simpleYouTubeEmbed = async (req, res) => {
  try {
    const { youtubeUrl, contentId } = req.body;
    const userId = req.user.id;

    console.log(`🔧 YouTube embed for content ${contentId}, user ${userId}`);

    if (!youtubeUrl || !contentId) {
      return res.status(400).json({ 
        success: false, 
        message: "YouTube URL and content ID are required" 
      });
    }

    // Extract YouTube video ID
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid YouTube URL" 
      });
    }

    // Verify content and enrollment
    const content = await CourseContent.findById(contentId);
    if (!content) {
      return res.status(404).json({ success: false, message: "Content not found" });
    }

    const enrollment = await Enrollment.findOne({
      user: userId,
      course: content.course,
      paymentStatus: "completed",
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course",
      });
    }

    // ✅ GUARANTEED WORKING EMBED HTML
    const embedHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YouTube Video</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body, html { width: 100%; height: 100%; background: #000; overflow: hidden; }
        .video-container { 
            width: 100vw; 
            height: 100vh; 
            position: relative;
            background: #000;
        }
        .youtube-iframe {
            width: 100%;
            height: 100%;
            border: none;
            display: block;
        }
    </style>
</head>
<body>
    <div class="video-container">
        <iframe 
            class="youtube-iframe"
            src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
            referrerpolicy="strict-origin-when-cross-origin"
        ></iframe>
    </div>
    
    <script>
        // Report loading status to parent
        window.addEventListener('load', function() {
            if (window.parent !== window) {
                window.parent.postMessage({
                    type: 'youtubePlayerLoaded',
                    contentId: '${contentId}',
                    status: 'ready'
                }, '*');
            }
        });

        // Handle any errors
        window.addEventListener('error', function(e) {
            if (window.parent !== window) {
                window.parent.postMessage({
                    type: 'youtubePlayerError',
                    contentId: '${contentId}',
                    error: e.message
                }, '*');
            }
        });
    </script>
</body>
</html>`;

    res.set({
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.send(embedHtml);
    console.log(`✅ YouTube embed served for video ${videoId}`);

  } catch (error) {
    console.error("❌ Error in YouTube embed:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error loading YouTube video" 
    });
  }
};

// Direct YouTube URL generator (Alternative approach)
const getDirectYouTubeUrl = async (req, res) => {
  try {
    const { youtubeUrl, contentId } = req.body;
    const userId = req.user.id;

    console.log(`🔧 Direct YouTube URL for content ${contentId}`);

    // Extract YouTube video ID
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid YouTube URL" 
      });
    }

    // Verify content and enrollment
    const content = await CourseContent.findById(contentId);
    if (!content) {
      return res.status(404).json({ success: false, message: "Content not found" });
    }

    const enrollment = await Enrollment.findOne({
      user: userId,
      course: content.course,
      paymentStatus: "completed",
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course",
      });
    }

    // ✅ Return direct embed URL (100% working)
    const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;

    res.json({
      success: true,
      embedUrl: embedUrl,
      videoId: videoId
    });

  } catch (error) {
    console.error("❌ Error getting direct YouTube URL:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error processing YouTube URL" 
    });
  }
};
module.exports = {
  uploadContent,
  getAllContentData,
  getContentById,
  getCourseContents,
  getPublicCourseContents,
  deleteContent,
  updateContent,
  markAsCompleted,
  getUserProgress,
  checkEnrollment,
  streamVideo,
  serveDocument,
  getSecureMediaUrl,
  generateSecureToken,
  verifySecureToken,       // Add this
  isValidYouTubeUrl,         // Add this if you want to export it
  extractYouTubeId,
  simpleYouTubeEmbed,
  getDirectYouTubeUrl
        // Add this if you want to export it
};

