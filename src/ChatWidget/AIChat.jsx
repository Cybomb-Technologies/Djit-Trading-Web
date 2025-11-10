import { useState, useEffect, useRef } from "react";
import styles from "./ChatWidget.module.css";
import logo from "../assets/image.png";

export default function AIChat() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! Welcome to Djit Trading! I'm here to help you with:\n• Trading inquiries\n• Account support\n• Market information\n• Technical issues\n• Platform guidance\n• Investment advice",
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

    const newMessages = [...messages, { sender: "user", text: input }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(
        "https://n8n.cybomb.com/webhook/7c0f7656-ce06-468a-ad76-0e0db457adbe/chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: input }),
        }
      );

      const data = await res.json();
      let botText =
        data.output ||
        "I apologize, but I'm having trouble processing your request. Please try again in a moment.";
      botText = botText.replace(/\*/g, "").trim();
      const botPoints = botText
        .split(". ")
        .map((point) => point.trim())
        .filter((point) => point !== "");
      const bulletMessage = botPoints.join("\n");

      setMessages((prev) => [...prev, { sender: "bot", text: bulletMessage }]);
    } catch (error) {
      console.error("Error connecting to AI:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "I'm currently experiencing connection issues. Please try again shortly or switch to live chat for immediate assistance.",
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
            className={`${styles.message} ${
              msg.sender === "user" ? styles.userMessage : styles.botMessage
            }`}
          >
            {msg.sender === "bot" && (
              <div className={styles.botAvatar}>
                <img src={logo} alt="AI" className={styles.botAvatarImage} style={{width:"40px", height:"40px", borderRadius:"50%"}}/>
              </div>
            )}
            <div className={styles.messageBubble}>
              {msg.sender === "bot" ? (
                <div className={styles.pointList}>
                  {msg.text.split("\n").map(
                    (line, i) =>
                      line.trim() && (
                        <div key={i} className={styles.pointItem}>
                          {line}
                        </div>
                      )
                  )}
                </div>
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className={`${styles.message} ${styles.botMessage}`}>
            <div className={styles.botAvatar}>
              <img src={logo} alt="AI" className={styles.botAvatarImage} style={{width:"40px", height:"40px",borderRadius:"50%"}}/>
            </div>
            <div className={styles.messageBubble}>
              <div className={styles.typingIndicator}>
                <span>AI Assistant is typing</span>
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
        <div className={styles.inputContainer}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about Djit Trading..."
            disabled={isLoading}
            className={styles.messageInput}
          />
          <button
            onClick={sendAIMessage}
            disabled={isLoading || !input.trim()}
            className={styles.sendButton}
          >
            {isLoading ? (
              <div className={styles.loadingSpinner}></div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
        <div className={styles.footerNote}>
          🤖 AI Assistant • Powered by Djit Trading
        </div>
      </div>
    </div>
  );
}
