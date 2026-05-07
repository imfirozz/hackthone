import React, { useState, useRef, useEffect, useCallback } from "react";
import { requestInterviewMentor } from "../services/interviewApi";
import { getStoredAuthSession } from "../services/authApi";

// ==========================================
// CHATBOT FLOATING ICON + FULL CHAT PANEL
// ==========================================

const WELCOME_MESSAGE = {
  role: "assistant",
  content:
    "👋 Hi! I'm your AI Interview Mentor. I can help you with:\n\n• **Practice questions** — get realistic interview questions\n• **Concept explanations** — understand technical topics\n• **Answer improvement** — refine your responses\n• **Weak area coaching** — targeted practice plans\n\nJust type a message to get started!",
  timestamp: Date.now(),
};

const QUICK_PROMPTS = [
  { label: "🎯 Practice Question", message: "Give me a practice interview question for React.js" },
  { label: "💡 Explain a Concept", message: "Explain closures in JavaScript for an interview" },
  { label: "📈 Weak Area Coaching", message: "Help me improve my system design skills" },
];

function formatTimestamp(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function parseMarkdownInline(text) {
  // Handle bold **text**, bullet points, and newlines for display
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*.*?\*\*)/g).map((segment, j) => {
      if (segment.startsWith("**") && segment.endsWith("**")) {
        return (
          <strong key={j} style={{ color: "#fff", fontWeight: 700 }}>
            {segment.slice(2, -2)}
          </strong>
        );
      }
      return segment;
    });

    return (
      <span key={i}>
        {i > 0 && <br />}
        {parts}
      </span>
    );
  });
}

function buildMentorDisplayContent(response) {
  // Build a rich display from the structured mentor response
  const data = response?.data || {};
  const parts = [];

  if (data.reply) parts.push(data.reply);

  if (data.question) {
    parts.push(`\n\n**📝 Practice Question:**\n${data.question}`);
    if (data.topic) parts.push(`\n**Topic:** ${data.topic}`);
  }

  if (data.explanation) {
    parts.push(`\n\n**📖 Explanation:**\n${data.explanation}`);
  }

  if (data.practicalExample) {
    parts.push(`\n\n**🔧 Practical Example:**\n${data.practicalExample}`);
  }

  if (data.followUpQuestion) {
    parts.push(`\n\n**🔄 Follow-up Question:**\n${data.followUpQuestion}`);
  }

  if (data.improvedAnswer) {
    parts.push(`\n\n**✨ Improved Answer:**\n${data.improvedAnswer}`);
  }

  if (Array.isArray(data.practiceGuidance) && data.practiceGuidance.length > 0) {
    parts.push(`\n\n**📋 Practice Guidance:**`);
    data.practiceGuidance.forEach((tip) => parts.push(`\n• ${tip}`));
  }

  if (Array.isArray(data.improvementTips) && data.improvementTips.length > 0) {
    parts.push(`\n\n**💡 Improvement Tips:**`);
    data.improvementTips.forEach((tip) => parts.push(`\n• ${tip}`));
  }

  if (data.needsInput && Array.isArray(data.requiredFields)) {
    parts.push(`\n\n**Required info:** ${data.requiredFields.join(", ")}`);
  }

  return parts.join("") || "I received your message but couldn't generate a detailed response. Please try again.";
}

// ==========================================
// MESSAGE BUBBLE COMPONENT
// ==========================================
function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 12,
        animation: "chatFadeIn 0.3s ease-out",
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            flexShrink: 0,
            marginRight: 8,
            marginTop: 2,
          }}
        >
          🤖
        </div>
      )}
      <div
        style={{
          maxWidth: "82%",
          padding: "10px 14px",
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          background: isUser
            ? "linear-gradient(135deg, #3b82f6, #2563eb)"
            : "rgba(255,255,255,0.06)",
          border: isUser ? "none" : "1px solid rgba(255,255,255,0.08)",
          color: "#e2e8f0",
          fontSize: 13,
          lineHeight: 1.6,
          wordBreak: "break-word",
        }}
      >
        <div>{parseMarkdownInline(message.content)}</div>
        <div
          style={{
            fontSize: 10,
            color: isUser ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.35)",
            marginTop: 4,
            textAlign: isUser ? "right" : "left",
          }}
        >
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// TYPING INDICATOR
// ==========================================
function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        🤖
      </div>
      <div
        style={{
          padding: "10px 16px",
          borderRadius: "16px 16px 16px 4px",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          gap: 4,
          alignItems: "center",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#64748b",
              animation: `typingDot 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ==========================================
// MAIN CHATBOT COMPONENT
// ==========================================
export default function ChatBotIcon() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = (text || "").trim();
      if (!trimmed || isLoading) return;

      const userMsg = {
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputValue("");
      setIsLoading(true);

      try {
        const response = await requestInterviewMentor({
          message: trimmed,
          intent: "",
        });

        const content = buildMentorDisplayContent(response);

        const assistantMsg = {
          role: "assistant",
          content,
          timestamp: Date.now(),
          rawResponse: response,
        };

        setMessages((prev) => [...prev, assistantMsg]);

        if (!isOpen) {
          setHasUnread(true);
        }
      } catch (error) {
        const errorMsg = {
          role: "assistant",
          content: `⚠️ ${error.message || "Something went wrong. Please try again."}`,
          timestamp: Date.now(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, isOpen],
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleQuickPrompt = (promptText) => {
    sendMessage(promptText);
  };

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
    setHasUnread(false);
  };

  const clearChat = () => {
    setMessages([
      {
        ...WELCOME_MESSAGE,
        timestamp: Date.now(),
        content: "🔄 Chat cleared! How can I help you with your interview preparation?",
      },
    ]);
  };

  const session = getStoredAuthSession();
  const userName =
    session?.user?.firstName ||
    session?.user?.name?.split(" ")[0] ||
    "there";

  return (
    <>
      {/* ============ CHAT PANEL ============ */}
      <div
        id="chatbot-panel"
        style={{
          position: "fixed",
          bottom: isOpen ? 96 : 80,
          right: 24,
          width: 400,
          maxWidth: "calc(100vw - 48px)",
          height: isOpen ? "min(580px, calc(100vh - 140px))" : "0px",
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? "scale(1) translateY(0)" : "scale(0.92) translateY(16px)",
          transformOrigin: "bottom right",
          transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: 99,
          borderRadius: 20,
          overflow: "hidden",
          pointerEvents: isOpen ? "auto" : "none",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(180deg, rgba(15,23,42,0.97), rgba(10,15,30,0.98))",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow:
            "0 25px 70px rgba(0,0,0,0.5), 0 0 40px rgba(59,130,246,0.1)",
          backdropFilter: "blur(24px)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(255,255,255,0.03)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              🤖
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#fff",
                  lineHeight: 1.2,
                }}
              >
                AI Interview Mentor
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#4ade80",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#22c55e",
                    display: "inline-block",
                  }}
                />
                Online
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={clearChat}
              title="Clear chat"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.5)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.color = "rgba(255,255,255,0.5)";
              }}
            >
              🗑
            </button>
            <button
              onClick={toggleChat}
              title="Close chat"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.5)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.color = "rgba(255,255,255,0.5)";
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 14px",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.1) transparent",
          }}
        >
          {messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts (only show when few messages) */}
        {messages.length <= 1 && !isLoading && (
          <div
            style={{
              padding: "0 14px 10px",
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              flexShrink: 0,
            }}
          >
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt.label}
                onClick={() => handleQuickPrompt(prompt.message)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 20,
                  border: "1px solid rgba(59,130,246,0.25)",
                  background: "rgba(59,130,246,0.08)",
                  color: "#93c5fd",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(59,130,246,0.18)";
                  e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(59,130,246,0.08)";
                  e.currentTarget.style.borderColor = "rgba(59,130,246,0.25)";
                }}
              >
                {prompt.label}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: "12px 14px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            gap: 8,
            alignItems: "center",
            background: "rgba(255,255,255,0.02)",
            flexShrink: 0,
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Ask anything about interviews...`}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: "#e2e8f0",
              fontSize: 13,
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "rgba(59,130,246,0.5)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(255,255,255,0.1)";
            }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: "none",
              background:
                inputValue.trim() && !isLoading
                  ? "linear-gradient(135deg, #3b82f6, #06b6d4)"
                  : "rgba(255,255,255,0.06)",
              color:
                inputValue.trim() && !isLoading
                  ? "#fff"
                  : "rgba(255,255,255,0.3)",
              cursor:
                inputValue.trim() && !isLoading ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              transition: "all 0.25s",
              flexShrink: 0,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>

      {/* ============ FAB BUTTON ============ */}
      <div
        id="chatbot-fab"
        className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3"
      >
        {/* Tooltip (only when closed) */}
        {!isOpen && (
          <div
            style={{
              opacity: isHovered ? 1 : 0,
              transform: isHovered
                ? "translateY(0) scale(1)"
                : "translateY(8px) scale(0.9)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              pointerEvents: "none",
            }}
            className="rounded-xl bg-slate-900/90 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-md border border-white/10"
          >
            Chat with AI Mentor 🤖
          </div>
        )}

        {/* FAB Button */}
        <button
          aria-label={isOpen ? "Close AI Chatbot" : "Open AI Chatbot"}
          onClick={toggleChat}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            background: isOpen
              ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
              : "linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #8b5cf6 100%)",
            boxShadow: isHovered
              ? isOpen
                ? "0 8px 32px rgba(239,68,68,0.5)"
                : "0 8px 32px rgba(59,130,246,0.5), 0 0 60px rgba(6,182,212,0.3)"
              : isOpen
                ? "0 4px 20px rgba(239,68,68,0.35)"
                : "0 4px 20px rgba(59,130,246,0.35), 0 0 40px rgba(6,182,212,0.15)",
            transform: isHovered ? "scale(1.12)" : "scale(1)",
            transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          className="relative flex h-16 w-16 items-center justify-center rounded-full text-white cursor-pointer"
        >
          {/* Pulse ring (only when closed) */}
          {!isOpen && (
            <span
              className="absolute inset-0 rounded-full"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                animation:
                  "chatbot-pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                opacity: 0.4,
              }}
            />
          )}

          {/* Icon — chat bubble or close X */}
          {isOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="relative z-10"
              style={{
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                transition: "transform 0.3s",
                transform: "rotate(0deg)",
              }}
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="relative z-10 h-7 w-7"
              style={{
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
              }}
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none">
                <animate
                  attributeName="opacity"
                  values="0.3;1;0.3"
                  dur="1.4s"
                  repeatCount="indefinite"
                  begin="0s"
                />
              </circle>
              <circle cx="12" cy="10" r="1" fill="currentColor" stroke="none">
                <animate
                  attributeName="opacity"
                  values="0.3;1;0.3"
                  dur="1.4s"
                  repeatCount="indefinite"
                  begin="0.2s"
                />
              </circle>
              <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none">
                <animate
                  attributeName="opacity"
                  values="0.3;1;0.3"
                  dur="1.4s"
                  repeatCount="indefinite"
                  begin="0.4s"
                />
              </circle>
            </svg>
          )}

          {/* Online / Unread indicator */}
          <span
            className="absolute -top-0.5 -right-0.5 z-20 rounded-full border-2 border-slate-900"
            style={{
              width: hasUnread && !isOpen ? 18 : 14,
              height: hasUnread && !isOpen ? 18 : 14,
              background: hasUnread && !isOpen ? "#ef4444" : "#22c55e",
              boxShadow: `0 0 8px ${hasUnread && !isOpen ? "rgba(239,68,68,0.6)" : "rgba(34,197,94,0.6)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontWeight: 800,
              color: "#fff",
              transition: "all 0.3s",
            }}
          >
            {hasUnread && !isOpen ? "!" : ""}
          </span>
        </button>
      </div>

      {/* ============ ANIMATIONS ============ */}
      <style>{`
        @keyframes chatbot-pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.45); opacity: 0; }
        }
        @keyframes chatFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingDot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-4px); }
        }
        #chatbot-panel::-webkit-scrollbar { width: 4px; }
        #chatbot-panel::-webkit-scrollbar-track { background: transparent; }
        #chatbot-panel::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
      `}</style>
    </>
  );
}
