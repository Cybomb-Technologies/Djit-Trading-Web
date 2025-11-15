const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// Socket.IO configuration
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173", "https://cybombadmin.cybomb.com", "https://djittrading.com", "https://www.djittrading.com"],
    credentials: true,
    methods: ["GET", "POST"],
  }
});

// Make io globally available
global.io = io;

// Security middleware configuration - FIXED CSP
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "https://www.youtube.com", "https://s.ytimg.com"],
      frameSrc: ["'self'", "https://www.youtube.com"],
      mediaSrc: ["'self'", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"], // ADDED WebSocket support
      imgSrc: ["'self'", "data:", "https:", "http:"],
      fontSrc: ["'self'", "https:", "data:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

// Rate limiting configurations
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply security middleware
app.use(securityHeaders);
app.use(generalLimiter);

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    'uploads/profile-pictures/', 
    'uploads/csv-imports/',
    'uploads/course-content/'
  ];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
};
createUploadDirs();

// CORS configuration
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5173", "https://cybombadmin.cybomb.com", "https://testing.cybomb.com","https://djittrading.com", "https://www.djittrading.com"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Body parsing middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Static files - Serve uploads directory with proper CORS headers
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  setHeaders: (res, filePath) => {
    // Allow all origins for images
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, HEAD');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Set appropriate content type
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.set('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.png')) {
      res.set('Content-Type', 'image/png');
    } else if (filePath.endsWith('.gif')) {
      res.set('Content-Type', 'image/gif');
    }
    
    // Cache settings
    if (filePath.includes('profile-pictures')) {
      res.set('Cache-Control', 'public, max-age=86400');
    }
    
    res.set('X-Content-Type-Options', 'nosniff');
  },
  dotfiles: 'allow'
}));

// Add specific route for profile pictures
app.use('/uploads/profile-pictures', (req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, HEAD');
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads/profile-pictures')));

// Load models
require("./models/User");
require("./models/Admin");
require("./models/Course");
require("./models/CourseContent");
require("./models/Enrollment");
require("./models/Progress");
require("./models/LiveChat"); // Make sure LiveChat model is loaded

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/courses", require("./routes/courseRoutes"));
app.use("/api/enrollments", require("./routes/enrollmentRoutes"));
app.use("/api/videos", require("./routes/videoRoutes"));
app.use("/api/coupons", require("./routes/couponRoutes"));
app.use("/api/newsletter", require("./routes/newsletterRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
// app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/admin/auth", require("./routes/adminAuthRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/admin/courses", require("./routes/adminCourseRoutes"));
app.use("/api/course-content", require("./routes/courseContent"));
app.use("/api/livechat", require("./routes/liveChatRoutes"));

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running healthy with Live Chat",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    features: {
      liveChat: true,
      socketIO: true,
      realTime: true
    }
  });
});

app.get("/", (req, res) => res.send("✅ Cashfree Backend is Running with Live Chat!"));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔵 User connected:', socket.id);

  // Join a specific chat room
  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
    console.log(`🔵 Socket ${socket.id} joined chat room: ${chatId}`);
  });

  // Leave a chat room
  socket.on('leaveChat', (chatId) => {
    socket.leave(chatId);
    console.log(`🔵 Socket ${socket.id} left chat room: ${chatId}`);
  });

  // Handle user typing indicator
  socket.on('typingStart', (data) => {
    socket.to(data.chatId).emit('userTyping', {
      userId: data.userId,
      userName: data.userName
    });
  });

  socket.on('typingStop', (data) => {
    socket.to(data.chatId).emit('userStoppedTyping', {
      userId: data.userId
    });
  });

  // Handle message read receipts
  socket.on('markMessagesRead', (data) => {
    socket.to(data.chatId).emit('messagesRead', {
      chatId: data.chatId,
      readerId: data.readerId,
      unreadCount: 0
    });
  });

  // Handle admin joining multiple chats
  socket.on('adminJoinChats', (chatIds) => {
    chatIds.forEach(chatId => {
      socket.join(chatId);
    });
    console.log(`🔵 Admin ${socket.id} joined ${chatIds.length} chats`);
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log('🔴 User disconnected:', socket.id, 'Reason:', reason);
  });

  // Error handling
  socket.on('error', (error) => {
    console.error('🔴 Socket error:', error);
  });
});

// Error handling middleware
app.use(require("./middleware/errorHandler"));

// MongoDB Connection
mongoose.connect(
  process.env.MONGODB_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }
)
.then(() => console.log("✅ MongoDB Connected Successfully"))
.catch((err) => {
  console.log("❌ MongoDB Connection Error:", err);
  process.exit(1);
});

// MongoDB connection events
mongoose.connection.on("connected", () => {
  console.log("🟢 Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("🔴 Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("🟡 Mongoose disconnected from MongoDB");
});

// Handle undefined routes
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global Error Handler:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? undefined : error.message
  });
});

// Graceful shutdown handlers
process.on("SIGINT", async () => {
  console.log('🟡 SIGINT received, shutting down gracefully');
  await mongoose.connection.close();
  console.log('🟡 MongoDB connection closed');
  server.close(() => {
    console.log('🔴 Process terminated');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('🟡 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('🔴 Process terminated');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🕒 Started at: ${new Date().toLocaleString()}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💬 Live Chat API: http://localhost:${PORT}/api/livechat`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`👨‍💼 Admin API: http://localhost:${PORT}/api/admin`);
  console.log(`🔌 Socket.IO: http://localhost:${PORT} (WebSocket enabled)\n`);
});

server.setTimeout(120000);

module.exports = app;