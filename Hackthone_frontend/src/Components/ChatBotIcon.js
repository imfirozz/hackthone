import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import { requestInterviewMentor } from "../services/interviewApi";
import {
  AUTH_EXPIRED_EVENT,
  AUTH_SESSION_UPDATED_EVENT,
  getAuthIdentity,
  getStoredAuthSession,
} from "../services/authApi";

const CHAT_STORAGE_PREFIX = "aix_interview_mentor_v3";
const MAX_STORED_MESSAGES = 18;
const PANEL_WIDTH = 440;
const PANEL_HALF_SCREEN_WIDTH = "min(50vw, 760px)";

const INTERVIEW_TYPE_OPTIONS = [
  { value: "technical", label: "Technical" },
  { value: "hr", label: "HR" },
  { value: "managerial", label: "Managerial" },
];

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const TOOL_PRESETS = [
  {
    key: "question",
    intent: "generate-question",
    label: "Question",
    icon: "Q",
    title: "Generate a realistic question",
    description: "Build a question around your skill, company, round, and difficulty.",
  },
  {
    key: "concept",
    intent: "explain-concept",
    label: "Concept",
    icon: "C",
    title: "Explain a concept for interviews",
    description: "Get interview-focused explanations, trade-offs, and examples.",
  },
  {
    key: "improve",
    intent: "improve-answer",
    label: "Refine",
    icon: "R",
    title: "Refine an answer",
    description: "Keep the meaning, but improve structure, clarity, and depth.",
  },
  {
    key: "feedback",
    intent: "answer-feedback",
    label: "Review",
    icon: "F",
    title: "Score an answer",
    description: "Get interview-style feedback, strength, improvement, and ideal answer.",
  },
  {
    key: "coaching",
    intent: "weak-area-coaching",
    label: "Coaching",
    icon: "W",
    title: "Coach weak areas",
    description: "Create a targeted practice loop from weak topics and failed concepts.",
  },
];

function normalizeText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function toTitleCase(value = "") {
  return normalizeText(value)
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function slugifyLabel(value = "") {
  return normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function parseList(value = "") {
  return String(value)
    .split(/[\n,]/)
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

function formatTimestamp(ts) {
  const date = new Date(ts);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatIntentLabel(value = "") {
  const labelMap = {
    "generate-question": "Practice",
    "explain-concept": "Concept",
    "improve-answer": "Refine",
    "answer-feedback": "Review",
    "weak-area-coaching": "Coaching",
  };

  return labelMap[value] || toTitleCase(value.replace(/-/g, " "));
}

function formatMentorSource(value = "") {
  if (!value) {
    return "";
  }

  if (value.toLowerCase() === "gemini") {
    return "AI";
  }

  if (value.toLowerCase() === "fallback") {
    return "Fallback";
  }

  return toTitleCase(value);
}

function parseMarkdownInline(text = "") {
  return String(text)
    .split("\n")
    .map((line, lineIndex) => {
      const parts = line.split(/(\*\*.*?\*\*)/g).map((segment, segmentIndex) => {
        if (segment.startsWith("**") && segment.endsWith("**")) {
          return (
            <strong key={`${lineIndex}-${segmentIndex}`} style={{ color: "#fff", fontWeight: 700 }}>
              {segment.slice(2, -2)}
            </strong>
          );
        }

        return segment;
      });

      return (
        <span key={lineIndex}>
          {lineIndex > 0 && <br />}
          {parts}
        </span>
      );
    });
}

function buildRouteContext(pathname = "/") {
  if (pathname.includes("/hr")) {
    return {
      routeLabel: "HR Round",
      interviewType: "hr",
      difficulty: "medium",
      domain: "general",
      defaultSkill: "Communication",
      starterFocus: ["behavioral storytelling", "clarity"],
    };
  }

  if (pathname.includes("/technical")) {
    return {
      routeLabel: "Technical Round",
      interviewType: "technical",
      difficulty: "medium",
      domain: "general",
      defaultSkill: "JavaScript",
      starterFocus: ["problem solving", "technical depth"],
    };
  }

  if (pathname.includes("/mock")) {
    return {
      routeLabel: "Mock Round",
      interviewType: "technical",
      difficulty: "medium",
      domain: "general",
      defaultSkill: "React.js",
      starterFocus: ["communication", "delivery"],
    };
  }

  if (pathname.includes("/session")) {
    return {
      routeLabel: "Live Session",
      interviewType: "technical",
      difficulty: "medium",
      domain: "general",
      defaultSkill: "React.js",
      starterFocus: ["answer improvement", "weak area coaching"],
    };
  }

  if (pathname.includes("/analytics")) {
    return {
      routeLabel: "Analytics",
      interviewType: "technical",
      difficulty: "medium",
      domain: "general",
      defaultSkill: "System Design",
      starterFocus: ["weak area coaching", "score improvement"],
    };
  }

  if (pathname.includes("/dashboard")) {
    return {
      routeLabel: "Dashboard",
      interviewType: "technical",
      difficulty: "medium",
      domain: "general",
      defaultSkill: "React.js",
      starterFocus: ["practice questions", "weak area coaching"],
    };
  }

  return {
    routeLabel: "Interview Prep",
    interviewType: "technical",
    difficulty: "medium",
    domain: "general",
    defaultSkill: "React.js",
    starterFocus: ["practice questions", "concept explanations"],
  };
}

function buildStorageKey(authIdentity) {
  const identityValue =
    authIdentity?.email ||
    authIdentity?.displayName ||
    "guest";

  return `${CHAT_STORAGE_PREFIX}:${slugifyLabel(identityValue) || "guest"}`;
}

function buildInitialDraft(routeContext, authIdentity) {
  return {
    skill: routeContext.defaultSkill || "React.js",
    concept: routeContext.defaultSkill || "React.js",
    question: "",
    answer: "",
    company: "",
    focus: routeContext.starterFocus.join(", "),
    difficulty: routeContext.difficulty,
    interviewType: routeContext.interviewType,
    domain:
      normalizeText(authIdentity?.roleLabel).toLowerCase() || routeContext.domain,
  };
}

function buildWelcomeMessage({ authIdentity, routeContext }) {
  const name = authIdentity?.displayName?.split(" ")[0] || "there";
  const isPersonalized = Boolean(authIdentity);

  return {
    role: "assistant",
    content: isPersonalized
      ? `Hi ${name}. I am your AI Interview Mentor. I can generate realistic questions, explain concepts in interview language, refine answers, and coach weak areas from your history.`
      : "Hi. I am your AI Interview Mentor. In guest mode, I can still generate questions, explain concepts, review answers, and help you practice if you share a real skill, interview type, and difficulty.",
    timestamp: Date.now(),
    meta: {
      isWelcome: true,
      mode: isPersonalized ? "personalized" : "guest",
      intent: "generate-question",
      mentor: "system",
    },
    payload: {
      explanation: `You are currently on the ${routeContext.routeLabel} surface, so I will keep coaching aligned with that flow.`,
      practiceGuidance: isPersonalized
        ? [
            "Use the tool buttons to generate a question, explain a concept, refine an answer, or get weak-area coaching.",
            "If you are already mid-interview, paste the exact question and your draft answer for targeted review.",
            "If your analytics exist, I will bias the coaching toward weaker areas automatically.",
          ]
        : [
            "Start with a valid skill such as React.js, Node.js, JavaScript, MongoDB, or System Design.",
            "Tell me the interview type and difficulty so the question feels realistic.",
            "If you want better answer feedback, send both the interview question and your answer.",
          ],
      improvementTips: routeContext.starterFocus.map((item) =>
        `Focus on ${item} while you practice in this section.`,
      ),
      template: isPersonalized
        ? null
        : {
            skill: routeContext.defaultSkill || "React.js",
            interviewType: toTitleCase(routeContext.interviewType),
            difficulty: toTitleCase(routeContext.difficulty),
            company: "Google",
          },
    },
  };
}

function buildQuickActions({ authIdentity, routeContext, profileSummary }) {
  const weakArea = profileSummary?.weakAreas?.[0];
  const resumeSkill = profileSummary?.resumeSkills?.[0] || routeContext.defaultSkill;

  const actions = [
    {
      key: "practice-question",
      title: "Practice question",
      description: `Generate a ${routeContext.difficulty} ${routeContext.interviewType} question for ${resumeSkill || "your stack"}.`,
      tool: "question",
    },
    {
      key: "concept-explanation",
      title: "Concept breakdown",
      description: `Explain ${resumeSkill || "a core concept"} with trade-offs and real usage.`,
      tool: "concept",
    },
    {
      key: "answer-review",
      title: "Answer review",
      description: "Paste a real question and your answer to get realistic feedback.",
      tool: "feedback",
    },
  ];

  if (authIdentity) {
    actions.push({
      key: "weak-area",
      title: "Weak-area plan",
      description: weakArea
        ? `Coach me on ${weakArea} with a focused practice loop.`
        : "Create a personalized coaching plan from my history.",
      tool: "coaching",
    });
  } else {
    actions.push({
      key: "guest-starter",
      title: "Guest starter",
      description: "Show me the exact format I should use in guest mode.",
      message: "Skill: React.js Interview Type: Technical Difficulty: Medium Company: Google",
    });
  }

  if (routeContext.routeLabel === "Live Session") {
    actions.push({
      key: "refine-live-answer",
      title: "Refine live answer",
      description: "Tighten an answer without changing its meaning before you submit it.",
      tool: "improve",
    });
  }

  return actions;
}

function buildPromptSuggestions(activeTool, routeContext, draft) {
  const skill = normalizeText(draft.skill) || routeContext.defaultSkill || "React.js";
  const type = toTitleCase(draft.interviewType || routeContext.interviewType || "technical");
  const difficulty = toTitleCase(draft.difficulty || routeContext.difficulty || "medium");

  if (activeTool === "question") {
    return [
      `Generate a ${difficulty} ${type} question on ${skill}.`,
      "Give me a follow-up interviewer question after I answer.",
      "Ask one coding interview question and tell me what interviewer expects.",
    ];
  }

  if (activeTool === "concept") {
    return [
      `Explain ${skill} in interview language with trade-offs.`,
      "Teach me this concept with one practical example.",
      "What follow-up questions can interviewer ask on this concept?",
    ];
  }

  if (activeTool === "feedback") {
    return [
      "Score my answer out of 10 and explain why.",
      "Tell me 3 strengths and 3 improvements in my answer.",
      "Give me an ideal answer in STAR format.",
    ];
  }

  if (activeTool === "improve") {
    return [
      "Refine my answer to sound confident and concise.",
      "Keep my meaning, but make this answer interview-ready.",
      "Rewrite this answer with better structure and impact.",
    ];
  }

  if (activeTool === "coaching") {
    return [
      "Create a 7-day plan for my weak interview areas.",
      "Coach me with one question at a time and evaluate me.",
      "Build a focused practice loop from my mistakes.",
    ];
  }

  return [
    `Ask me a realistic ${difficulty.toLowerCase()} ${type.toLowerCase()} question on ${skill}.`,
    "Review one of my interview answers and make it stronger.",
    "Help me improve communication and confidence for interviews.",
  ];
}

function buildStructuredSummary(toolKey, draft) {
  const skillLabel = normalizeText(draft.skill || draft.concept) || "this topic";
  const typeLabel = toTitleCase(draft.interviewType || "technical");
  const difficultyLabel = toTitleCase(draft.difficulty || "medium");

  if (toolKey === "question") {
    return `Generate a ${difficultyLabel.toLowerCase()} ${typeLabel.toLowerCase()} interview question for ${skillLabel}${draft.company ? ` at ${normalizeText(draft.company)}` : ""}.`;
  }

  if (toolKey === "concept") {
    return `Explain ${skillLabel} for a ${difficultyLabel.toLowerCase()} ${typeLabel.toLowerCase()} interview with practical trade-offs.`;
  }

  if (toolKey === "improve") {
    return `Refine my answer for ${normalizeText(draft.skill) || "this question"} without changing its meaning.`;
  }

  if (toolKey === "feedback") {
    return `Review my answer for ${normalizeText(draft.skill) || "this question"} like a real interviewer.`;
  }

  return `Create a coaching plan for ${normalizeText(draft.focus) || "my weakest topics"}.`;
}

function buildStructuredPayload(toolKey, draft, routeContext) {
  const focus = parseList(draft.focus);
  const commonPayload = {
    difficulty: normalizeText(draft.difficulty) || routeContext.difficulty,
    interviewType: normalizeText(draft.interviewType) || routeContext.interviewType,
    domain: normalizeText(draft.domain) || routeContext.domain,
    company: normalizeText(draft.company),
    focus,
  };

  if (toolKey === "question") {
    return {
      intent: "generate-question",
      skill: normalizeText(draft.skill),
      skills: parseList(draft.skill),
      message: buildStructuredSummary(toolKey, draft),
      ...commonPayload,
    };
  }

  if (toolKey === "concept") {
    return {
      intent: "explain-concept",
      concept: normalizeText(draft.concept) || normalizeText(draft.skill),
      skill: normalizeText(draft.skill),
      skills: parseList(draft.skill),
      message: buildStructuredSummary(toolKey, draft),
      ...commonPayload,
    };
  }

  if (toolKey === "improve") {
    return {
      intent: "improve-answer",
      question: normalizeText(draft.question),
      answer: draft.answer.trim(),
      skill: normalizeText(draft.skill),
      skills: parseList(draft.skill),
      message: buildStructuredSummary(toolKey, draft),
      ...commonPayload,
    };
  }

  if (toolKey === "feedback") {
    return {
      intent: "answer-feedback",
      question: normalizeText(draft.question),
      answer: draft.answer.trim(),
      skill: normalizeText(draft.skill),
      skills: parseList(draft.skill),
      message: buildStructuredSummary(toolKey, draft),
      ...commonPayload,
    };
  }

  return {
    intent: "weak-area-coaching",
    concept: normalizeText(draft.concept),
    skill: normalizeText(draft.skill),
    skills: parseList(draft.skill),
    message: buildStructuredSummary(toolKey, draft),
    ...commonPayload,
  };
}

function serializeMessage(message) {
  return {
    role: message.role,
    content: message.content,
    timestamp: message.timestamp,
    payload: message.payload || null,
    meta: message.meta || null,
    isError: Boolean(message.isError),
  };
}

function deserializeMessages(rawValue, fallbackMessage) {
  try {
    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
      return [fallbackMessage];
    }

    return parsedValue.map((message) => ({
      role: message.role || "assistant",
      content: message.content || "",
      timestamp: Number(message.timestamp) || Date.now(),
      payload: message.payload || null,
      meta: message.meta || null,
      isError: Boolean(message.isError),
    }));
  } catch {
    return [fallbackMessage];
  }
}

function normalizeMentorError(error) {
  const rawMessage = normalizeText(error?.message || "Request failed");

  if (/server initialization/i.test(rawMessage)) {
    return "The mentor service is still starting up. Try again in a few seconds.";
  }

  if (/failed to fetch/i.test(rawMessage)) {
    return "I could not reach the mentor backend. Check the deployment or your network and try again.";
  }

  return rawMessage || "Request failed";
}

function ToolBadge({ children, tone = "default" }) {
  const styles = {
    default: {
      background: "rgba(255,255,255,0.05)",
      color: "rgba(226,232,240,0.85)",
      border: "1px solid rgba(255,255,255,0.06)",
    },
    primary: {
      background: "rgba(59,130,246,0.1)",
      color: "#93c5fd",
      border: "1px solid rgba(59,130,246,0.18)",
      boxShadow: "0 0 8px rgba(59,130,246,0.06)",
    },
    success: {
      background: "rgba(34,197,94,0.1)",
      color: "#86efac",
      border: "1px solid rgba(34,197,94,0.18)",
      boxShadow: "0 0 8px rgba(34,197,94,0.06)",
    },
    warning: {
      background: "rgba(251,191,36,0.1)",
      color: "#fde68a",
      border: "1px solid rgba(251,191,36,0.18)",
      boxShadow: "0 0 8px rgba(251,191,36,0.06)",
    },
    danger: {
      background: "rgba(239,68,68,0.1)",
      color: "#fca5a5",
      border: "1px solid rgba(239,68,68,0.18)",
      boxShadow: "0 0 8px rgba(239,68,68,0.06)",
    },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 9.5,
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        transition: "all 0.25s ease",
        ...styles[tone],
      }}
    >
      {children}
    </span>
  );
}

function SectionBlock({ title, value }) {
  if (!normalizeText(value)) {
    return null;
  }

  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 14,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "rgba(148,163,184,0.95)",
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div style={{ color: "#dbe6f4", fontSize: 12.5, lineHeight: 1.6 }}>
        {parseMarkdownInline(value)}
      </div>
    </div>
  );
}

function ListBlock({ title, items = [], tone = "primary" }) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const toneMap = {
    primary: "rgba(59,130,246,0.12)",
    success: "rgba(34,197,94,0.12)",
  };

  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 14,
        background: toneMap[tone] || "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "rgba(148,163,184,0.95)",
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <ul
        style={{
          margin: 0,
          paddingLeft: 16,
          color: "#dbe6f4",
          fontSize: 12.5,
          lineHeight: 1.6,
        }}
      >
        {items.map((item, index) => (
          <li key={`${title}-${index}`} style={{ marginBottom: index === items.length - 1 ? 0 : 4 }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TemplateBlock({ template }) {
  if (!template || typeof template !== "object") {
    return null;
  }

  const entries = Object.entries(template).filter(([, value]) => normalizeText(value));

  if (entries.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 14,
        background: "rgba(15,23,42,0.65)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "rgba(148,163,184,0.95)",
          marginBottom: 8,
        }}
      >
        Suggested format
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {entries.map(([key, value]) => (
          <div
            key={key}
            style={{
              display: "grid",
              gridTemplateColumns: "88px 1fr",
              gap: 8,
              fontSize: 12,
            }}
          >
            <span style={{ color: "rgba(148,163,184,0.95)", fontWeight: 600 }}>
              {toTitleCase(key)}
            </span>
            <span style={{ color: "#f8fafc" }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewCard({ review }) {
  if (!review) {
    return null;
  }

  return (
    <div
      style={{
        padding: "12px 12px 14px",
        borderRadius: 16,
        background: "linear-gradient(180deg, rgba(59,130,246,0.12), rgba(15,23,42,0.35))",
        border: "1px solid rgba(59,130,246,0.18)",
        display: "grid",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(191,219,254,0.95)",
              marginBottom: 4,
            }}
          >
            Interview review
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>
            {Number.isFinite(review.score) ? `${review.score}/10` : "Scored"}
          </div>
        </div>
        {review.confidence ? (
          <ToolBadge tone="primary">{review.confidence} confidence</ToolBadge>
        ) : null}
      </div>
      <SectionBlock title="Feedback" value={review.feedback} />
      <SectionBlock title="Strength" value={review.strength} />
      <SectionBlock title="Improvement" value={review.improvement} />
      <SectionBlock title="Ideal answer" value={review.idealAnswer} />
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const payload = message.payload || {};
  const meta = message.meta || {};
  const profile = meta.profile || {};
  const fieldList = Array.isArray(payload.requiredFields) ? payload.requiredFields : [];
  const invalidSkills = Array.isArray(payload.invalidSkills) ? payload.invalidSkills : [];

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 18,
        animation: "chatFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: message.isError
              ? "linear-gradient(135deg, #ef4444, #f97316)"
              : "linear-gradient(135deg, #3b82f6, #06b6d4, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 800,
            flexShrink: 0,
            marginRight: 10,
            marginTop: 2,
            boxShadow: message.isError
              ? "0 0 12px rgba(239,68,68,0.25)"
              : "0 0 16px rgba(59,130,246,0.2)",
            color: "#fff",
            letterSpacing: "-0.02em",
          }}
        >
          {message.isError ? "!" : "AI"}
        </div>
      )}
      <div
        style={{
          maxWidth: "86%",
          padding: isUser ? "13px 16px" : "14px 16px 16px",
          borderRadius: isUser ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
          background: isUser
            ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #4f46e5 100%)"
            : "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
          border: isUser
            ? "none"
            : message.isError
              ? "1px solid rgba(239,68,68,0.2)"
              : "1px solid rgba(255,255,255,0.06)",
          color: "#e2e8f0",
          fontSize: 13.5,
          lineHeight: 1.65,
          wordBreak: "break-word",
          display: "grid",
          gap: isUser ? 6 : 12,
          boxShadow: isUser
            ? "0 4px 20px rgba(59,130,246,0.2)"
            : message.isError
              ? "0 2px 12px rgba(239,68,68,0.08)"
              : "0 2px 16px rgba(0,0,0,0.15)",
        }}
      >
        <div>{parseMarkdownInline(message.content)}</div>

        {!isUser && !message.isError ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {meta.mode ? (
              <ToolBadge tone={meta.mode === "personalized" ? "success" : "default"}>
                {meta.mode === "personalized" ? "Personalized" : "Guest"}
              </ToolBadge>
            ) : null}
            {meta.intent ? (
              <ToolBadge tone="primary">{formatIntentLabel(meta.intent)}</ToolBadge>
            ) : null}
            {meta.mentor ? (
              <ToolBadge tone="warning">{formatMentorSource(meta.mentor)}</ToolBadge>
            ) : null}
          </div>
        ) : null}

        {!isUser && fieldList.length > 0 ? (
          <ListBlock
            title="Required input"
            items={fieldList.map((field) => toTitleCase(field))}
            tone="success"
          />
        ) : null}

        {!isUser && invalidSkills.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
            }}
          >
            {invalidSkills.map((skill) => (
              <ToolBadge key={skill} tone="danger">
                Ignore: {skill}
              </ToolBadge>
            ))}
          </div>
        ) : null}

        {!isUser && payload.question ? (
          <SectionBlock title="Practice question" value={payload.question} />
        ) : null}
        {!isUser && payload.topic ? (
          <SectionBlock title="Topic" value={payload.topic} />
        ) : null}
        {!isUser && payload.review ? <ReviewCard review={payload.review} /> : null}
        {!isUser && payload.explanation ? (
          <SectionBlock title="Explanation" value={payload.explanation} />
        ) : null}
        {!isUser && payload.practicalExample ? (
          <SectionBlock title="Practical example" value={payload.practicalExample} />
        ) : null}
        {!isUser && payload.followUpQuestion ? (
          <SectionBlock title="Follow-up question" value={payload.followUpQuestion} />
        ) : null}
        {!isUser && payload.improvedAnswer ? (
          <SectionBlock title="Improved answer" value={payload.improvedAnswer} />
        ) : null}
        {!isUser && payload.template ? <TemplateBlock template={payload.template} /> : null}
        {!isUser && payload.practiceGuidance ? (
          <ListBlock title="Practice guidance" items={payload.practiceGuidance} tone="primary" />
        ) : null}
        {!isUser && payload.improvementTips ? (
          <ListBlock title="Improvement tips" items={payload.improvementTips} tone="success" />
        ) : null}
        {!isUser && !message.isError && profile?.weakAreas?.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {profile.weakAreas.slice(0, 3).map((item) => (
              <ToolBadge key={item} tone="warning">
                Weak: {item}
              </ToolBadge>
            ))}
          </div>
        ) : null}

        <div
          style={{
            fontSize: 10,
            color: isUser ? "rgba(255,255,255,0.64)" : "rgba(255,255,255,0.36)",
            marginTop: isUser ? 2 : 0,
            textAlign: isUser ? "right" : "left",
          }}
        >
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, animation: "chatFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #3b82f6, #06b6d4, #8b5cf6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 800,
          flexShrink: 0,
          color: "#fff",
          boxShadow: "0 0 20px rgba(59,130,246,0.25)",
          animation: "neuralPulse 2s ease-in-out infinite",
          letterSpacing: "-0.02em",
        }}
      >
        AI
      </div>
      <div
        style={{
          padding: "14px 20px",
          borderRadius: "20px 20px 20px 6px",
          background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
          border: "1px solid rgba(59,130,246,0.12)",
          display: "flex",
          gap: 6,
          alignItems: "center",
          boxShadow: "0 0 24px rgba(59,130,246,0.06)",
        }}
      >
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
              animation: `typingDot 1.4s ease-in-out ${index * 0.2}s infinite`,
              boxShadow: "0 0 6px rgba(59,130,246,0.3)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ContextRibbon({ authIdentity, routeContext, profileSummary, isOnline }) {
  const weakArea = profileSummary?.weakAreas?.[0];
  const strongArea = profileSummary?.strongAreas?.[0];
  const resumeSkill = profileSummary?.resumeSkills?.[0];
  const averageScore = Number.isFinite(profileSummary?.averageScore)
    ? Math.round(profileSummary.averageScore)
    : null;

  return (
    <div
      style={{
        padding: "10px 18px 10px",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        background: "linear-gradient(90deg, rgba(59,130,246,0.03) 0%, transparent 100%)",
        animation: "chatFadeIn 0.5s ease-out",
      }}
    >
      <ToolBadge tone={authIdentity ? "success" : "default"}>
        {authIdentity ? "Personalized" : "Guest"}
      </ToolBadge>
      <ToolBadge tone="primary">{routeContext.routeLabel}</ToolBadge>
      <ToolBadge tone="default">{toTitleCase(routeContext.interviewType)}</ToolBadge>
      <ToolBadge tone={isOnline ? "success" : "danger"}>
        {isOnline ? "Online" : "Offline"}
      </ToolBadge>
      {averageScore !== null ? <ToolBadge tone="warning">Avg {averageScore}</ToolBadge> : null}
      {resumeSkill ? <ToolBadge tone="primary">{resumeSkill}</ToolBadge> : null}
      {weakArea ? <ToolBadge tone="danger">Weak {weakArea}</ToolBadge> : null}
      {strongArea ? <ToolBadge tone="success">Strong {strongArea}</ToolBadge> : null}
    </div>
  );
}

function ToolPicker({ activeTool, onSelect }) {
  return (
    <div
      style={{
        padding: "14px 18px 4px",
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
        gap: 8,
        flexShrink: 0,
      }}
    >
      {TOOL_PRESETS.map((tool) => {
        const isActive = activeTool === tool.key;

        return (
          <button
            key={tool.key}
            type="button"
            onClick={() => onSelect(isActive ? "chat" : tool.key)}
            aria-pressed={isActive}
            title={tool.title}
            style={{
              borderRadius: 16,
              border: isActive
                ? "1px solid rgba(59,130,246,0.3)"
                : "1px solid rgba(255,255,255,0.05)",
              background: isActive
                ? "linear-gradient(180deg, rgba(59,130,246,0.14) 0%, rgba(15,23,42,0.25) 100%)"
                : "rgba(255,255,255,0.02)",
              color: isActive ? "#dbeafe" : "#94a3b8",
              padding: "12px 8px",
              cursor: "pointer",
              display: "grid",
              gap: 6,
              justifyItems: "center",
              minHeight: 72,
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: isActive ? "0 0 16px rgba(59,130,246,0.08)" : "none",
            }}
            onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#cbd5e1"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
            onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.transform = "translateY(0)"; } }}
          >
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: isActive
                  ? "linear-gradient(135deg, rgba(59,130,246,0.22), rgba(6,182,212,0.12))"
                  : "rgba(255,255,255,0.04)",
                fontSize: 12,
                fontWeight: 800,
                transition: "all 0.25s ease",
                boxShadow: isActive ? "0 0 10px rgba(59,130,246,0.12)" : "none",
              }}
            >
              {tool.icon}
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.02em" }}>{tool.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span
        style={{
          color: "rgba(203,213,225,0.9)",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.05)",
          color: "#e2e8f0",
          fontSize: 12.5,
          outline: "none",
        }}
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span
        style={{
          color: "rgba(203,213,225,0.9)",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.05)",
          color: "#e2e8f0",
          fontSize: 12.5,
          outline: "none",
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} style={{ color: "#0f172a" }}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({ label, value, onChange, placeholder, minHeight = 92 }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span
        style={{
          color: "rgba(203,213,225,0.9)",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          minHeight,
          resize: "vertical",
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.05)",
          color: "#e2e8f0",
          fontSize: 12.5,
          outline: "none",
          lineHeight: 1.5,
        }}
      />
    </label>
  );
}

function ToolWorkbench({
  activeTool,
  draft,
  routeContext,
  authIdentity,
  isLoading,
  onChange,
  onClose,
  onSubmit,
}) {
  if (activeTool === "chat") {
    return null;
  }

  const tool = TOOL_PRESETS.find((item) => item.key === activeTool);
  if (!tool) {
    return null;
  }

  return (
    <div
      style={{
        padding: "12px 14px 10px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "grid",
        gap: 10,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: "12px 12px 10px",
          borderRadius: 16,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "grid",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
              {tool.title}
            </div>
            <div style={{ color: "rgba(203,213,225,0.8)", fontSize: 12.5, lineHeight: 1.55 }}>
              {tool.description}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.55)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {activeTool === "question" ? (
          <>
            <Field
              label="Skill or technologies"
              value={draft.skill}
              onChange={(value) => onChange("skill", value)}
              placeholder={routeContext.defaultSkill || "React.js, Redux Toolkit"}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <SelectField
                label="Interview type"
                value={draft.interviewType}
                onChange={(value) => onChange("interviewType", value)}
                options={INTERVIEW_TYPE_OPTIONS}
              />
              <SelectField
                label="Difficulty"
                value={draft.difficulty}
                onChange={(value) => onChange("difficulty", value)}
                options={DIFFICULTY_OPTIONS}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Field
                label="Company"
                value={draft.company}
                onChange={(value) => onChange("company", value)}
                placeholder="Google, Amazon, Startup"
              />
              <Field
                label="Focus areas"
                value={draft.focus}
                onChange={(value) => onChange("focus", value)}
                placeholder="state management, performance"
              />
            </div>
          </>
        ) : null}

        {activeTool === "concept" ? (
          <>
            <Field
              label="Concept"
              value={draft.concept}
              onChange={(value) => onChange("concept", value)}
              placeholder="Closures, memoization, system design caching"
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Field
                label="Skill context"
                value={draft.skill}
                onChange={(value) => onChange("skill", value)}
                placeholder="React.js, Node.js"
              />
              <Field
                label="Focus areas"
                value={draft.focus}
                onChange={(value) => onChange("focus", value)}
                placeholder="performance, real-world use"
              />
            </div>
          </>
        ) : null}

        {activeTool === "improve" ? (
          <>
            <TextAreaField
              label="Original answer"
              value={draft.answer}
              onChange={(value) => onChange("answer", value)}
              placeholder="Paste the answer you want to improve..."
              minHeight={96}
            />
            <TextAreaField
              label="Question (optional)"
              value={draft.question}
              onChange={(value) => onChange("question", value)}
              placeholder="Paste the interviewer question for tighter refinement..."
              minHeight={74}
            />
            <Field
              label="Skill"
              value={draft.skill}
              onChange={(value) => onChange("skill", value)}
              placeholder="React.js, System Design"
            />
          </>
        ) : null}

        {activeTool === "feedback" ? (
          <>
            <TextAreaField
              label="Interview question"
              value={draft.question}
              onChange={(value) => onChange("question", value)}
              placeholder="Paste the actual interview question..."
              minHeight={74}
            />
            <TextAreaField
              label="Your answer"
              value={draft.answer}
              onChange={(value) => onChange("answer", value)}
              placeholder="Paste your answer for realistic scoring..."
              minHeight={96}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Field
                label="Skill"
                value={draft.skill}
                onChange={(value) => onChange("skill", value)}
                placeholder="React.js"
              />
              <SelectField
                label="Difficulty"
                value={draft.difficulty}
                onChange={(value) => onChange("difficulty", value)}
                options={DIFFICULTY_OPTIONS}
              />
            </div>
          </>
        ) : null}

        {activeTool === "coaching" ? (
          <>
            <Field
              label={authIdentity ? "Weak area or target topic" : "Practice topic"}
              value={draft.focus}
              onChange={(value) => onChange("focus", value)}
              placeholder={authIdentity ? "Redux performance, system design" : "React performance"}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Field
                label="Skill context"
                value={draft.skill}
                onChange={(value) => onChange("skill", value)}
                placeholder="React.js, Node.js"
              />
              <Field
                label="Company"
                value={draft.company}
                onChange={(value) => onChange("company", value)}
                placeholder="Optional"
              />
            </div>
          </>
        ) : null}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ color: "rgba(148,163,184,0.92)", fontSize: 11.5 }}>
            {authIdentity
              ? "Personalized mode will use your history and weak areas when possible."
              : "Guest mode works best when you provide a real skill, round, and difficulty."}
          </div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isLoading}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 800,
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.65 : 1,
              flexShrink: 0,
            }}
          >
            {isLoading ? "Thinking..." : "Run mentor"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatBotIcon() {
  const { pathname } = useLocation();
  const routeContext = useMemo(() => buildRouteContext(pathname), [pathname]);
  const [authIdentity, setAuthIdentity] = useState(() =>
    getAuthIdentity(getStoredAuthSession()),
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [activeTool, setActiveTool] = useState("chat");
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [draft, setDraft] = useState(() => buildInitialDraft(routeContext, authIdentity));
  const [profileSummary, setProfileSummary] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const storageKey = useMemo(() => buildStorageKey(authIdentity), [authIdentity]);
  const welcomeMessage = useMemo(
    () => buildWelcomeMessage({ authIdentity, routeContext }),
    [authIdentity, routeContext],
  );
  const [messages, setMessages] = useState([welcomeMessage]);

  const quickActions = useMemo(
    () => buildQuickActions({ authIdentity, routeContext, profileSummary }),
    [authIdentity, routeContext, profileSummary],
  );
  const promptSuggestions = useMemo(
    () => buildPromptSuggestions(activeTool, routeContext, draft),
    [activeTool, draft, routeContext],
  );

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

  useEffect(() => {
    const syncAuthState = () => {
      setAuthIdentity(getAuthIdentity(getStoredAuthSession()));
    };

    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, syncAuthState);
    window.addEventListener(AUTH_EXPIRED_EVENT, syncAuthState);

    return () => {
      window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, syncAuthState);
      window.removeEventListener(AUTH_EXPIRED_EVENT, syncAuthState);
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const storedValue = localStorage.getItem(storageKey);
    const restoredMessages = storedValue
      ? deserializeMessages(storedValue, welcomeMessage)
      : [welcomeMessage];

    setMessages(restoredMessages);

    const latestProfileMessage = [...restoredMessages]
      .reverse()
      .find((message) => message?.meta?.profile);

    setProfileSummary(latestProfileMessage?.meta?.profile || null);
  }, [storageKey, welcomeMessage]);

  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify(messages.slice(-MAX_STORED_MESSAGES).map(serializeMessage)),
    );
  }, [messages, storageKey]);

  useEffect(() => {
    setDraft((previous) => ({
      ...previous,
      skill: previous.skill || routeContext.defaultSkill,
      concept: previous.concept || routeContext.defaultSkill,
      focus: previous.focus || routeContext.starterFocus.join(", "),
      difficulty: previous.difficulty || routeContext.difficulty,
      interviewType: previous.interviewType || routeContext.interviewType,
      domain: previous.domain || routeContext.domain,
    }));
  }, [routeContext]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const appendAssistantMessage = useCallback((response) => {
    const assistantMessage = {
      role: "assistant",
      content:
        normalizeText(response?.data?.reply) ||
        "I received your request, but the response was empty.",
      timestamp: Date.now(),
      payload: response?.data || null,
      meta: {
        mode: response?.mode || "",
        intent: response?.intent || "",
        mentor: response?.mentor || "",
        profile: response?.profile || null,
      },
    };

    setMessages((previous) => [...previous, assistantMessage]);

    if (response?.profile) {
      setProfileSummary(response.profile);
    }

    if (!isOpen) {
      setHasUnread(true);
    }
  }, [isOpen]);

  const appendErrorMessage = useCallback((error) => {
    const assistantMessage = {
      role: "assistant",
      content: `I hit a problem: ${normalizeMentorError(error)}`,
      timestamp: Date.now(),
      isError: true,
    };

    setMessages((previous) => [...previous, assistantMessage]);

    if (!isOpen) {
      setHasUnread(true);
    }
  }, [isOpen]);

  const sendMentorRequest = useCallback(async ({ payload, userContent, resetComposer = false }) => {
    const trimmedUserContent = normalizeText(userContent);

    if (!trimmedUserContent || isLoading) {
      return;
    }

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: trimmedUserContent,
        timestamp: Date.now(),
      },
    ]);

    if (resetComposer) {
      setInputValue("");
    }

    setIsLoading(true);

    try {
      const response = await requestInterviewMentor(payload);
      appendAssistantMessage(response);
    } catch (error) {
      appendErrorMessage(error);
    } finally {
      setIsLoading(false);
    }
  }, [appendAssistantMessage, appendErrorMessage, isLoading]);

  const handleFreeformSubmit = useCallback(async (event) => {
    event.preventDefault();

    const trimmedInput = normalizeText(inputValue);
    if (!trimmedInput) {
      return;
    }

    const tool = TOOL_PRESETS.find((item) => item.key === activeTool);
    const payload = {
      message: trimmedInput,
      company: normalizeText(draft.company),
      difficulty: normalizeText(draft.difficulty) || routeContext.difficulty,
      interviewType: normalizeText(draft.interviewType) || routeContext.interviewType,
      domain: normalizeText(draft.domain) || routeContext.domain,
      focus: parseList(draft.focus),
      skill: normalizeText(draft.skill),
      skills: parseList(draft.skill),
      concept: activeTool === "concept" ? normalizeText(draft.concept) : "",
      question: ["feedback", "improve"].includes(activeTool)
        ? normalizeText(draft.question)
        : "",
      answer: ["feedback", "improve"].includes(activeTool) ? draft.answer.trim() : "",
      intent: tool ? tool.intent : "",
    };

    await sendMentorRequest({
      payload,
      userContent: trimmedInput,
      resetComposer: true,
    });
  }, [activeTool, draft, inputValue, routeContext, sendMentorRequest]);

  const handleStructuredSubmit = useCallback(async () => {
    const payload = buildStructuredPayload(activeTool, draft, routeContext);
    const userContent = buildStructuredSummary(activeTool, draft);

    await sendMentorRequest({
      payload,
      userContent,
    });
  }, [activeTool, draft, routeContext, sendMentorRequest]);

  const handleQuickAction = useCallback(async (action) => {
    if (action.message) {
      setInputValue(action.message);
      return;
    }

    if (action.tool) {
      setActiveTool(action.tool);

      if (action.tool === "question" && !normalizeText(draft.skill)) {
        setDraft((previous) => ({
          ...previous,
          skill: routeContext.defaultSkill,
        }));
      }
    }
  }, [draft.skill, routeContext.defaultSkill]);

  const handleDraftChange = useCallback((field, value) => {
    setDraft((previous) => ({
      ...previous,
      [field]: value,
    }));
  }, []);

  const handlePromptSuggestion = useCallback((value) => {
    setInputValue(value);
    if (!isOpen) {
      setIsOpen(true);
    }
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [isOpen]);

  const clearChat = useCallback(() => {
    const nextWelcomeMessage = buildWelcomeMessage({ authIdentity, routeContext });
    setMessages([
      {
        ...nextWelcomeMessage,
        timestamp: Date.now(),
        content: authIdentity
          ? "Chat cleared. I am ready to continue with personalized interview coaching."
          : "Chat cleared. Share a skill, interview type, and difficulty and I will coach from there.",
      },
    ]);
    setProfileSummary(null);
    setInputValue("");
    setActiveTool("chat");
  }, [authIdentity, routeContext]);

  const toggleChat = useCallback(() => {
    setIsOpen((previous) => !previous);
    setHasUnread(false);
  }, []);

  return (
    <>
      <div
        aria-hidden={!isOpen}
        onClick={toggleChat}
        style={{
          position: "fixed",
          inset: 0,
          background: "radial-gradient(ellipse at 70% 50%, rgba(59,130,246,0.06) 0%, rgba(2,6,23,0.62) 50%, rgba(2,6,23,0.78) 100%)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: 98,
          backdropFilter: isOpen ? "blur(4px)" : "none",
        }}
      />
      <div
        id="chatbot-panel"
        style={{
          position: "fixed",
          top: 16,
          bottom: 16,
          right: 16,
          width: isOpen ? PANEL_HALF_SCREEN_WIDTH : PANEL_WIDTH,
          maxWidth: isOpen ? "min(50vw, calc(100vw - 24px))" : "calc(100vw - 32px)",
          height: "calc(100vh - 32px)",
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? "translateX(0) scale(1)" : "translateX(40px) scale(0.96)",
          transformOrigin: "center right",
          transition: "all 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
          zIndex: 99,
          borderRadius: 28,
          overflow: "hidden",
          pointerEvents: isOpen ? "auto" : "none",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(170deg, rgba(15,23,42,0.96) 0%, rgba(8,12,28,0.98) 40%, rgba(5,8,22,0.99) 100%)",
          border: "1px solid rgba(100,140,255,0.12)",
          boxShadow: isOpen
            ? "0 40px 120px rgba(0,0,0,0.65), 0 0 80px rgba(59,130,246,0.08), inset 0 1px 0 rgba(255,255,255,0.06)"
            : "none",
          backdropFilter: "blur(40px) saturate(1.4)",
        }}
      >
        <div
          style={{
            padding: "20px 22px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            background: "linear-gradient(180deg, rgba(30,41,75,0.25) 0%, rgba(15,23,42,0.08) 100%)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 60%, #8b5cf6 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#fff",
                  boxShadow: "0 0 24px rgba(59,130,246,0.3), 0 0 8px rgba(6,182,212,0.2)",
                  letterSpacing: "-0.02em",
                }}
              >
                AI
              </div>
              <span
                style={{
                  position: "absolute",
                  inset: -3,
                  borderRadius: "50%",
                  border: "2px solid rgba(59,130,246,0.25)",
                  animation: isOnline ? "headerPulse 3s ease-in-out infinite" : "none",
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 300, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                AI Interview <span style={{ fontWeight: 700 }}>Mentor</span>
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: isOnline ? "rgba(74,222,128,0.9)" : "rgba(252,165,165,0.9)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 3,
                  fontWeight: 500,
                  letterSpacing: "0.01em",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: isOnline ? "#22c55e" : "#ef4444",
                    display: "inline-block",
                    boxShadow: isOnline ? "0 0 8px rgba(34,197,94,0.5)" : "0 0 8px rgba(239,68,68,0.5)",
                  }}
                />
                {authIdentity ? `Coaching ${authIdentity.displayName}` : "Guest mentoring"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={clearChat}
              title="Clear chat"
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.03)",
                color: "rgba(255,255,255,0.45)",
                cursor: "pointer",
                fontSize: 15,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
            >
              ↺
            </button>
            <button
              onClick={toggleChat}
              title="Close mentor"
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.03)",
                color: "rgba(255,255,255,0.45)",
                cursor: "pointer",
                fontSize: 17,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; e.currentTarget.style.color = "#fca5a5"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
            >
              ×
            </button>
          </div>
        </div>

        <ContextRibbon
          authIdentity={authIdentity}
          routeContext={routeContext}
          profileSummary={profileSummary}
          isOnline={isOnline}
        />

        <ToolPicker activeTool={activeTool} onSelect={setActiveTool} />

        <ToolWorkbench
          activeTool={activeTool}
          draft={draft}
          routeContext={routeContext}
          authIdentity={authIdentity}
          isLoading={isLoading}
          onChange={handleDraftChange}
          onClose={() => setActiveTool("chat")}
          onSubmit={handleStructuredSubmit}
        />

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 18px 14px",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.1) transparent",
          }}
        >
          {messages.map((message, index) => (
            <MessageBubble key={`${message.timestamp}-${index}`} message={message} />
          ))}
          {isLoading && <TypingIndicator />}

          {messages.length <= 2 && !isLoading ? (
            <div
              style={{
                display: "grid",
                gap: 10,
                marginTop: 4,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(148,163,184,0.95)",
                }}
              >
                Smart actions
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {quickActions.map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    onClick={() => handleQuickAction(action)}
                    style={{
                      textAlign: "left",
                      padding: "14px 16px",
                      borderRadius: 18,
                      border: "1px solid rgba(255,255,255,0.06)",
                      background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)",
                      color: "#e2e8f0",
                      cursor: "pointer",
                      display: "grid",
                      gap: 6,
                      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "rgba(59,130,246,0.2)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.2), 0 0 20px rgba(59,130,246,0.06)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>
                      {action.title}
                    </span>
                    <span style={{ fontSize: 12.5, color: "rgba(203,213,225,0.7)", lineHeight: 1.55 }}>
                      {action.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleFreeformSubmit}
          style={{
            padding: "16px 20px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            display: "grid",
            gap: 10,
            background: "linear-gradient(180deg, rgba(15,23,42,0.3) 0%, rgba(8,12,28,0.5) 100%)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              color: "rgba(148,163,184,0.95)",
              fontSize: 11.5,
              lineHeight: 1.5,
            }}
          >
            {activeTool === "chat"
              ? "Type naturally. I will infer whether you need a question, concept explanation, answer review, or coaching."
              : `Freeform mode is still active, but the current tool is ${formatIntentLabel(
                  TOOL_PRESETS.find((tool) => tool.key === activeTool)?.intent || "",
                )}.`}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 82, overflowY: "auto", paddingRight: 4 }}>
            {promptSuggestions.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handlePromptSuggestion(prompt)}
                style={{
                  border: "1px solid rgba(100,140,255,0.12)",
                  background: "rgba(15,23,42,0.6)",
                  color: "rgba(203,213,225,0.85)",
                  borderRadius: 999,
                  padding: "6px 12px",
                  fontSize: 11,
                  lineHeight: 1.4,
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  backdropFilter: "blur(8px)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)"; e.currentTarget.style.color = "#e2e8f0"; e.currentTarget.style.boxShadow = "0 0 12px rgba(59,130,246,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(100,140,255,0.12)"; e.currentTarget.style.color = "rgba(203,213,225,0.85)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                {prompt}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder={
                activeTool === "chat"
                  ? "Ask anything about interviews, weak areas, answers, or concepts..."
                  : `Ask in ${formatIntentLabel(
                      TOOL_PRESETS.find((tool) => tool.key === activeTool)?.intent || "",
                    )} mode...`
              }
              disabled={isLoading}
              aria-label="Chat with AI interview mentor"
              style={{
                flex: 1,
                padding: "14px 18px",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
                color: "#f1f5f9",
                fontSize: 13.5,
                outline: "none",
                transition: "all 0.3s ease",
                letterSpacing: "0.005em",
              }}
              onFocus={(e) => { e.target.style.borderColor = "rgba(59,130,246,0.35)"; e.target.style.boxShadow = "0 0 20px rgba(59,130,246,0.08), inset 0 0 12px rgba(59,130,246,0.04)"; e.target.style.background = "rgba(255,255,255,0.06)"; }}
              onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; e.target.style.background = "rgba(255,255,255,0.04)"; }}
            />
            <button
              type="submit"
              disabled={!normalizeText(inputValue) || isLoading}
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                border: "none",
                background: normalizeText(inputValue) && !isLoading
                  ? "linear-gradient(135deg, #3b82f6 0%, #06b6d4 60%, #8b5cf6 100%)"
                  : "rgba(255,255,255,0.05)",
                color: normalizeText(inputValue) && !isLoading
                  ? "#fff"
                  : "rgba(255,255,255,0.25)",
                cursor: normalizeText(inputValue) && !isLoading ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                flexShrink: 0,
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: normalizeText(inputValue) && !isLoading
                  ? "0 4px 20px rgba(59,130,246,0.25)"
                  : "none",
                transform: normalizeText(inputValue) && !isLoading ? "scale(1)" : "scale(0.95)",
              }}
            >
              ↗
            </button>
          </div>
        </form>
      </div>

      <div
        id="chatbot-fab"
        className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3"
        style={{
          opacity: isOpen ? 0.92 : 1,
        }}
      >
        {!isOpen ? (
          <div
            style={{
              opacity: isHovered ? 1 : 0,
              transform: isHovered ? "translateY(0) scale(1)" : "translateY(8px) scale(0.92)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              pointerEvents: "none",
            }}
            className="rounded-xl bg-slate-900/90 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-md border border-white/10"
          >
            Open AI Interview Mentor
          </div>
        ) : null}

        <button
          aria-label={isOpen ? "Close AI Interview Mentor" : "Open AI Interview Mentor"}
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
            transform: isHovered ? "scale(1.1)" : "scale(1)",
            transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          className="relative flex h-16 w-16 items-center justify-center rounded-full text-white cursor-pointer"
        >
          {!isOpen ? (
            <span
              className="absolute inset-0 rounded-full"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                animation: "chatbot-pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                opacity: 0.4,
              }}
            />
          ) : null}

          <span
            className="relative z-10"
            style={{
              fontSize: isOpen ? 28 : 22,
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            {isOpen ? "×" : "AI"}
          </span>

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

      <style>{`
        @keyframes chatbot-pulse {
          0%, 100% { transform: scale(1); opacity: 0.35; }
          50% { transform: scale(1.5); opacity: 0; }
        }

        @keyframes chatFadeIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); filter: blur(2px); }
          to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }

        @keyframes typingDot {
          0%, 80%, 100% { opacity: 0.25; transform: translateY(0) scale(0.9); }
          40% { opacity: 1; transform: translateY(-3px) scale(1.1); }
        }

        @keyframes neuralPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(59,130,246,0.25); }
          50% { box-shadow: 0 0 32px rgba(59,130,246,0.4), 0 0 12px rgba(6,182,212,0.2); }
        }

        @keyframes headerPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0; transform: scale(1.25); }
        }

        @keyframes ambientGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }

        #chatbot-panel::-webkit-scrollbar { width: 3px; }
        #chatbot-panel::-webkit-scrollbar-track { background: transparent; }
        #chatbot-panel::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.15); border-radius: 4px; }
        #chatbot-panel *::-webkit-scrollbar { width: 3px; }
        #chatbot-panel *::-webkit-scrollbar-track { background: transparent; }
        #chatbot-panel *::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }

        @media (max-width: 640px) {
          #chatbot-panel {
            top: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            max-width: 100vw !important;
            height: 100vh !important;
            border-radius: 0 !important;
            transform: ${isOpen ? "translateX(0) scale(1)" : "translateX(100%) scale(1)"} !important;
          }
        }
      `}</style>
    </>
  );
}
