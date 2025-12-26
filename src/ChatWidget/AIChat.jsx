import { useState, useEffect, useRef } from "react";
import styles from "./ChatWidget.module.css";
import logo from "../assets/image.png";

export default function AIChat() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! Welcome to Djit Trading! 👋\nI can help you with courses, account issues, or general inquiries.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendAIMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(
        "https://n8n.cybomb.com/webhook/7c0f7656-ce06-468a-ad76-0e0db457adbe/chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: userMsg }),
        }
      );

      const data = await res.json();
      let botText = data.output || "I apologize, but I'm having trouble connecting right now.";

      // Clean up text
      botText = botText.replace(/\*/g, "").trim();

      setMessages((prev) => [...prev, { sender: "bot", text: botText }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "I'm having trouble reaching the server. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendAIMessage();
    }
  };

  return (
    <div className={styles.aiChatContainer}>
      <div className={styles.messagesContainer}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`${styles.message} ${msg.sender === "user" ? styles.userMessage : styles.botMessage
              }`}
          >
            {msg.sender === "bot" && (
              <div className={styles.botAvatar}>
                <img src={logo} alt="Bot" className={styles.botAvatarImage} />
              </div>
            )}
            <div className={styles.messageBubble}>
              <div className={styles.pointList}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className={`${styles.message} ${styles.botMessage}`}>
            <div className={styles.botAvatar}>
              <img src={logo} alt="Bot" className={styles.botAvatarImage} />
            </div>
            <div className={styles.messageBubble}>
              <div className={styles.typingIndicator}>
                <div className={styles.typingDot}></div>
                <div className={styles.typingDot}></div>
                <div className={styles.typingDot}></div>
              </div>
            </div>
          </div>
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
            onClick={sendAIMessage}
            disabled={isLoading || !input.trim()}
            className={styles.sendButton}
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
        <div className={styles.footerNote}>
          Powered by Djit AI
        </div>
      </div>
    </div>
  );
}
