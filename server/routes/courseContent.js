const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const courseContentController = require("../controllers/courseContentController");
const { auth, adminAuth } = require("../middleware/auth");

// Multi-file support
const multiUpload = upload.fields([
  { name: "videoFile", maxCount: 1 },
  { name: "documentFile", maxCount: 1 },
]);

// Public routes (preview)
router.get("/public/:courseId", courseContentController.getPublicCourseContents);

// Admin routes for content management
router.get("/admin/all-content", adminAuth, courseContentController.getAllContentData);
router.get("/admin/content/:id", adminAuth, courseContentController.getContentById);

// Protected routes
router.post("/upload", adminAuth, multiUpload, courseContentController.uploadContent);
router.get("/:courseId", auth, courseContentController.getCourseContents);
router.put("/:id", adminAuth, multiUpload, courseContentController.updateContent);
router.delete("/:id", adminAuth, courseContentController.deleteContent);

// ✅ ENHANCED SECURE MEDIA ACCESS ROUTES
router.get("/secure-media/video", (req, res) => {
  // ✅ ADD CONTENT ID VALIDATION AT ROUTE LEVEL
  const { token, contentId } = req.query;
  
  if (!token || !contentId) {
    return res.status(401).json({ 
      success: false, 
      message: "Access token and content ID required" 
    });
  }
  
  // Pass to controller
  courseContentController.streamVideo(req, res);
});

router.get("/secure-media/document", (req, res) => {
  // ✅ ADD CONTENT ID VALIDATION AT ROUTE LEVEL
  const { token, contentId } = req.query;
  
  if (!token || !contentId) {
    return res.status(401).json({ 
      success: false, 
      message: "Access token and content ID required" 
    });
  }
  
  // Pass to controller
  courseContentController.serveDocument(req, res);
});

router.get("/secure-url/:contentId/:mediaType", auth, courseContentController.getSecureMediaUrl);

// YouTube secure proxy routes
router.post("/simple-youtube-embed", auth, courseContentController.simpleYouTubeEmbed);
router.post("/direct-youtube-url", auth, courseContentController.getDirectYouTubeUrl);

// Progress tracking
router.post("/:contentId/complete", auth, courseContentController.markAsCompleted);
router.get("/progress/:courseId", auth, courseContentController.getUserProgress);
router.get("/check-enrollment/:courseId", auth, courseContentController.checkEnrollment);

// ✅ NEW: Token refresh endpoint for expired media tokens
router.post("/refresh-media-token/:contentId/:mediaType", auth, async (req, res) => {
  try {
    const { contentId, mediaType } = req.params;
    const userId = req.user.id;

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

    let secureToken = '';
    if (mediaType === 'video') {
      secureToken = courseContentController.generateSecureToken(userId, contentId, '1h');
    } else if (mediaType === 'document') {
      secureToken = courseContentController.generateSecureToken(userId, contentId, '2h');
    }

    const mediaUrl = `/api/course-content/secure-media/${mediaType}?token=${secureToken}&contentId=${contentId}`;

    res.json({
      success: true,
      mediaUrl,
      expiresIn: mediaType === 'video' ? '1 hour' : '2 hours'
    });

  } catch (error) {
    console.error("Error refreshing media token:", error);
    res.status(500).json({ success: false, message: "Error refreshing media token" });
  }
});

// Deprecated routes - kept for backward compatibility but will return error
router.get("/video/:contentId", (req, res) => {
  res.status(410).json({ 
    success: false, 
    message: "This endpoint is deprecated. Use secure media URLs instead." 
  });
});

router.get("/uploads/:filename", (req, res) => {
  res.status(410).json({ 
    success: false, 
    message: "This endpoint is deprecated. Use secure media URLs instead." 
  });
});

module.exports = router;