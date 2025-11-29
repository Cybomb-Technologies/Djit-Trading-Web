const mongoose = require("mongoose");
const LiveChat = require("../models/LiveChat");
const User = require("../models/User");
const jwt = require('jsonwebtoken');
const Notification = require("../models/Notification");
// Start or resume chat for authenticated user
exports.startChat = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("🟡 Starting chat for user:", userId);
    
    // Get user details with correct field selection
    const user = await User.findById(userId).select('username email profile');
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log("🟡 User details:", {
      username: user.username,
      email: user.email,
      profile: user.profile
    });

    // Find existing OPEN chat or create new one
    let chat = await LiveChat.findOne({ 
      userId, 
      status: "open" 
    }).sort({ lastActivity: -1 });

    if (!chat) {
      // Create user name from available fields
      const userName = user.profile?.firstName 
        ? `${user.profile.firstName}${user.profile.lastName ? ' ' + user.profile.lastName : ''}`
        : user.username;
      
      // Get mobile from profile.phone or profile.phone2
      const userMobile = user.profile?.phone || user.profile?.phone2 || "000-000-0000";
      
      console.log("🟡 Creating new chat session for user:", userName);
      
      chat = new LiveChat({
        userId: userId,
        userName: userName,
        userEmail: user.email || "user@example.com",
        userMobile: userMobile,
        messages: [{
          sender: "bot", 
          senderId: new mongoose.Types.ObjectId(),
          text: "Welcome to Djit Trading Live Support! Our team will assist you shortly.",
          timestamp: new Date(),
          readByAdmin: true,
          readByUser: true
        }],
        status: "open",
        lastActivity: new Date()
      });
    } else {
      console.log("🟡 Resuming existing chat:", chat._id);
      // Mark user messages as read by user
      chat.messages.forEach(msg => {
        if (msg.sender === "admin") {
          msg.readByUser = true;
        }
      });
      chat.lastActivity = new Date();
    }

    await chat.save();
    console.log("✅ Chat saved successfully:", chat._id);

    res.json({ 
      success: true, 
      chat: {
        _id: chat._id,
        messages: chat.messages,
        status: chat.status,
        lastActivity: chat.lastActivity,
        unreadCount: chat.unreadCount
      }
    });
  } catch (error) {
    console.error("❌ Error starting chat:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Send message from user
// Send message from user
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { message } = req.body;

    console.log("🟡 Sending message from user:", userId, "Message:", message);

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const user = await User.findById(userId).select('username email profile');
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Find active chat session
    let chat = await LiveChat.findOne({ 
      userId, 
      status: "open" 
    }).sort({ lastActivity: -1 });

    if (!chat) {
      console.log("🟡 No active chat found, creating new one");
      
      // Create user name from available fields
      const userName = user.profile?.firstName 
        ? `${user.profile.firstName}${user.profile.lastName ? ' ' + user.profile.lastName : ''}`
        : user.username;
      
      // Get mobile from profile.phone or profile.phone2
      const userMobile = user.profile?.phone || user.profile?.phone2 || "000-000-0000";
      
      // Create new chat with proper fallbacks
      chat = new LiveChat({
        userId: userId,
        userName: userName,
        userEmail: user.email || "user@example.com",
        userMobile: userMobile,
        messages: [],
        status: "open",
        lastActivity: new Date()
      });
    }

    // Create sender name for message
    const senderName = user.profile?.firstName 
      ? `${user.profile.firstName}${user.profile.lastName ? ' ' + user.profile.lastName : ''}`
      : user.username || chat.userName || "User";

    // Add user message
    const newMessage = {
      sender: "user",
      senderId: userId,
      text: message.trim(),
      senderName: senderName,
      timestamp: new Date(),
      readByAdmin: false,
      readByUser: true
    };

    chat.messages.push(newMessage);
    chat.lastActivity = new Date();
    
    await chat.save();
    console.log("✅ Message saved successfully to chat:", chat._id);

    // 🔔 Notification for new user message
    try {
      const notification = await Notification.create({
        title: 'New Message from User',
        message: `User ${senderName} sent a message in live chat.`,
        type: 'live-chat', // enum compatible
        relatedId: chat._id,
        isRead: false
      });
      console.log('✅ Live chat notification created:', notification._id);
    } catch (notifErr) {
      console.error('❌ Live chat notification failed:', notifErr.message);
    }

    // Emit real-time event
    if (global.io) {
      global.io.emit('newMessage', {
        chatId: chat._id,
        message: newMessage,
        userName: chat.userName,
        unreadCount: chat.unreadCount
      });
    }

    res.json({ 
      success: true, 
      messages: chat.messages 
    });
  } catch (error) {
    console.error("❌ Error sending message:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// Get all chats for admin with unread counts
exports.getAllChats = async (req, res) => {
  try {
    const { status = "open" } = req.query;
    
    console.log("🟡 Fetching all chats with status:", status);
    
    const chats = await LiveChat.find({ status })
      .populate('userId', 'username email profile')
      .sort({ lastActivity: -1 })
      .select('userId userName userEmail userMobile messages status lastActivity unreadCount createdAt');

    console.log("✅ Found", chats.length, "chats");

    res.json({
      success: true,
      chats: chats
    });
  } catch (error) {
    console.error("❌ Error fetching chats:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get single chat details for admin and mark messages as read
exports.getChat = async (req, res) => {
  try {
    const chat = await LiveChat.findById(req.params.id)
      .populate('userId', 'username email profile');

    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    // Mark all user messages as read by admin
    let hasUnread = false;
    chat.messages.forEach(msg => {
      if (msg.sender === "user" && !msg.readByAdmin) {
        msg.readByAdmin = true;
        hasUnread = true;
      }
    });

    if (hasUnread) {
      await chat.save();
      
      // Emit read status update
      if (global.io) {
        global.io.emit('messagesRead', {
          chatId: chat._id,
          unreadCount: 0
        });
      }
    }

    res.json({
      success: true,
      chat: chat
    });
  } catch (error) {
    console.error("Error fetching chat:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Admin reply to chat
const SystemAdmin = {
  _id: "65a1b2c3d4e5f67890123456",
  name: "System Admin",
  email: "admin@djittrading.com",
  role: "superadmin"
};

exports.adminReply = async (req, res) => {
  try {
    const { chatId, message } = req.body;
    
    console.log("🔍 === COMPLETE TOKEN DEBUGGING ===");
    console.log("📦 Request received for chat:", chatId);
    console.log("📦 Message:", message);
    
    // CHECK ALL HEADERS
    console.log("🔑 ALL HEADERS:");
    Object.keys(req.headers).forEach(key => {
      if (key.toLowerCase().includes('auth') || key.toLowerCase().includes('token')) {
        console.log(`   🔥 ${key}: ${req.headers[key]}`);
      } else {
        console.log(`   ${key}: ${req.headers[key]}`);
      }
    });
    
    // SPECIFICALLY CHECK AUTHORIZATION
    const authHeader = req.headers.authorization || req.headers.Authorization;
    console.log("🔑 Authorization header found:", !!authHeader);
    console.log("🔑 Authorization value:", authHeader);
    
    const token = authHeader?.replace('Bearer ', '')?.replace('bearer ', '');
    console.log("🔑 Token after cleaning:", token ? "EXISTS" : "NULL");
    
    let adminName = "Djit Support";
    let adminId = null;

    if (token) {
      console.log("🔑 Token length:", token.length);
      console.log("🔑 Token starts with:", token.substring(0, 20) + "...");
      
      // TEST TOKEN DECODE
      try {
        console.log("🔄 Attempting token decode...");
        
        // Check JWT_SECRET
        if (!process.env.JWT_SECRET) {
          console.log("❌ JWT_SECRET is MISSING in environment variables");
          throw new Error("JWT_SECRET not found");
        }
        
        console.log("✅ JWT_SECRET exists, length:", process.env.JWT_SECRET.length);
        
        // 🔍 DECODE WITHOUT VERIFICATION FIRST
        console.log("🔍 DECODING TOKEN WITHOUT VERIFICATION:");
        const decodedWithoutVerify = jwt.decode(token);
        console.log("   Decoded (no verify):", JSON.stringify(decodedWithoutVerify, null, 2));
        
        if (decodedWithoutVerify) {
          console.log("   Name in token:", decodedWithoutVerify.name);
          console.log("   ID in token:", decodedWithoutVerify.id);
          console.log("   Email in token:", decodedWithoutVerify.email);
        }
        
        // NOW TRY VERIFICATION
        console.log("🔄 NOW ATTEMPTING TOKEN VERIFICATION:");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ TOKEN VERIFY SUCCESS!");
        console.log("   Verified payload:", JSON.stringify(decoded, null, 2));
        console.log("   Admin name in token:", decoded.name);
        console.log("   Admin ID in token:", decoded.id);
        console.log("   Admin email in token:", decoded.email);
        
        adminName = decoded.name || "Djit Support";
        adminId = decoded.id;
        
        console.log("🎯 WILL USE ADMIN NAME:", adminName);
        
      } catch (decodeError) {
        console.log("❌ TOKEN DECODE/VERIFY FAILED!");
        console.log("   Error name:", decodeError.name);
        console.log("   Error message:", decodeError.message);
        
        // Try to decode anyway (without verification)
        try {
          const fallbackDecoded = jwt.decode(token);
          console.log("🔄 FALLBACK - Decoded without verification:");
          console.log("   Fallback payload:", fallbackDecoded);
          if (fallbackDecoded && fallbackDecoded.name) {
            adminName = fallbackDecoded.name; // ✅ USE ACTUAL ADMIN NAME
            adminId = fallbackDecoded.id;
            console.log("🎯 USING FALLBACK NAME:", adminName);
          } else {
            adminName = "Djit Support"; // Only fallback if no name in token
          }
        } catch (fallbackError) {
          console.log("❌ FALLBACK DECODE ALSO FAILED:", fallbackError.message);
          adminName = "Djit Support";
        }
        
        // Final fallback - DON'T OVERWRITE adminName!
        adminId = new mongoose.Types.ObjectId(process.env.SYSTEM_ADMIN_ID || "65a1b2c3d4e5f67890123456");
      }
    } else {
      console.log("❌ NO TOKEN FOUND IN REQUEST");
      console.log("   Check if admin frontend is sending Authorization header");
      adminId = new mongoose.Types.ObjectId(process.env.SYSTEM_ADMIN_ID || "65a1b2c3d4e5f67890123456");
      adminName = "Djit Support";
    }
    
    console.log("🟡 Final decision - Admin reply by:", adminName);
    console.log("🔍 === DEBUG END ===\n");

    // REST OF YOUR ORIGINAL CODE
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const chat = await LiveChat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    const newMessage = {
      sender: "admin",
      senderId: adminId,
      senderName: adminName, // ← THIS WILL NOW SHOW ACTUAL ADMIN NAME
      text: message.trim(),
      timestamp: new Date(),
      readByAdmin: true,
      readByUser: false
    };

    console.log("💬 Creating message with senderName:", adminName);

    chat.messages.push(newMessage);
    chat.lastActivity = new Date();
    chat.status = "open";
    
    await chat.save();
    console.log("✅ Admin reply saved successfully by:", adminName);

    // Emit real-time events
    if (global.io) {
      global.io.to(chat.userId.toString()).emit('newMessage', {
        chatId: chat._id,
        message: newMessage,
        userName: chat.userName,
        unreadCount: chat.unreadCount
      });
      
      global.io.emit('adminReply', {
        chatId: chat._id,
        message: newMessage,
        userId: chat.userId.toString()
      });
    }

    res.json({ 
      success: true, 
      messages: chat.messages 
    });

  } catch (error) {
    console.error("❌ Error sending admin reply:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update chat status (simplified - only open/closed)
exports.updateChatStatus = async (req, res) => {
  try {
    const { chatId, status } = req.body;

    const chat = await LiveChat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    chat.status = status;
    chat.lastActivity = new Date();
    await chat.save();

    res.json({ 
      success: true, 
      message: "Chat status updated successfully",
      chat: chat 
    });
  } catch (error) {
    console.error("Error updating chat status:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get users list for admin sidebar
exports.getChatUsers = async (req, res) => {
  try {
    const chats = await LiveChat.find({ status: "open" })
      .populate('userId', 'username email profile')
      .sort({ lastActivity: -1 })
      .select('userId userName userEmail userMobile status lastActivity unreadCount');

    res.json({
      success: true,
      users: chats
    });
  } catch (error) {
    console.error("Error fetching chat users:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get user messages (for logged-in user)
exports.getUserMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const chat = await LiveChat.findOne({ userId }).sort({ lastActivity: -1 });

    if (!chat) {
      return res.status(404).json({ success: false, message: "No chat found" });
    }

    res.json({
      success: true,
      messages: chat.messages,
    });
  } catch (error) {
    console.error("❌ Error fetching user messages:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// For testing - Check if data is saving
exports.testSave = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('username email profile');
    
    // Create user name from available fields
    const userName = user.profile?.firstName 
      ? `${user.profile.firstName}${user.profile.lastName ? ' ' + user.profile.lastName : ''}`
      : user.username;
    
    // Get mobile from profile.phone or profile.phone2
    const userMobile = user.profile?.phone || user.profile?.phone2 || "000-000-0000";
    
    const testChat = new LiveChat({
      userId: req.user._id,
      userName: userName || "Test User",
      userEmail: user?.email || "test@example.com",
      userMobile: userMobile,
      messages: [{
        sender: "user",
        text: "Test message",
        senderName: userName || "Test User",
        timestamp: new Date()
      }],
      status: "open"
    });

    await testChat.save();
    console.log("✅ Test chat saved:", testChat._id);

    res.json({ 
      success: true, 
      message: "Test chat saved successfully",
      chatId: testChat._id 
    });
  } catch (error) {
    console.error("❌ Test save error:", error);
    res.status(500).json({ success: false, message: "Test save failed" });
  }
};

// OLD METHOD - For backward compatibility
exports.getMessages = async (req, res) => {
  try {
    const chat = await LiveChat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    res.json({ success: true, messages: chat.messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};