const express = require("express");
const router = express.Router();
const liveChatController = require("../controllers/liveChatController");
const { protect } = require("../middleware/authMiddleware");
const { adminProtect } = require("../middleware/adminAuthMiddleware");

// User routes (require authentication)
router.post("/start", protect, liveChatController.startChat);
router.post("/send", protect, liveChatController.sendMessage);
router.get("/user/messages", protect, liveChatController.getUserMessages);
router.post("/test-save", protect, liveChatController.testSave);

// Admin routes (require admin authentication)
router.get("/admin/chats", adminProtect, liveChatController.getAllChats);
router.get("/admin/chat-users", adminProtect, liveChatController.getChatUsers);
router.get("/admin/chat/:id", adminProtect, liveChatController.getChat);
router.post("/admin/reply", adminProtect, liveChatController.adminReply);
router.put("/admin/status", adminProtect, liveChatController.updateChatStatus);

// Keep old routes for backward compatibility
router.get("/:id", liveChatController.getMessages);

module.exports = router;