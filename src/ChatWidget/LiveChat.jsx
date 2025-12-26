import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ChatWidget.module.css";
import io from "socket.io-client";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function LiveChat({ onClose }) {
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const newSocket = io(`${API_URL}`);
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("adminReply", (data) => {
      if (data.chatId === chatId) {
        setMessages((prev) => [...prev, data.message]);
        markMessageAsRead(data.message._id);
      }
    });
    return () => socket.off("adminReply");
  }, [socket, chatId]);

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
                name: data.user.name || "User",
                email: data.user.email || "",
                mobile: data.user.mobile || "",
              });
              await startChatSession();
              setIsCheckingAuth(false);
              return;
            }
          }
          localStorage.removeItem("token");
        }
        setIsCheckingAuth(false);
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("token");
        setIsCheckingAuth(false);
      }
    };
    checkAuthentication();
  }, [navigate]);

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
        if (socket) socket.emit("joinChat", data.chat._id);
      }
    } catch (error) {
      console.error("❌ Error starting chat session:", error);
    }
  };

  const redirectToLogin = () => {
    // Close the modal logic usually happens in parent, but here we just navigate
    // Ideally we might want to close the chat widget too, but simple nav is fine
    navigate("/login");
  };

  const sendLiveChatMessage = async () => {
    if (!input.trim() || isLoading) return;

    const tempMessage = {
      _id: Date.now().toString(),
      sender: "user",
      text: input,
      timestamp: new Date(),
      senderName: userInfo.name,
      readByAdmin: false,
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
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      if (data.success && data.messages) {
        setMessages(data.messages);
      } else {
        setMessages((prev) => prev.filter((msg) => msg._id !== tempMessage._id));
        setInput(input);
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      setMessages((prev) => prev.filter((msg) => msg._id !== tempMessage._id));
      setInput(input);
    } finally {
      setIsLoading(false);
    }
  };

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
      // Silent fail
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendLiveChatMessage();
    }
  };

  const handleEndChat = () => {
    if (socket) socket.disconnect();
    if (onClose) onClose();
  };

  const shouldShowDateSeparator = (currentMsg, previousMsg) => {
    if (!previousMsg) return true;
    const currentDate = new Date(currentMsg.timestamp).toDateString();
    const previousDate = new Date(previousMsg.timestamp).toDateString();
    return currentDate !== previousDate;
  };

  const formatMessageDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // 1. Loading State
  if (isCheckingAuth) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.typingIndicator}>
          <div className={styles.typingDot}></div>
          <div className={styles.typingDot}></div>
          <div className={styles.typingDot}></div>
        </div>
        <p style={{ marginTop: '10px', color: '#666', fontSize: '13px' }}>Verifying...</p>
      </div>
    );
  }

  // 2. Not Logged In State (The specific UI requested)
  if (!isLoggedIn) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authHeader}>
          <h3>Live Chat Support</h3>
          <p>Please login to continue with live chat</p>
        </div>

        <div className={styles.authCard}>
          <div className={styles.authIcon}>
            <i className="fa-solid fa-lock"></i>
          </div>
          <h4>Authentication Required</h4>
          <p>You need to be logged in to use live chat support services.</p>
          <button className={styles.primaryButton} onClick={redirectToLogin}>
            Login to Continue
          </button>
        </div>

        <div className={styles.authFooter}>
          <p>
            <strong>Note:</strong> AI Chat is available without login, but live agent support requires authentication.
          </p>
        </div>
      </div>
    );
  }

  // 3. Logged In / Chat Interface
  return (
    <div className={styles.liveChatContainer}>
      <div className={styles.liveChatHeader}>
        <div className={styles.headerText}>
          <b>{(userInfo.name || "User").split(' ')[0]}</b>
          <span>{userInfo.mobile}</span>
        </div>
        <button className={styles.logoutBtn} onClick={handleEndChat} title="Close Chat">
          Close
        </button>
      </div>

      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.welcomeMessage}>
            <div className={styles.welcomeIcon}>
              <i className="fa-regular fa-comments"></i>
            </div>
            <h4>Welcome, {userInfo.name}!</h4>
            <p>Our support team is ready to assist you. Please type your message below.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const showDate = shouldShowDateSeparator(msg, messages[index - 1]);
            const isUser = msg.sender === "user";

            return (
              <div key={msg._id || index}>
                {showDate && (
                  <div className={styles.dateSeparator}>
                    <span>{formatMessageDate(msg.timestamp)}</span>
                  </div>
                )}
                <div className={`${styles.message} ${isUser ? styles.userMessage : styles.botMessage}`}>
                  {!isUser && (
                    <div className={styles.botAvatar}>
                      <i className="fa-solid fa-headset" style={{ color: '#14B8A6', fontSize: '14px' }}></i>
                    </div>
                  )}
                  <div className={styles.messageBubble}>
                    <div className={styles.messageHeader}>
                      <span className={styles.senderName}>{isUser ? "You" : "Support Agent"}</span>
                      <span className={styles.messageTime}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div>{msg.text}</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputSection}>
        <div className={styles.inputContainer}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className={styles.messageInput}
          />
          <button
            onClick={sendLiveChatMessage}
            disabled={isLoading || !input.trim()}
            className={styles.sendButton}
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
}