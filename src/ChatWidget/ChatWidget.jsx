import { useState } from "react";
import styles from "./ChatWidget.module.css";
import logo from "../assets/image.png";
import AIChat from "./AIChat";
import LiveChat from "./LiveChat";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLiveChat, setIsLiveChat] = useState(false);

  // Chat button close panna function
  const handleCloseModal = () => {
    setIsOpen(false);
  };

  // Chat button open panna function
  const handleOpenModal = () => {
    setIsOpen(true);
  };

  return (
    <div className={styles.chatWidget}>
      {/* Floating Chat Button - Only show when modal closed */}
      {!isOpen && (
        <button className={styles.chatButton} onClick={handleOpenModal}>
          <div className={styles.buttonContent}>
            <span className={styles.chatIcon}>💬</span>
            <span className={`${styles.chatLabel} d-none d-md-inline`}>
              Chat with us
            </span>
          </div>
          <div className={styles.pulseEffect}></div>
        </button>
      )}

      {/* Modal Overlay */}
      {isOpen && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div
            className={styles.chatModal}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={styles.modalHeader}>
              <div className={styles.headerContent}>
                <div className={styles.avatar}>
                  <img
                    src={logo}
                    alt="Djit Trading"
                    className={styles.avatarImage}
                  />
                  <div className={styles.statusIndicator}></div>
                </div>
                <div className={styles.headerText}>
                  <div className={styles.companyName}>Djit Trading Support</div>
                  <div className={styles.status}>
                    {isLiveChat ? "Live Agent" : "AI Assistant"} • Online
                  </div>
                </div>
              </div>
              <button
                className={styles.closeButton}
                onClick={handleCloseModal}
                title="Close"
              >
                ✖
              </button>
            </div>

            {/* Mode Switch */}
            <div className={styles.modeSwitch}>
              <button
                onClick={() => setIsLiveChat(false)}
                className={`${styles.modeBtn} ${
                  !isLiveChat ? styles.activeMode : ""
                }`}
              >
               <i class="fa-solid fa-robot"></i> AI Assistant
              </button>
              <button
                onClick={() => setIsLiveChat(true)}
                className={`${styles.modeBtn} ${
                  isLiveChat ? styles.activeMode : ""
                }`}
              >
                <i class="fa-solid fa-user-tie"></i> Live Chat
              </button>
            </div>

            {/* Chat Mode */}
            <div className={styles.modalContent}>
              {isLiveChat ? (
                <LiveChat onClose={handleCloseModal} />
              ) : (
                <AIChat onClose={handleCloseModal} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}