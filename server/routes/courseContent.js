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

// Secure media access routes
router.get("/secure-media/video", courseContentController.streamVideo);
router.get("/secure-media/document", courseContentController.serveDocument);
router.get("/secure-url/:contentId/:mediaType", auth, courseContentController.getSecureMediaUrl);

// YouTube secure proxy routes
// router.post("/secure-youtube-proxy", auth, courseContentController.secureYouTubeProxy);
// router.post("/simple-youtube-proxy", auth, courseContentController.simpleYouTubeProxy);
// In routes/courseContent.js
router.post("/simple-youtube-embed", auth, courseContentController.simpleYouTubeEmbed);
router.post("/direct-youtube-url", auth, courseContentController.getDirectYouTubeUrl);

// Progress tracking
router.post("/:contentId/complete", auth, courseContentController.markAsCompleted);
router.get("/progress/:courseId", auth, courseContentController.getUserProgress);
router.get("/check-enrollment/:courseId", auth, courseContentController.checkEnrollment);

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