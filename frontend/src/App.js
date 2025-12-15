import React, { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatBoxRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  // Reset backend memory on component mount so each page refresh starts a new chat
  useEffect(() => {
    const resetMemory = async () => {
      try {
        await fetch("http://127.0.0.1:8000/reset", { method: "POST" });
      } catch (err) {
        // Non-fatal: keep going if reset fails (e.g., backend not running locally)
        // Log to console for debugging.
        console.warn("Could not reset backend memory:", err);
      }
    };

    resetMemory();
    // run once on mount
  }, []);

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput("");
    
    // Add user message to UI
    const newMessages = [...messages, { sender: "user", text: userMessage, id: Date.now() }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Call backend API
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await res.json();

      if (data.error) {
        setMessages([...newMessages, { 
          sender: "bot", 
          text: `Error: ${data.error}`, 
          id: Date.now() + 1 
        }]);
      } else {
        // Add bot reply
        setMessages([...newMessages, { 
          sender: "bot", 
          text: data.response, 
          id: Date.now() + 1 
        }]);
      }
    } catch (error) {
      setMessages([...newMessages, { 
        sender: "bot", 
        text: "Failed to connect to the server. Please try again.", 
        id: Date.now() + 1 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="app-container">
      <div className="chat-wrapper">
        {/* Header */}
        <div className="chat-header">
          <h1 className="chat-title">
            <span className="bot-icon">🤖</span>
            AI Assistant
          </h1>
          <p className="chat-subtitle">Powered by Groq LLaMA</p>
        </div>

        {/* Chat Box */}
        <div className="chat-box" ref={chatBoxRef}>
          {messages.length === 0 ? (
            <div className="welcome-message">
              <div className="welcome-icon">💬</div>
              <p className="welcome-text">Start a conversation with me!</p>
              <p className="welcome-hint">Ask me anything...</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`message-wrapper ${msg.sender}`}
              >
                <div className={`message ${msg.sender}`}>
                  <p className="message-text">{msg.text}</p>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="message-wrapper bot">
              <div className="message bot typing">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <form className="input-area" onSubmit={sendMessage}>
          <input
            className="message-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here... (Press Enter to send)"
            disabled={isLoading}
          />
          <button 
            className="send-button" 
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            title="Send message (Enter)"
          >
            {isLoading ? "⏳" : "➤"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
