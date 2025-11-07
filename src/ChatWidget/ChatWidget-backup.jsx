// import { useState } from "react";
// import styles from "./ChatWidget.module.css";

// export default function ChatWidget() {
//   const [isOpen, setIsOpen] = useState(false);
//   const [messages, setMessages] = useState([
//     { sender: "bot", text: "Hello! How can I help you?" }
//   ]);
//   const [input, setInput] = useState("");

//   const sendMessage = async () => {
//     if (!input.trim()) return;

//     const newMessages = [...messages, { sender: "user", text: input }];
//     setMessages(newMessages);
//     setInput("");

//     try {
//       const res = await fetch("http://localhost:3000/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ message: input })
//       });
//       const data = await res.json();

//       setMessages((prev) => [...prev, { sender: "bot", text: data.response }]);
//     } catch (error) {
//       setMessages((prev) => [
//         ...prev,
//         { sender: "bot", text: "Error connecting to AI." }
//       ]);
//     }
//   };

//   return (
//     <div className={styles.chatWidget}>
//       {/* Floating Chat Button */}
//       <button
//         className={styles.chatButton}
//         onClick={() => setIsOpen((prev) => !prev)}
//       >
//         💬
//       </button>

//       {/* Chat Popup Window */}
//       {isOpen && (
//         <div className={styles.chatWindow}>
//           <div className={styles.chatHeader}>
//             AI Chatbot
//             <span
//               className={styles.closeBtn}
//               onClick={() => setIsOpen(false)}
//             >
//               ✖
//             </span>
//           </div>

//           <div className={styles.chatBody}>
//             {messages.map((msg, idx) => (
//               <div
//                 key={idx}
//                 className={
//                   msg.sender === "user" ? styles.userMsg : styles.botMsg
//                 }
//               >
//                 {msg.text}
//               </div>
//             ))}
//           </div>

//           <div className={styles.chatFooter}>
//             <input
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               placeholder="Type a message..."
//               onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//             />
//             <button onClick={sendMessage}>➤</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
