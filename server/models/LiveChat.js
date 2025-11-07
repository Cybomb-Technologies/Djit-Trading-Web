const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ["user", "admin", "bot"],
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  readByAdmin: {
    type: Boolean,
    default: false
  },
  readByUser: {
    type: Boolean,
    default: true
  },
  senderName: {
    type: String,
    default: "User"
  }
});

const liveChatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  userName: {
    type: String,
    required: true,
    default: "User"
  },
  userEmail: {
    type: String,
    required: true,
    default: "user@example.com"
  },
  userMobile: {
    type: String,
    default: "000-000-0000"
  },
  messages: [messageSchema],
  status: {
    type: String,
    enum: ["open", "closed"],
    default: "open"
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    type: Number,
    default: 0
  },
  adminAssigned: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt before saving
liveChatSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate unread count
  if (this.messages && this.messages.length > 0) {
    this.unreadCount = this.messages.filter(msg => 
      msg.sender === "user" && !msg.readByAdmin
    ).length;
  }
  
  next();
});

// Index for better performance
liveChatSchema.index({ userId: 1, lastActivity: -1 });
liveChatSchema.index({ status: 1, lastActivity: -1 });

module.exports = mongoose.model("LiveChat", liveChatSchema);