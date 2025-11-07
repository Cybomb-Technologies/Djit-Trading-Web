import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ChatWidget.module.css";
import io from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function LiveChat() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: "", mobile: "", email: "" });
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Initialize Socket.IO
  useEffect(() => {
    const newSocket = io(`${API_URL}`);
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('adminReply', (data) => {
      if (data.chatId === chatId) {
        setMessages(prev => [...prev, data.message]);
        
        // Mark message as read
        markMessageAsRead(data.message._id);
      }
    });

    return () => {
      socket.off('adminReply');
    };
  }, [socket, chatId]);

  // Check authentication and start chat
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const token = localStorage.getItem("token");
        
        if (token) {
          const res = await fetch(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success && data.user) {
              setIsLoggedIn(true);
              setUserInfo({
                name: data.user.name,
                email: data.user.email,
                mobile: data.user.mobile,
              });
              await startChatSession();
              setIsCheckingAuth(false);
              return;
            }
          }
          
          localStorage.removeItem("token");
        }

        setIsCheckingAuth(false);
        redirectToLogin();
        
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("token");
        setIsCheckingAuth(false);
        redirectToLogin();
      }
    };

    checkAuthentication();
  }, [navigate]);

  // Start chat session
  const startChatSession = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${API_URL}/api/livechat/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      
      if (data.success && data.chat) {
        setChatId(data.chat._id);
        setMessages(data.chat.messages || []);
        
        // Join socket room for this chat
        if (socket) {
          socket.emit('joinChat', data.chat._id);
        }
      }
    } catch (error) {
      console.error("❌ Error starting chat session:", error);
    }
  };

  const redirectToLogin = () => {
    navigate("/login", { 
      state: { 
        from: "livechat",
        returnUrl: "/live-chat"
      }
    });
  };

  // Send message
  const sendLiveChatMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    // Optimistically update UI
    const tempMessage = { 
      _id: Date.now().toString(), // Temporary ID
      sender: "user", 
      text: input, 
      timestamp: new Date(),
      senderName: userInfo.name,
      readByAdmin: false
    };
    setMessages((prev) => [...prev, tempMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/livechat/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: input,
        }),
      });

      const data = await res.json();
      
      if (data.success && data.messages) {
        setMessages(data.messages);
      } else {
        // Remove optimistic update if failed
        setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
        setInput(input);
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
      setInput(input);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark message as read
  const markMessageAsRead = async (messageId) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/api/livechat/mark-read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messageId, chatId }),
      });
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendLiveChatMessage();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUserInfo({ name: "", email: "", mobile: "" });
    setChatId(null);
    setMessages([]);
    if (socket) socket.disconnect();
    redirectToLogin();
  };

  // Loading state
  if (isCheckingAuth) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Checking authentication...</p>
      </div>
    );
  }

  // Not logged in
  if (!isLoggedIn) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authHeader}>
          <h3>Live Chat Support</h3>
          <p>Please login to continue with live chat</p>
        </div>

        <div className={styles.authOptions}>
          <div className={styles.authCard}>
            <div className={styles.authIcon}>🔒</div>
            <h4>Authentication Required</h4>
            <p>You need to be logged in to use live chat support</p>
            <button 
              className={styles.primaryButton}
              onClick={redirectToLogin}
            >
              Login to Continue
            </button>
          </div>
        </div>

        <div className={styles.authFooter}>
          <p>
            <strong>Note:</strong> AI Chat is available without login, but live agent support requires authentication
          </p>
        </div>
      </div>
    );
  }

  // Logged in - Chat UI
  return (
    <div className={styles.liveChatContainer}>
      <div className={styles.liveChatHeader}>
        <div className={styles.headerText}>
          <b>{userInfo.name}</b>
          <span>
            {userInfo.mobile} 
            {userInfo.email && ` • ${userInfo.email}`}
          </span>
        </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.logoutBtn}
            onClick={handleLogout}
            title="Logout"
          >
            Logout
          </button>
        </div>
      </div>

      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.welcomeMessage}>
            <div className={styles.welcomeIcon}>💬</div>
            <h4>Welcome to Live Chat Support!</h4>
            <p>How can we help you today? Our support team is ready to assist you.</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={msg._id || i}
              className={`${styles.message} ${
                msg.sender === "user" ? styles.userMessage : 
                msg.sender === "admin" ? styles.adminMessage : styles.botMessage
              }`}
            >
              <div className={styles.messageBubble}>
                <div className={styles.messageHeader}>
                  <span className={styles.senderName}>
                    {msg.sender === "user" ? "You" : 
                     msg.sender === "admin" ? "Support Agent" : "System"}
                  </span>
                  {msg.timestamp && (
                    <span className={styles.messageTime}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  )}
                </div>
                <div className={styles.messageText}>{msg.text}</div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className={styles.botMessage}>
            <div className={styles.messageBubble}>
              <div className={styles.typingIndicator}>
                <span>Sending message...</span>
                <div className={styles.typingDots}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputSection}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message to support agent..."
          className={styles.messageInput}
          disabled={isLoading}
        />
        <button
          onClick={sendLiveChatMessage}
          disabled={isLoading || !input.trim()}
          className={styles.sendButton}
        >
          {isLoading ? (
            <div className={styles.loadingSpinner}></div>
          ) : (
            "➤"
          )}
        </button>
      </div>
    </div>
  );
}