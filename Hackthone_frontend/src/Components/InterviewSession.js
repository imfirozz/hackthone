import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getStoredAuthSession } from "../services/authApi";
import {
  fetchNextInterviewQuestion,
  requestInterviewMentor,
  submitInterviewAnswer,
  transcribeInterviewAudio,
  uploadResumeFile,
} from "../services/interviewApi";
import {
  buildFallbackInterviewConfig,
  buildInterviewRequestPayload,
  mergeResumeIntoInterviewConfig,
} from "../utils/interviewSessionConfig";

const MODE_META = {
  mock: { label: "Interview Session", track: "INTERVIEW", icon: "🎯" },
  technical: { label: "Technical Interview", track: "TECHNICAL", icon: "💻" },
  hr: { label: "HR Interview", track: "HR", icon: "🤝" },
};

const ANSWER_MODE_OPTIONS = [
  {
    id: "text",
    label: "Text Only",
    icon: "⌨️",
    desc: "Type every answer manually. Best fallback when microphone or transcript support is unreliable.",
  },
  {
    id: "hybrid",
    label: "Voice + Text",
    icon: "🎙️",
    desc: "Speak naturally, review the live transcript, and edit the final answer before you submit.",
  },
  {
    id: "voice",
    label: "Voice Only",
    icon: "🗣️",
    desc: "Run the interview hands-free and let the transcript capture your spoken answer.",
  },
];

const MENTOR_ACTIONS = [
  {
    id: "generate-question",
    label: "Practice Question",
    desc: "Get one realistic question matched to your current interview setup.",
  },
  {
    id: "explain-concept",
    label: "Explain a Concept",
    desc: "Break down a concept in interview language with examples and trade-offs.",
  },
  {
    id: "weak-area-coaching",
    label: "Weak Area Coaching",
    desc: "Use profile history or current focus areas to target the next practice block.",
  },
];

const formatMentorLabel = (value = "") =>
  String(value)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim();

function MentorPill({ children, tone = "neutral" }) {
  const paletteByTone = {
    neutral: {
      background: "rgba(255,255,255,0.06)",
      color: "rgba(255,255,255,0.7)",
      border: "1px solid rgba(255,255,255,0.08)",
    },
    accent: {
      background: "rgba(255,85,0,0.12)",
      color: "#FF5500",
      border: "1px solid rgba(255,85,0,0.18)",
    },
    success: {
      background: "rgba(34,197,94,0.14)",
      color: "#4ade80",
      border: "1px solid rgba(34,197,94,0.2)",
    },
  };
  const palette = paletteByTone[tone] || paletteByTone.neutral;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        ...palette,
      }}
    >
      {children}
    </span>
  );
}

function MentorResponsePanel({ response, error, isLoading, compact = false }) {
  if (!isLoading && !error && !response?.data) {
    return null;
  }

  if (isLoading) {
    return (
      <div
        style={{
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          padding: compact ? 14 : 18,
          color: "rgba(255,255,255,0.72)",
          fontSize: compact ? 12 : 13,
          lineHeight: 1.6,
        }}
      >
        AI mentor is preparing a tailored coaching response...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          borderRadius: 12,
          border: "1px solid rgba(248,113,113,0.35)",
          background: "rgba(127,29,29,0.28)",
          padding: compact ? 14 : 18,
          color: "#fecaca",
          fontSize: compact ? 12 : 13,
          lineHeight: 1.6,
        }}
      >
        {error}
      </div>
    );
  }

  const data = response?.data || {};
  const profile = response?.profile || {};
  const practiceGuidance = Array.isArray(data.practiceGuidance) ? data.practiceGuidance : [];
  const improvementTips = Array.isArray(data.improvementTips) ? data.improvementTips : [];
  const weakAreas = Array.isArray(profile.weakAreas) ? profile.weakAreas.slice(0, 4) : [];
  const strongAreas = Array.isArray(profile.strongAreas) ? profile.strongAreas.slice(0, 3) : [];
  const invalidSkills = Array.isArray(data.invalidSkills) ? data.invalidSkills : [];
  const requiredFields = Array.isArray(data.requiredFields) ? data.requiredFields : [];
  const hasReview = Boolean(data.review);

  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
        padding: compact ? 14 : 18,
        display: "grid",
        gap: compact ? 10 : 12,
        textAlign: "left",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 6px",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.12em",
              color: "#FF5500",
              textTransform: "uppercase",
            }}
          >
            AI Interview Mentor
          </p>
          <p
            style={{
              margin: 0,
              fontSize: compact ? 13 : 14,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {response?.mode === "personalized" ? "Personalized coaching" : "Guest coaching"}
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {response?.intent ? <MentorPill tone="accent">{formatMentorLabel(response.intent)}</MentorPill> : null}
          {response?.mentor ? <MentorPill>{response.mentor}</MentorPill> : null}
          {typeof profile.averageScore === "number" ? (
            <MentorPill tone="success">Avg {Math.round(profile.averageScore)}</MentorPill>
          ) : null}
        </div>
      </div>

      {data.reply ? (
        <p
          style={{
            margin: 0,
            fontSize: compact ? 12 : 13,
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.76)",
          }}
        >
          {data.reply}
        </p>
      ) : null}

      {requiredFields.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {requiredFields.map((field) => (
            <MentorPill key={field}>{field}</MentorPill>
          ))}
        </div>
      ) : null}

      {invalidSkills.length > 0 ? (
        <p
          style={{
            margin: 0,
            fontSize: compact ? 11 : 12,
            color: "#fca5a5",
            lineHeight: 1.6,
          }}
        >
          Ignored invalid skills: {invalidSkills.join(", ")}
        </p>
      ) : null}

      {data.question ? (
        <div
          style={{
            borderRadius: 10,
            border: "1px solid rgba(255,85,0,0.18)",
            background: "rgba(255,85,0,0.05)",
            padding: compact ? 12 : 14,
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.12em",
              color: "#FF5500",
              textTransform: "uppercase",
            }}
          >
            Practice Question
          </p>
          <p style={{ margin: 0, fontSize: compact ? 12 : 13, lineHeight: 1.7, color: "#fff" }}>
            {data.question}
          </p>
          {data.topic ? (
            <div style={{ marginTop: 10 }}>
              <MentorPill>{data.topic}</MentorPill>
            </div>
          ) : null}
        </div>
      ) : null}

      {data.explanation ? (
        <div>
          <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#fff" }}>Explanation</p>
          <p style={{ margin: 0, fontSize: compact ? 12 : 13, lineHeight: 1.7, color: "rgba(255,255,255,0.76)" }}>
            {data.explanation}
          </p>
        </div>
      ) : null}

      {data.practicalExample ? (
        <div>
          <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#fff" }}>Practical Example</p>
          <p style={{ margin: 0, fontSize: compact ? 12 : 13, lineHeight: 1.7, color: "rgba(255,255,255,0.76)" }}>
            {data.practicalExample}
          </p>
        </div>
      ) : null}

      {data.followUpQuestion ? (
        <div>
          <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#fff" }}>Follow-up</p>
          <p style={{ margin: 0, fontSize: compact ? 12 : 13, lineHeight: 1.7, color: "rgba(255,255,255,0.76)" }}>
            {data.followUpQuestion}
          </p>
        </div>
      ) : null}

      {data.improvedAnswer ? (
        <div
          style={{
            borderRadius: 10,
            border: "1px solid rgba(34,197,94,0.18)",
            background: "rgba(34,197,94,0.06)",
            padding: compact ? 12 : 14,
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.12em",
              color: "#4ade80",
              textTransform: "uppercase",
            }}
          >
            Improved Answer
          </p>
          <p style={{ margin: 0, fontSize: compact ? 12 : 13, lineHeight: 1.7, color: "#fff" }}>
            {data.improvedAnswer}
          </p>
        </div>
      ) : null}

      {hasReview ? (
        <div
          style={{
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
            padding: compact ? 12 : 14,
            display: "grid",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <MentorPill tone="accent">Score {data.review.score ?? "-"}</MentorPill>
            {data.review.confidence ? <MentorPill>{data.review.confidence}</MentorPill> : null}
          </div>
          {data.review.feedback ? (
            <p style={{ margin: 0, fontSize: compact ? 12 : 13, lineHeight: 1.7, color: "#fff" }}>
              {data.review.feedback}
            </p>
          ) : null}
          {data.review.strength ? (
            <p style={{ margin: 0, fontSize: compact ? 12 : 13, lineHeight: 1.7, color: "rgba(255,255,255,0.76)" }}>
              <strong>Strength:</strong> {data.review.strength}
            </p>
          ) : null}
          {data.review.improvement ? (
            <p style={{ margin: 0, fontSize: compact ? 12 : 13, lineHeight: 1.7, color: "rgba(255,255,255,0.76)" }}>
              <strong>Improvement:</strong> {data.review.improvement}
            </p>
          ) : null}
          {data.review.idealAnswer ? (
            <p style={{ margin: 0, fontSize: compact ? 12 : 13, lineHeight: 1.7, color: "rgba(255,255,255,0.76)" }}>
              <strong>Ideal Answer:</strong> {data.review.idealAnswer}
            </p>
          ) : null}
        </div>
      ) : null}

      {practiceGuidance.length > 0 ? (
        <div>
          <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#fff" }}>Practice Guidance</p>
          <ul style={{ margin: 0, paddingLeft: 18, color: "rgba(255,255,255,0.76)", fontSize: compact ? 12 : 13, lineHeight: 1.7 }}>
            {practiceGuidance.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {improvementTips.length > 0 ? (
        <div>
          <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#fff" }}>Improvement Tips</p>
          <ul style={{ margin: 0, paddingLeft: 18, color: "rgba(255,255,255,0.76)", fontSize: compact ? 12 : 13, lineHeight: 1.7 }}>
            {improvementTips.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {weakAreas.length > 0 || strongAreas.length > 0 ? (
        <div style={{ display: "grid", gap: 8 }}>
          {weakAreas.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {weakAreas.map((item) => (
                <MentorPill key={`weak-${item}`}>{item}</MentorPill>
              ))}
            </div>
          ) : null}
          {strongAreas.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {strongAreas.map((item) => (
                <MentorPill key={`strong-${item}`} tone="success">
                  {item}
                </MentorPill>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function supportsVoiceTranscription() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(
    window.navigator?.mediaDevices?.getUserMedia &&
      window.MediaRecorder &&
      (window.AudioContext || window.webkitAudioContext),
  );
}

function getDefaultResponseMode() {
  return supportsVoiceTranscription() ? "hybrid" : "text";
}

function getSupportedRecordingMimeType() {
  if (
    typeof window === "undefined" ||
    typeof window.MediaRecorder === "undefined" ||
    typeof window.MediaRecorder.isTypeSupported !== "function"
  ) {
    return "";
  }

  const preferredTypes = [
    "audio/webm;codecs=opus",
    "audio/ogg;codecs=opus",
    "audio/webm",
    "audio/ogg",
  ];

  return preferredTypes.find((mimeType) => window.MediaRecorder.isTypeSupported(mimeType)) || "";
}

function writeAsciiString(view, offset, value) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function interleaveChannelData(channels = []) {
  if (channels.length === 1) {
    return channels[0];
  }

  const frameLength = channels[0]?.length || 0;
  const interleaved = new Float32Array(frameLength * channels.length);
  let offset = 0;

  for (let frameIndex = 0; frameIndex < frameLength; frameIndex += 1) {
    for (let channelIndex = 0; channelIndex < channels.length; channelIndex += 1) {
      interleaved[offset] = channels[channelIndex][frameIndex];
      offset += 1;
    }
  }

  return interleaved;
}

function convertAudioBufferToWavBlob(audioBuffer) {
  const channelData = Array.from({ length: audioBuffer.numberOfChannels }, (_unused, index) =>
    audioBuffer.getChannelData(index),
  );
  const interleaved = interleaveChannelData(channelData);
  const bytesPerSample = 2;
  const blockAlign = audioBuffer.numberOfChannels * bytesPerSample;
  const byteRate = audioBuffer.sampleRate * blockAlign;
  const dataSize = interleaved.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAsciiString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAsciiString(view, 8, "WAVE");
  writeAsciiString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, audioBuffer.numberOfChannels, true);
  view.setUint32(24, audioBuffer.sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAsciiString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let index = 0; index < interleaved.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, interleaved[index]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

async function convertRecordedBlobToWavFile(recordedBlob) {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContextConstructor();

  try {
    const arrayBuffer = await recordedBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const wavBlob = convertAudioBufferToWavBlob(audioBuffer);

    return new File([wavBlob], `interview-answer-${Date.now()}.wav`, {
      type: "audio/wav",
    });
  } finally {
    await audioContext.close().catch(() => {});
  }
}

function pickNaturalVoice() {
  if (!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices?.length) return null;

  const indianMaleHints = [
    /Ravi/i,
    /Prabhat/i,
    /Aarav/i,
    /Karan/i,
    /Male/i,
    /Man/i,
    /Google English India/i,
    /Microsoft.*India/i,
  ];
  const naturalHints = [/Neural/i, /Natural/i, /Premium/i, /Enhanced/i];

  const indianLocalMale = voices.find(
    (voice) =>
      voice.localService &&
      voice.lang?.toLowerCase().startsWith("en-in") &&
      indianMaleHints.some((pattern) => pattern.test(voice.name)),
  );
  if (indianLocalMale) return indianLocalMale;

  const indianMaleNatural = voices.find(
    (voice) =>
      voice.localService &&
      voice.lang?.toLowerCase().startsWith("en-in") &&
      indianMaleHints.some((pattern) => pattern.test(voice.name)) &&
      naturalHints.some((pattern) => pattern.test(voice.name)),
  );
  if (indianMaleNatural) return indianMaleNatural;

  const indianMaleAny = voices.find(
    (voice) =>
      voice.lang?.toLowerCase().startsWith("en-in") &&
      indianMaleHints.some((pattern) => pattern.test(voice.name)),
  );
  if (indianMaleAny) return indianMaleAny;

  const indianAny = voices.find((voice) => voice.lang?.toLowerCase().startsWith("en-in"));
  if (indianAny) return indianAny;

  const enUS = voices.find((voice) => voice.lang?.toLowerCase().startsWith("en-us"));
  const enAny = voices.find((voice) => voice.lang?.toLowerCase().startsWith("en"));
  return enUS || enAny || voices[0];
}

function toNaturalSpeechText(text) {
  if (!text) return "";

  return text
    .replace(/\s+/g, " ")
    .replace(/\s*[:;]\s*/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function getVoiceLockLabel() {
  const selectedVoice = pickNaturalVoice();
  return selectedVoice?.name
    ? `${selectedVoice.name} (${selectedVoice.lang || "unknown"})`
    : "No voice detected";
}

function speakText(text, onEnd) {
  if (!window.speechSynthesis) return null;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(toNaturalSpeechText(text));
  const selectedVoice = pickNaturalVoice();
  utterance.voice = selectedVoice;
  utterance.rate = 0.9;
  utterance.pitch = 0.9;
  utterance.volume = 1;
  utterance.lang = "en-IN";
  utterance.voiceURI = utterance.voice?.voiceURI || "";

  if (onEnd) {
    utterance.onend = onEnd;
  }

  window.speechSynthesis.speak(utterance);
  return selectedVoice;
}

function stopSpeaking() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

function SplineOrb() {
  const splineRef = useRef(null);

  useEffect(() => {
    const container = splineRef.current;
    if (!container) return;

    // Try to load Spline as a background enhancement
    try {
      container.innerHTML = "";
      const viewer = document.createElement("spline-viewer");
      viewer.setAttribute("url", "https://prod.spline.design/k78XjvdTnIDSn02B/scene.splinecode");
      viewer.style.cssText = "display:block;width:100%;height:100%;position:absolute;inset:0;z-index:1;";
      container.appendChild(viewer);
    } catch (_) {
      // Spline failed to load — the image fallback will show
    }
  }, []);

  return (
    <div className="arena-spline-viewer" style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Spline background layer */}
      <div ref={splineRef} style={{ position: "absolute", inset: 0, zIndex: 1 }} />
    </div>
  );
}

function useTimer() {
  const [seconds, setSeconds] = useState(0);
  const running = useRef(true);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (running.current) {
        setSeconds((value) => value + 1);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const pause = () => {
    running.current = false;
  };

  const resume = () => {
    running.current = true;
  };

  const reset = () => {
    setSeconds(0);
  };

  return {
    seconds,
    fmt: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`,
    pause,
    resume,
    reset,
  };
}

function useMetrics(answer) {
  const words = (answer || "").trim().split(/\s+/).filter(Boolean).length;
  const clarity = Math.min(99, 60 + Math.floor(words * 1.2));
  const pace = Math.min(99, 55 + Math.floor(words * 0.8));
  const signal = Math.min(99, 45 + Math.floor(words * 1.5));
  return { clarity, pace, signal, words };
}

const cleanText = (value = "") => String(value).replace(/\s+/g, " ").trim();
const uniqueList = (values = []) =>
  values.reduce((items, value) => {
    const normalizedValue = cleanText(value);

    if (
      normalizedValue &&
      !items.some((item) => item.toLowerCase() === normalizedValue.toLowerCase())
    ) {
      items.push(normalizedValue);
    }

    return items;
  }, []);
const parseSkillsInput = (value = "") =>
  uniqueList(
    String(value)
      .split(/,|;|\||\n/)
      .map((item) => cleanText(item))
      .filter(Boolean),
  );

const isMeaningfulAnswer = (value = "") =>
  !/^(Skipped by candidate\.?|No answer provided\.?)$/i.test(cleanText(value));

function buildUserProfile() {
  const session = getStoredAuthSession();
  const user = session?.user || {};
  const displayName =
    cleanText(user.name) ||
    cleanText([user.firstName, user.lastName].filter(Boolean).join(" ")) ||
    cleanText(user.email?.split("@")[0]) ||
    "User";

  return {
    displayName,
    avatarUrl: cleanText(user.avatarUrl || user.photoURL || ""),
    initial: displayName.charAt(0).toUpperCase() || "U",
  };
}

function getTrackLabel(config = {}, fallbackTrack = "INTERVIEW") {
  const normalizedRound = cleanText(config.round).toLowerCase();
  const normalizedDomain = cleanText(config.domain).toUpperCase();

  if (normalizedRound === "hr") {
    return "HR";
  }

  if (normalizedRound === "managerial") {
    return "MANAGERIAL";
  }

  if (normalizedDomain && normalizedDomain !== "GENERAL") {
    return normalizedDomain;
  }

  return fallbackTrack;
}

function createInterviewSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `frontend-${crypto.randomUUID()}`;
  }

  return `frontend-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export default function InterviewSession({ mode = "mock" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const routeInterview = location.state?.interview || null;
  const hasPresetConfig = Boolean(routeInterview);
  const activeMode = routeInterview?.mode || mode || "mock";
  const meta = MODE_META[activeMode] || MODE_META.mock;
  const timer = useTimer();
  const baseFallbackInterview = useMemo(
    () => buildFallbackInterviewConfig(activeMode),
    [activeMode],
  );
  const iv = useMemo(
    () => ({
      ...baseFallbackInterview,
      ...(routeInterview || {}),
      skills: Array.isArray(routeInterview?.skills)
        ? routeInterview.skills
        : baseFallbackInterview.skills,
      focus: Array.isArray(routeInterview?.focus)
        ? routeInterview.focus
        : baseFallbackInterview.focus,
    }),
    [baseFallbackInterview, routeInterview],
  );
  const userProfile = useMemo(() => buildUserProfile(), []);
  const authSession = useMemo(() => getStoredAuthSession(), []);
  const authUser = authSession?.user || {};
  const isLoggedIn = useMemo(
    () =>
      Boolean(
        authSession?.token &&
          (authUser?._id || authUser?.id || authUser?.email || authUser?.name),
      ),
    [authSession, authUser],
  );
  const hasProfileData = useMemo(
    () =>
      Boolean(
        cleanText(authUser?.name) ||
          cleanText(authUser?.firstName) ||
          cleanText(authUser?.lastName) ||
          cleanText(authUser?.email),
      ),
    [authUser],
  );
  const defaultSetupMode = isLoggedIn ? "profile" : "manual";
  const voiceFeaturesSupported = useMemo(() => supportsVoiceTranscription(), []);
  const totalQuestions = Math.max(1, Number(iv.questions) || 8);
  const sessionIdentityKey = `${activeMode}:${iv.title}:${iv.company}:${iv.round}:${iv.domain}`;

  const [phase, setPhase] = useState("prep");
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [currentDifficulty, setCurrentDifficulty] = useState(iv.difficulty);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [sessionError, setSessionError] = useState("");
  const [activeConfig, setActiveConfig] = useState(iv);
  const [responseMode, setResponseMode] = useState(() => getDefaultResponseMode());
  const [expandedReview, setExpandedReview] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSplineExpanded, setIsSplineExpanded] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [voiceLockLabel, setVoiceLockLabel] = useState("Detecting voice...");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeFileName, setResumeFileName] = useState("");
  const [resumeInsights, setResumeInsights] = useState(null);
  const [resumeParser, setResumeParser] = useState("");
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [isTranscribingVoice, setIsTranscribingVoice] = useState(false);
  const [mentorIntent, setMentorIntent] = useState("generate-question");
  const [mentorPrompt, setMentorPrompt] = useState("");
  const [mentorResponse, setMentorResponse] = useState(null);
  const [mentorError, setMentorError] = useState("");
  const [isMentorLoading, setIsMentorLoading] = useState(false);
  const [mentorTargetKey, setMentorTargetKey] = useState("");
  const [interviewSetupMode, setInterviewSetupMode] = useState(defaultSetupMode);
  const [manualSetup, setManualSetup] = useState(() => ({
    company: hasPresetConfig ? cleanText(iv.company) : "",
    domain: hasPresetConfig ? cleanText(iv.domain) : "",
    skillsText: hasPresetConfig ? uniqueList(iv.skills || []).join(", ") : "",
    interviewType: hasPresetConfig ? cleanText(iv.round) : "",
    difficulty: hasPresetConfig ? cleanText(iv.difficulty) : "",
  }));
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const userVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const resumeInputRef = useRef(null);

  useEffect(() => {
    stopSpeaking();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    timer.pause();
    timer.reset();
    setPhase("prep");
    setCurrentQuestion(null);
    setCurrentQuestionNumber(1);
    setCurrentDifficulty(iv.difficulty);
    setCurrentAnswer("");
    setCurrentTranscript("");
    setAnsweredQuestions([]);
    setSessionId("");
    setSessionError("");
    setActiveConfig(iv);
    setResponseMode(getDefaultResponseMode());
    setExpandedReview(null);
    setResumeFile(null);
    setResumeFileName("");
    setResumeInsights(null);
    setResumeParser("");
    setIsTranscribingVoice(false);
    setMentorIntent("generate-question");
    setMentorPrompt("");
    setMentorResponse(null);
    setMentorError("");
    setIsMentorLoading(false);
    setMentorTargetKey("");
    setInterviewSetupMode(defaultSetupMode);
    setManualSetup({
      company: hasPresetConfig ? cleanText(iv.company) : "",
      domain: hasPresetConfig ? cleanText(iv.domain) : "",
      skillsText: hasPresetConfig ? uniqueList(iv.skills || []).join(", ") : "",
      interviewType: hasPresetConfig ? cleanText(iv.round) : "",
      difficulty: hasPresetConfig ? cleanText(iv.difficulty) : "",
    });
  }, [iv, sessionIdentityKey]);

  useEffect(() => {
    if (phase === "interview") {
      timer.resume();
      return;
    }

    timer.pause();
  }, [phase]);

  useEffect(() => {
    return () => {
      stopSpeaking();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!window.speechSynthesis) {
      setVoiceLockLabel("Speech synthesis not supported");
      return;
    }

    const syncVoiceLabel = () => setVoiceLockLabel(getVoiceLockLabel());
    syncVoiceLabel();
    window.speechSynthesis.onvoiceschanged = syncVoiceLabel;

    return () => {
      if (window.speechSynthesis.onvoiceschanged === syncVoiceLabel) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function startCameraPreview() {
      if (!isSplineExpanded || !cameraEnabled || !navigator.mediaDevices?.getUserMedia) {
        if (cameraStreamRef.current) {
          cameraStreamRef.current.getTracks().forEach((track) => track.stop());
          cameraStreamRef.current = null;
        }
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = null;
        }
        setCameraReady(false);
        setCameraError("");
        return;
      }

      try {
        if (cameraStreamRef.current) {
          cameraStreamRef.current.getTracks().forEach((track) => track.stop());
          cameraStreamRef.current = null;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        cameraStreamRef.current = stream;
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
          await userVideoRef.current.play().catch(() => {});
        }
        setCameraReady(stream.getVideoTracks().some((track) => track.readyState === "live"));
        setCameraError("");
      } catch {
        setCameraReady(false);
        setCameraError("Camera unavailable");
      }
    }

    startCameraPreview();

    return () => {
      mounted = false;
    };
  }, [isSplineExpanded, cameraEnabled]);

  const metrics = useMetrics(currentTranscript || currentAnswer);
  const progress = Math.min(100, (currentQuestionNumber / totalQuestions) * 100);
  const trackLabel = getTrackLabel(activeConfig, meta.track);
  const responseModeAllowsVoice = responseMode === "voice" || responseMode === "hybrid";
  const responseModeAllowsTyping = responseMode !== "voice";
  const transcriptPanelLabel = responseModeAllowsVoice ? "LIVE VOICE TRANSCRIPT" : "ANSWER PREVIEW";
  const transcriptEmptyState = responseModeAllowsVoice
    ? isRecording
      ? "Recording... stop the capture to generate the transcript."
      : isTranscribingVoice
        ? "Transcribing your voice answer..."
        : "Start recording to capture your answer."
    : "Type to preview your answer here...";
  const textAreaPlaceholder =
    responseMode === "text"
      ? "Type your answer here."
      : responseMode === "hybrid"
        ? "Speak or type your answer. You can edit it before submitting."
        : "Speak your answer. The transcript will appear here automatically.";
  const textAreaValue = responseModeAllowsTyping
    ? isRecording
      ? currentTranscript
      : currentAnswer
    : currentTranscript || currentAnswer;
  const flattenedResumeSkills = useMemo(() => {
    if (!resumeInsights) {
      return [];
    }

    return uniqueList([
      ...(resumeInsights.languages || []),
      ...(resumeInsights.frameworks || []),
      ...(resumeInsights.tools || []),
      ...(resumeInsights.concepts || []),
    ]);
  }, [resumeInsights]);
  const resumeTags = useMemo(() => flattenedResumeSkills.slice(0, 10), [flattenedResumeSkills]);
  const resumeSections = useMemo(
    () =>
      [
        { label: "Languages", values: resumeInsights?.languages || [] },
        { label: "Frameworks", values: resumeInsights?.frameworks || [] },
        { label: "Tools", values: resumeInsights?.tools || [] },
        { label: "Concepts", values: resumeInsights?.concepts || [] },
      ].filter((section) => section.values.length > 0),
    [resumeInsights],
  );
  const resumeReadyForProfile = Boolean(resumeFileName && flattenedResumeSkills.length > 0);
  const normalizedManualSetup = useMemo(() => {
    const interviewType = cleanText(manualSetup.interviewType).toLowerCase();
    const difficulty = cleanText(manualSetup.difficulty).toLowerCase();
    return {
      company: cleanText(manualSetup.company),
      domain: cleanText(manualSetup.domain).toLowerCase(),
      interviewType,
      difficulty,
      skills: parseSkillsInput(manualSetup.skillsText),
    };
  }, [manualSetup]);
  const manualValidation = useMemo(() => {
    const missing = {
      domain: !normalizedManualSetup.domain,
      skills: normalizedManualSetup.skills.length === 0,
      interviewType: !["technical", "hr", "managerial"].includes(normalizedManualSetup.interviewType),
      difficulty: !["easy", "medium", "hard"].includes(normalizedManualSetup.difficulty),
    };
    const missingLabels = [];
    if (missing.domain) missingLabels.push("role/domain");
    if (missing.skills) missingLabels.push("at least one skill");
    if (missing.interviewType) missingLabels.push("interview type");
    if (missing.difficulty) missingLabels.push("difficulty");
    return {
      isValid: missingLabels.length === 0,
      missing,
      message:
        missingLabels.length > 0
          ? `Complete required setup: ${missingLabels.join(", ")}.`
          : "",
    };
  }, [normalizedManualSetup]);
  const profileValidation = useMemo(() => {
    if (!isLoggedIn) {
      return {
        isValid: false,
        message: "Login is required before using resume/profile interview mode.",
      };
    }
    if (!hasProfileData) {
      return {
        isValid: false,
        message: "Complete your profile before starting an interview.",
      };
    }
    if (!resumeReadyForProfile) {
      return {
        isValid: false,
        message:
          "Upload your resume and complete your profile before starting a personalized interview.",
      };
    }
    return { isValid: true, message: "" };
  }, [hasProfileData, isLoggedIn, resumeReadyForProfile]);
  const canStartInterview =
    !isBootstrapping &&
    !isUploadingResume &&
    (isLoggedIn
      ? interviewSetupMode === "profile"
        ? profileValidation.isValid
        : manualValidation.isValid
      : manualValidation.isValid);
  const startValidationMessage = isLoggedIn
    ? interviewSetupMode === "profile"
      ? profileValidation.message
      : manualValidation.message
    : manualValidation.message;
  const mentorSkillPool = useMemo(
    () => uniqueList([...(activeConfig.skills || []), ...flattenedResumeSkills]).slice(0, 10),
    [activeConfig.skills, flattenedResumeSkills],
  );
  const mentorFocusAreas = useMemo(
    () =>
      uniqueList([
        ...(activeConfig.focus || []),
        ...(resumeInsights?.concepts || []),
        ...answeredQuestions.map((entry) => cleanText(entry.topic)).filter(Boolean),
      ]).slice(0, 8),
    [activeConfig.focus, answeredQuestions, resumeInsights],
  );
  const isBusy = isBootstrapping || isSubmittingAnswer || isTranscribingVoice;
  const canSubmitCurrentAnswer = !isBusy && !isRecording;
  const mentorPromptMeta =
    mentorIntent === "explain-concept"
      ? {
          title: "Concept or topic",
          placeholder: "Example: When would you use Redux Toolkit selectors to prevent unnecessary re-renders?",
        }
      : mentorIntent === "weak-area-coaching"
        ? {
            title: "Optional coaching note",
            placeholder: "Example: I struggle to explain trade-offs clearly under pressure.",
          }
        : {
            title: "Optional prompt",
            placeholder: "Example: Push me on React performance and state management for a startup frontend round.",
          };

  const speakQuestion = useCallback(() => {
    if (!currentQuestion?.question) return;

    setIsSpeaking(true);
    const selectedVoice = speakText(currentQuestion.question, () => {
      setIsSpeaking(false);
    });

    if (selectedVoice?.name) {
      setVoiceLockLabel(`${selectedVoice.name} (${selectedVoice.lang || "unknown"})`);
    }
  }, [currentQuestion]);

  useEffect(() => {
    if (phase === "interview" && currentQuestion?.question) {
      speakQuestion();
    }
  }, [phase, currentQuestion, speakQuestion]);

  const startRecording = async () => {
    setSessionError("");

    if (!responseModeAllowsVoice) {
      setSessionError("Switch the answer mode to Voice or Voice + Text to use the microphone.");
      return;
    }

    if (!micEnabled) {
      setSessionError("Mic is turned off. Enable it first or switch to Text mode.");
      return;
    }

    if (typeof window.MediaRecorder === "undefined") {
      setSessionError("Audio recording is not supported in this browser. Switch to Text mode instead.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setSessionError("This browser cannot access the microphone. Use Text mode instead.");
      return;
    }

    if (isRecording) {
      return;
    }

    const recordingMimeType = getSupportedRecordingMimeType();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      const recorder = recordingMimeType
        ? new window.MediaRecorder(stream, { mimeType: recordingMimeType })
        : new window.MediaRecorder(stream);

      audioChunksRef.current = [];
      audioStreamRef.current = stream;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data?.size) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setIsRecording(false);
        mediaRecorderRef.current = null;
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((track) => track.stop());
          audioStreamRef.current = null;
        }
        setSessionError("Audio recording failed. Retry once or switch to Text mode.");
      };

      recorder.onstop = async () => {
        const recordedType = recorder.mimeType || recordingMimeType || "audio/webm";
        const recordedBlob = new Blob(audioChunksRef.current, { type: recordedType });

        audioChunksRef.current = [];
        mediaRecorderRef.current = null;
        setIsRecording(false);

        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((track) => track.stop());
          audioStreamRef.current = null;
        }

        if (!recordedBlob.size) {
          setSessionError("No audio was captured. Retry the recording.");
          return;
        }

        setIsTranscribingVoice(true);
        try {
          const wavFile = await convertRecordedBlobToWavFile(recordedBlob);
          const response = await transcribeInterviewAudio(wavFile);
          const transcript = cleanText(response?.transcript || "");

          if (!transcript) {
            setSessionError("No usable speech was detected. Retry once or type your answer.");
            return;
          }

          setCurrentTranscript(transcript);
          setCurrentAnswer((previousAnswer) => {
            const normalizedPreviousAnswer = cleanText(previousAnswer);

            if (!normalizedPreviousAnswer) {
              return transcript;
            }

            if (normalizedPreviousAnswer.toLowerCase().includes(transcript.toLowerCase())) {
              return normalizedPreviousAnswer;
            }

            return `${normalizedPreviousAnswer} ${transcript}`.trim();
          });
          setSessionError("");
        } catch (error) {
          setSessionError(error.message || "Voice transcription failed. Switch to Text mode if needed.");
        } finally {
          setIsTranscribingVoice(false);
        }
      };

      recorder.start(250);
      setCurrentTranscript("");
      setIsRecording(true);
    } catch (error) {
      setSessionError(
        "Microphone permission was denied or no input device is available. Allow mic access or switch to Text mode.",
      );
    }
  };

  const stopRecording = () => {
    const activeRecorder = mediaRecorderRef.current;

    if (activeRecorder && activeRecorder.state !== "inactive") {
      activeRecorder.stop();
      return;
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    setIsRecording(false);
  };

  const parseResumePreview = useCallback(async (file) => {
    setIsUploadingResume(true);
    try {
      const response = await uploadResumeFile(file);
      setResumeInsights(response.data);
      setResumeParser(response.parser || "");
      setSessionError("");
      return response.data;
    } catch (error) {
      setResumeInsights(null);
      setResumeParser("");
      setSessionError(error.message || "Failed to parse the resume.");
      throw error;
    } finally {
      setIsUploadingResume(false);
    }
  }, []);

  const uploadResumeIfNeeded = useCallback(async () => {
    if (!resumeFile) {
      return resumeInsights;
    }

    if (resumeInsights && resumeFileName) {
      return resumeInsights;
    }

    return parseResumePreview(resumeFile);
  }, [parseResumePreview, resumeFile, resumeFileName, resumeInsights]);

  const buildMentorPayload = useCallback(
    (overrides = {}) => {
      const nextIntent = cleanText(overrides.intent || mentorIntent) || "generate-question";
      const nextPrompt = cleanText(
        Object.prototype.hasOwnProperty.call(overrides, "message")
          ? overrides.message
          : mentorPrompt,
      );
      const nextConcept =
        cleanText(overrides.concept) ||
        (nextIntent === "explain-concept" ? nextPrompt : "");
      const nextQuestion = cleanText(
        overrides.question || currentQuestion?.question || "",
      );
      const nextAnswer = cleanText(overrides.answer || "");
      const nextSkill = cleanText(
        overrides.skill ||
          currentQuestion?.topic ||
          mentorSkillPool[0] ||
          mentorFocusAreas[0] ||
          activeConfig.title,
      );

      return {
        intent: nextIntent,
        ...(nextPrompt ? { message: nextPrompt } : {}),
        ...(nextConcept ? { concept: nextConcept } : {}),
        ...(nextQuestion ? { question: nextQuestion } : {}),
        ...(nextAnswer ? { answer: nextAnswer } : {}),
        ...(nextSkill ? { skill: nextSkill } : {}),
        company: cleanText(overrides.company || activeConfig.company),
        interviewType: cleanText(overrides.interviewType || activeConfig.round || activeMode),
        difficulty: cleanText(
          overrides.difficulty || currentDifficulty || activeConfig.difficulty,
        ),
        domain: cleanText(overrides.domain || activeConfig.domain),
        skills: mentorSkillPool,
        focus: mentorFocusAreas,
      };
    },
    [
      activeConfig.company,
      activeConfig.difficulty,
      activeConfig.domain,
      activeConfig.round,
      activeConfig.title,
      activeMode,
      currentDifficulty,
      currentQuestion?.question,
      currentQuestion?.topic,
      mentorFocusAreas,
      mentorIntent,
      mentorPrompt,
      mentorSkillPool,
    ],
  );

  const runMentorRequest = useCallback(
    async (overrides = {}) => {
      setIsMentorLoading(true);
      setMentorError("");
      setMentorTargetKey(cleanText(overrides.targetKey || ""));

      try {
        const response = await requestInterviewMentor(buildMentorPayload(overrides));
        setMentorResponse(response);
        return response;
      } catch (error) {
        setMentorResponse(null);
        setMentorError(error.message || "Failed to get mentor guidance.");
        throw error;
      } finally {
        setIsMentorLoading(false);
      }
    },
    [buildMentorPayload],
  );

  const requestMentorAction = useCallback(
    (nextIntent, overrides = {}) => {
      setMentorIntent(nextIntent);
      return runMentorRequest({
        ...overrides,
        intent: nextIntent,
      }).catch(() => {});
    },
    [runMentorRequest],
  );

  const loadNextQuestion = useCallback(
    async ({ configOverride, nextSessionId = "", difficultyOverride, reset = false }) => {
      const response = await fetchNextInterviewQuestion(
        buildInterviewRequestPayload(configOverride, {
          sessionId: nextSessionId,
          difficulty: difficultyOverride || configOverride.difficulty,
          reset,
        }),
      );

      const nextQuestion = {
        id: `${response.sessionId}-${response.questionNumber}`,
        question: cleanText(response.data?.question || ""),
        topic:
          cleanText(response.data?.topic || "") ||
          configOverride.skills?.[0] ||
          configOverride.focus?.[0] ||
          configOverride.title,
        difficulty: response.difficulty || response.data?.difficulty || difficultyOverride,
      };

      setSessionId(response.sessionId || nextSessionId);
      setCurrentQuestion(nextQuestion);
      setCurrentQuestionNumber(Number(response.questionNumber) || 1);
      setCurrentDifficulty(response.difficulty || response.data?.difficulty || difficultyOverride);
      setCurrentAnswer("");
      setCurrentTranscript("");
      timer.reset();

      return response;
    },
    [timer],
  );

  const beginInterview = async () => {
    stopSpeaking();
    if (isRecording) {
      stopRecording();
    }

    setSessionError("");

    if (!canStartInterview) {
      setSessionError(startValidationMessage || "Complete interview setup before starting.");
      return;
    }

    if (responseModeAllowsVoice && !voiceFeaturesSupported) {
      setSessionError(
        "Voice mode is not available in this browser. Switch to Text mode or use Chrome/Edge for live transcription.",
      );
      return;
    }

    setIsBootstrapping(true);

    try {
      const parsedResume = await uploadResumeIfNeeded();
      const manualConfig = {
        ...iv,
        company: normalizedManualSetup.company || iv.company || "",
        round: normalizedManualSetup.interviewType || iv.round,
        domain: normalizedManualSetup.domain || iv.domain,
        difficulty: normalizedManualSetup.difficulty || iv.difficulty,
        skills:
          normalizedManualSetup.skills.length > 0
            ? normalizedManualSetup.skills
            : iv.skills || [],
        focus: uniqueList([
          ...(iv.focus || []),
          ...(normalizedManualSetup.skills || []),
        ]),
        setupMode: "manual",
      };
      const mergedConfig = {
        ...mergeResumeIntoInterviewConfig(iv, parsedResume),
        responseMode,
        questionTarget: totalQuestions,
        resumeFileName: cleanText(resumeFile?.name || resumeFileName),
        resumeParser: cleanText(resumeParser),
        resumeSkills: parsedResume || resumeInsights || null,
        setupMode: "profile",
      };
      const nextConfig =
        isLoggedIn && interviewSetupMode === "profile" ? mergedConfig : {
          ...manualConfig,
          responseMode,
          questionTarget: totalQuestions,
          resumeFileName: cleanText(resumeFile?.name || resumeFileName),
          resumeParser: cleanText(resumeParser),
          resumeSkills: parsedResume || resumeInsights || null,
        };
      const freshSessionId = createInterviewSessionId();

      setActiveConfig(nextConfig);
      setAnsweredQuestions([]);
      setExpandedReview(null);
      setSessionId(freshSessionId);
      await loadNextQuestion({
        configOverride: nextConfig,
        nextSessionId: freshSessionId,
        difficultyOverride: nextConfig.difficulty,
        reset: true,
      });
      setPhase("interview");
    } catch (error) {
      setSessionError(error.message || "Failed to start the interview.");
    } finally {
      setIsBootstrapping(false);
    }
  };

  const moveToReview = () => {
    stopSpeaking();
    if (isRecording) {
      stopRecording();
    }
    timer.pause();
    setPhase("review");
  };

  const handleSubmitCurrentAnswer = async ({ skipped = false } = {}) => {
    if (!currentQuestion || isBusy) {
      return;
    }

    if (isRecording) {
      setSessionError("Stop the voice capture first so the transcript can finish before submitting.");
      return;
    }

    stopSpeaking();

    timer.pause();
    setSessionError("");
    setIsSubmittingAnswer(true);

    const draftAnswer = cleanText(currentTranscript || currentAnswer);
    const answerToSend =
      draftAnswer || (skipped ? "Skipped by candidate." : "No answer provided.");

    try {
      const submitResponse = await submitInterviewAnswer({
        sessionId,
        question: currentQuestion.question,
        answer: answerToSend,
        skill:
          currentQuestion.topic ||
          activeConfig.skills?.[0] ||
          activeConfig.focus?.[0] ||
          activeConfig.title,
        difficulty: currentQuestion.difficulty || currentDifficulty || activeConfig.difficulty,
      });
      const latestStep = Array.isArray(submitResponse.steps)
        ? submitResponse.steps[submitResponse.steps.length - 1]
        : null;
      const reviewedQuestion = {
        ...currentQuestion,
        answer: answerToSend,
        review: submitResponse.review,
        score: latestStep?.score ?? null,
        confidence: latestStep?.confidence || "",
        trend: latestStep?.trend || "",
        recentScores: latestStep?.recentScores || [],
        allScores: latestStep?.allScores || [],
      };

      setAnsweredQuestions((previousQuestions) => [...previousQuestions, reviewedQuestion]);

      if (currentQuestionNumber >= totalQuestions) {
        moveToReview();
        return;
      }

      await loadNextQuestion({
        configOverride: activeConfig,
        nextSessionId: submitResponse.sessionId || sessionId,
        difficultyOverride: submitResponse.nextDifficulty || currentDifficulty,
      });
      timer.resume();
    } catch (error) {
      setSessionError(error.message || "Failed to submit your answer.");
      timer.resume();
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const clearSelectedResume = () => {
    setResumeFile(null);
    setResumeFileName("");
    setResumeInsights(null);
    setResumeParser("");
    setSessionError("");
  };

  const handleResumeSelection = async (event) => {
    const file = event.target.files?.[0] || null;

    setResumeFile(file);
    setResumeFileName(file?.name || "");
    setResumeInsights(null);
    setResumeParser("");
    setSessionError("");

    if (!file) {
      return;
    }

    try {
      await parseResumePreview(file);
    } catch {
      // The UI already shows the parsing error.
    }
  };

  if (phase === "review") {
    return (
      <div className="arena-shell">
        <div className="arena-topbar">
          <div className="arena-breadcrumb">
            <span>ARENA</span>
            <span className="arena-bc-sep">›</span>
            <span className="arena-bc-track">{trackLabel}</span>
            <span className="arena-bc-sep">•</span>
            <span className="arena-bc-mode">REVIEW</span>
          </div>
          <button className="arena-end-btn" onClick={() => navigate("/interviews")}>
            BACK TO INTERVIEWS <span style={{ fontSize: 16 }}>×</span>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "28px 36px" }}>
          <h2
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 36,
              fontWeight: 900,
              textTransform: "uppercase",
              margin: "0 0 24px",
              color: "#fff",
            }}
          >
            Session Review
          </h2>

          {answeredQuestions.length === 0 ? (
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                padding: 20,
                background: "rgba(255,255,255,0.03)",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              No reviewed answers are available yet.
            </div>
          ) : null}

          <div style={{ display: "grid", gap: 12 }}>
            {answeredQuestions.map((entry, index) => {
              const open = expandedReview === index;
              return (
                <div
                  key={entry.id}
                  style={{
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    background: open
                      ? "rgba(255,85,0,0.06)"
                      : "rgba(255,255,255,0.02)",
                    transition: "all 0.2s",
                  }}
                >
                  <button
                    onClick={() => setExpandedReview(open ? null : index)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "16px 20px",
                      background: "none",
                      border: "none",
                      color: "#fff",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <span
                        style={{
                          flexShrink: 0,
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 900,
                          background: open ? "#FF5500" : "rgba(255,255,255,0.08)",
                          color: "#fff",
                        }}
                      >
                        {index + 1}
                      </span>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {entry.question}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: isMeaningfulAnswer(entry.answer)
                            ? "rgba(34,197,94,0.15)"
                            : "rgba(255,170,0,0.15)",
                          color: isMeaningfulAnswer(entry.answer) ? "#4ade80" : "#fbbf24",
                        }}
                      >
                        {isMeaningfulAnswer(entry.answer) ? "Answered" : "Skipped"}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: "rgba(255,85,0,0.12)",
                          color: "#FF5500",
                        }}
                      >
                        Score {entry.score ?? "-"}
                      </span>
                      <svg
                        style={{
                          width: 16,
                          height: 16,
                          color: "rgba(255,255,255,0.3)",
                          transform: open ? "rotate(180deg)" : "",
                          transition: "transform 0.2s",
                        }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>

                  {open ? (
                    <div style={{ padding: "0 20px 20px", display: "grid", gap: 12 }}>
                      <div
                        style={{
                          borderRadius: 8,
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.03)",
                          padding: 16,
                        }}
                      >
                        <p
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            letterSpacing: "0.16em",
                            color: "rgba(255,255,255,0.35)",
                            textTransform: "uppercase",
                            margin: "0 0 8px",
                          }}
                        >
                          Your Answer
                        </p>
                        <p
                          style={{
                            fontSize: 13,
                            lineHeight: 1.7,
                            color: "rgba(255,255,255,0.7)",
                            margin: 0,
                          }}
                        >
                          {entry.answer || (
                            <em style={{ color: "rgba(255,255,255,0.25)" }}>
                              No answer recorded
                            </em>
                          )}
                        </p>
                      </div>

                      <div
                        style={{
                          borderRadius: 8,
                          border: "1px solid rgba(255,85,0,0.2)",
                          background: "rgba(255,85,0,0.04)",
                          padding: 16,
                        }}
                      >
                        <p
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            letterSpacing: "0.16em",
                            color: "#FF5500",
                            textTransform: "uppercase",
                            margin: "0 0 8px",
                          }}
                        >
                          Review
                        </p>
                        <p style={{ fontSize: 13, lineHeight: 1.7, color: "#f8fafc", margin: "0 0 8px" }}>
                          {entry.review?.feedback}
                        </p>
                        <p
                          style={{
                            fontSize: 12,
                            lineHeight: 1.6,
                            color: "rgba(255,255,255,0.75)",
                            margin: "0 0 6px",
                          }}
                        >
                          <strong>Strength:</strong> {entry.review?.strength}
                        </p>
                        <p
                          style={{
                            fontSize: 12,
                            lineHeight: 1.6,
                            color: "rgba(255,255,255,0.75)",
                            margin: "0 0 10px",
                          }}
                        >
                          <strong>Improvement:</strong> {entry.review?.improvement}
                        </p>
                        <p
                          style={{
                            fontSize: 12,
                            lineHeight: 1.6,
                            color: "rgba(255,255,255,0.75)",
                            margin: 0,
                          }}
                        >
                          <strong>Ideal Answer:</strong> {entry.review?.idealAnswer}
                        </p>
                        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "3px 10px",
                              borderRadius: 999,
                              background: "rgba(255,85,0,0.12)",
                              color: "#FF5500",
                            }}
                          >
                            {entry.topic}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "3px 10px",
                              borderRadius: 999,
                              background: "rgba(255,255,255,0.06)",
                              color: "rgba(255,255,255,0.65)",
                            }}
                          >
                            {entry.difficulty}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "3px 10px",
                              borderRadius: 999,
                              background: "rgba(255,255,255,0.06)",
                              color: "rgba(255,255,255,0.65)",
                            }}
                          >
                            Confidence {entry.confidence || "medium"}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "3px 10px",
                              borderRadius: 999,
                              background: "rgba(255,255,255,0.06)",
                              color: "rgba(255,255,255,0.65)",
                            }}
                          >
                            Trend {entry.trend || "unstable"}
                          </span>
                        </div>
                        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() =>
                              requestMentorAction("improve-answer", {
                                answer: entry.answer,
                                question: entry.question,
                                skill: entry.topic,
                                targetKey: entry.id,
                                message: "Improve this answer for clarity, structure, and technical depth.",
                              })
                            }
                            style={{
                              borderRadius: 8,
                              border: "1px solid rgba(255,85,0,0.25)",
                              background: "rgba(255,85,0,0.08)",
                              color: "#FF5500",
                              padding: "8px 12px",
                              fontSize: 11,
                              fontWeight: 800,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              cursor: "pointer",
                            }}
                          >
                            Refine With Mentor
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              requestMentorAction("answer-feedback", {
                                answer: entry.answer,
                                question: entry.question,
                                skill: entry.topic,
                                targetKey: entry.id,
                              })
                            }
                            style={{
                              borderRadius: 8,
                              border: "1px solid rgba(255,255,255,0.12)",
                              background: "rgba(255,255,255,0.04)",
                              color: "rgba(255,255,255,0.75)",
                              padding: "8px 12px",
                              fontSize: 11,
                              fontWeight: 800,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              cursor: "pointer",
                            }}
                          >
                            Mentor Re-Score
                          </button>
                        </div>
                        {mentorTargetKey === entry.id ? (
                          <MentorResponsePanel
                            response={mentorResponse}
                            error={mentorError}
                            isLoading={isMentorLoading}
                            compact
                          />
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "prep") {
    const guidelines = [
      {
        icon: "🧠",
        title: "Adaptive Questions",
        desc: "The next prompt is generated from your last answer and current difficulty.",
      },
      {
        icon: "📄",
        title: "Resume Context",
        desc: "Upload a PDF resume to enrich the interview with your technical profile.",
      },
      {
        icon: "🎤",
        title: "Answer Modes",
        desc: "Choose Text, Voice, or Voice + Text before the session starts.",
      },
      {
        icon: "📊",
        title: "Backend Review",
        desc: "Each answer is scored by the backend and summarized in the final review.",
      },
    ];

    return (
      <div className="arena-shell">
        <div className="arena-topbar">
          <div className="arena-breadcrumb">
            <span>ARENA</span>
            <span className="arena-bc-sep">›</span>
            <span className="arena-bc-track">{trackLabel}</span>
            <span className="arena-bc-sep">•</span>
            <span className="arena-bc-mode">WARM-UP</span>
          </div>
          <button className="arena-end-btn" onClick={() => navigate(-1)}>
            GO BACK <span style={{ fontSize: 16 }}>×</span>
          </button>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 28px",
          }}
        >
          <div style={{ maxWidth: 640, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>{meta.icon}</div>
            <h1
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "clamp(32px, 5vw, 52px)",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.02em",
                color: "#fff",
                margin: "0 0 10px",
              }}
            >
              {iv.title}
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.45)",
                margin: "0 0 32px",
                lineHeight: 1.6,
              }}
            >
              {iv.description}
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 36, flexWrap: "wrap" }}>
              {[iv.difficulty, iv.duration, `${totalQuestions} Questions`, iv.company].map((token) => (
                <span
                  key={token}
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    padding: "6px 16px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  {token}
                </span>
              ))}
            </div>

            <div
              style={{
                marginBottom: 24,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                borderRadius: 12,
                padding: 16,
                textAlign: "left",
              }}
            >
              <p
                style={{
                  margin: "0 0 6px",
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#FF5500",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Choose Answer Mode
              </p>
              <p
                style={{
                  margin: "0 0 14px",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.7)",
                  lineHeight: 1.6,
                }}
              >
                The candidate can decide how to answer this interview before the first question starts.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                  gap: 12,
                }}
              >
                {ANSWER_MODE_OPTIONS.map((option) => {
                  const voiceOptionDisabled =
                    option.id !== "text" && !voiceFeaturesSupported;
                  const isSelected = responseMode === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        if (!voiceOptionDisabled) {
                          setResponseMode(option.id);
                          setSessionError("");
                        }
                      }}
                      disabled={voiceOptionDisabled}
                      style={{
                        textAlign: "left",
                        padding: 14,
                        borderRadius: 10,
                        border: isSelected
                          ? "1px solid rgba(255,85,0,0.7)"
                          : "1px solid rgba(255,255,255,0.08)",
                        background: isSelected
                          ? "rgba(255,85,0,0.12)"
                          : "rgba(255,255,255,0.02)",
                        color: "#fff",
                        cursor: voiceOptionDisabled ? "not-allowed" : "pointer",
                        opacity: voiceOptionDisabled ? 0.55 : 1,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 18 }}>{option.icon}</span>
                        <div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{option.label}</p>
                          <p
                            style={{
                              margin: "2px 0 0",
                              fontSize: 10,
                              letterSpacing: "0.08em",
                              color: isSelected ? "#FF5500" : "rgba(255,255,255,0.45)",
                              textTransform: "uppercase",
                              fontWeight: 800,
                            }}
                          >
                            {isSelected ? "Selected" : voiceOptionDisabled ? "Unavailable here" : "Available"}
                          </p>
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: "rgba(255,255,255,0.72)" }}>
                        {option.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
              {!voiceFeaturesSupported ? (
                <p
                  style={{
                    margin: "14px 0 0",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.55)",
                    lineHeight: 1.5,
                  }}
                >
                  Voice transcription needs microphone access plus browser speech-recognition support. Text mode is available now.
                </p>
              ) : null}
            </div>

            {sessionError ? (
              <div
                style={{
                  marginBottom: 20,
                  border: "1px solid rgba(248,113,113,0.4)",
                  background: "rgba(127,29,29,0.35)",
                  color: "#fecaca",
                  padding: "12px 16px",
                  borderRadius: 10,
                  textAlign: "left",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {sessionError}
              </div>
            ) : null}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 12,
                textAlign: "left",
                marginBottom: 40,
              }}
            >
              {guidelines.map((guideline) => (
                <div
                  key={guideline.title}
                  style={{
                    padding: 18,
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 20 }}>{guideline.icon}</span>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fff" }}>
                      {guideline.title}
                    </p>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: "rgba(255,255,255,0.4)",
                      lineHeight: 1.5,
                    }}
                  >
                    {guideline.desc}
                  </p>
                </div>
              ))}
            </div>

            <div
              style={{
                marginBottom: 24,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                borderRadius: 12,
                padding: 16,
                textAlign: "left",
                display: "grid",
                gap: 12,
              }}
            >
              <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "#FF5500", letterSpacing: "0.1em" }}>
                INTERVIEW ACCESS SETUP
              </p>
              {!isLoggedIn ? (
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                  Guest flow: choose role/domain, add at least one skill, select interview type, choose difficulty, then start.
                </p>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                    Logged-in flow: choose <strong>Resume/Profile Interview</strong> or <strong>Manual Setup Interview</strong>.
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setInterviewSetupMode("profile")}
                      style={{
                        borderRadius: 10,
                        border:
                          interviewSetupMode === "profile"
                            ? "1px solid rgba(255,85,0,0.35)"
                            : "1px solid rgba(255,255,255,0.12)",
                        background:
                          interviewSetupMode === "profile"
                            ? "rgba(255,85,0,0.1)"
                            : "rgba(255,255,255,0.03)",
                        color: "#fff",
                        padding: "10px 14px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Use Resume Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => setInterviewSetupMode("manual")}
                      style={{
                        borderRadius: 10,
                        border:
                          interviewSetupMode === "manual"
                            ? "1px solid rgba(255,85,0,0.35)"
                            : "1px solid rgba(255,255,255,0.12)",
                        background:
                          interviewSetupMode === "manual"
                            ? "rgba(255,85,0,0.1)"
                            : "rgba(255,255,255,0.03)",
                        color: "#fff",
                        padding: "10px 14px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Manual Setup Interview
                    </button>
                  </div>
                </div>
              )}

              {isLoggedIn && interviewSetupMode === "profile" && !profileValidation.isValid ? (
                <div
                  style={{
                    borderRadius: 12,
                    border: "1px solid rgba(255,85,0,0.25)",
                    background: "linear-gradient(135deg, rgba(255,85,0,0.1), rgba(15,23,42,0.25))",
                    padding: 14,
                    display: "grid",
                    gap: 10,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fff" }}>
                    Your AI mentor needs context before starting a personalized interview.
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
                    Upload your resume and complete your profile before starting a personalized interview.
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => resumeInputRef.current?.click()}
                      style={{
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.06)",
                        color: "#fff",
                        padding: "10px 14px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Upload Resume
                    </button>
                    <button
                      type="button"
                      onClick={() => setInterviewSetupMode("manual")}
                      style={{
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.03)",
                        color: "rgba(255,255,255,0.9)",
                        padding: "10px 14px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Continue with Manual Setup
                    </button>
                  </div>
                </div>
              ) : null}

              {(interviewSetupMode === "manual" || !isLoggedIn) ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 10,
                  }}
                >
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>Role / Domain *</span>
                    <input
                      value={manualSetup.domain}
                      onChange={(event) =>
                        setManualSetup((prev) => ({ ...prev, domain: event.target.value }))
                      }
                      placeholder="backend, frontend, devops..."
                      style={{
                        borderRadius: 10,
                        border: manualValidation.missing.domain
                          ? "1px solid rgba(248,113,113,0.55)"
                          : "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(15,23,42,0.5)",
                        color: "#fff",
                        padding: "10px 12px",
                        fontSize: 12,
                      }}
                    />
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>Skills (comma-separated) *</span>
                    <input
                      value={manualSetup.skillsText}
                      onChange={(event) =>
                        setManualSetup((prev) => ({ ...prev, skillsText: event.target.value }))
                      }
                      placeholder="React, Node.js, MongoDB"
                      style={{
                        borderRadius: 10,
                        border: manualValidation.missing.skills
                          ? "1px solid rgba(248,113,113,0.55)"
                          : "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(15,23,42,0.5)",
                        color: "#fff",
                        padding: "10px 12px",
                        fontSize: 12,
                      }}
                    />
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>Interview Type *</span>
                    <select
                      value={manualSetup.interviewType}
                      onChange={(event) =>
                        setManualSetup((prev) => ({ ...prev, interviewType: event.target.value }))
                      }
                      style={{
                        borderRadius: 10,
                        border: manualValidation.missing.interviewType
                          ? "1px solid rgba(248,113,113,0.55)"
                          : "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(15,23,42,0.5)",
                        color: "#fff",
                        padding: "10px 12px",
                        fontSize: 12,
                      }}
                    >
                      <option value="">Select type</option>
                      <option value="technical">Technical</option>
                      <option value="hr">HR</option>
                      <option value="managerial">Managerial</option>
                    </select>
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>Difficulty *</span>
                    <select
                      value={manualSetup.difficulty}
                      onChange={(event) =>
                        setManualSetup((prev) => ({ ...prev, difficulty: event.target.value }))
                      }
                      style={{
                        borderRadius: 10,
                        border: manualValidation.missing.difficulty
                          ? "1px solid rgba(248,113,113,0.55)"
                          : "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(15,23,42,0.5)",
                        color: "#fff",
                        padding: "10px 12px",
                        fontSize: 12,
                      }}
                    >
                      <option value="">Select difficulty</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>Company (optional)</span>
                    <input
                      value={manualSetup.company}
                      onChange={(event) =>
                        setManualSetup((prev) => ({ ...prev, company: event.target.value }))
                      }
                      placeholder="Google, Startup, Product company..."
                      style={{
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(15,23,42,0.5)",
                        color: "#fff",
                        padding: "10px 12px",
                        fontSize: 12,
                      }}
                    />
                  </label>
                </div>
              ) : null}
            </div>

            <div className="resume-upload-shell" style={{ marginBottom: 24 }}>
              <button
                type="button"
                className="resume-upload-close-btn"
                aria-label="Clear selected resume"
                onClick={clearSelectedResume}
              >
                ×
              </button>
              <div className="resume-upload-icon-wrap" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16V8" />
                  <path d="M8.5 11.5 12 8l3.5 3.5" />
                </svg>
              </div>
              <div className="resume-upload-copy">
                <h2>Upload a Resume</h2>
                <p>Optional, but it should be a PDF. Backend parsing will add resume skills to technical rounds.</p>
              </div>
              <label className="resume-upload-input-wrap">
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleResumeSelection}
                />
                <span>{resumeFileName || "Choose PDF"}</span>
              </label>
            </div>

            {resumeInsights ? (
              <div
                style={{
                  marginBottom: 24,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 12,
                  padding: 16,
                  textAlign: "left",
                }}
              >
                <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 800, color: "#FF5500", letterSpacing: "0.1em" }}>
                  RESUME PARSED {resumeParser ? `• ${resumeParser.toUpperCase()}` : ""}
                </p>
                <p style={{ margin: "0 0 12px", fontSize: 12, color: "rgba(255,255,255,0.72)", lineHeight: 1.5 }}>
                  Your resume skills are ready. Review them below, then click <strong>Begin Interview</strong>.
                </p>
                <div style={{ display: "grid", gap: 12 }}>
                  {resumeSections.map((section) => (
                    <div key={section.label}>
                      <p
                        style={{
                          margin: "0 0 8px",
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: "0.08em",
                          color: "rgba(255,255,255,0.5)",
                          textTransform: "uppercase",
                        }}
                      >
                        {section.label}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {section.values.map((value) => (
                          <span
                            key={`${section.label}-${value}`}
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "6px 10px",
                              borderRadius: 999,
                              background: "rgba(255,85,0,0.12)",
                              color: "#f8fafc",
                            }}
                          >
                            {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {resumeSections.length === 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {resumeTags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "6px 10px",
                            borderRadius: 999,
                            background: "rgba(255,85,0,0.12)",
                            color: "#f8fafc",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div
              style={{
                marginBottom: 24,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                borderRadius: 12,
                padding: 16,
                textAlign: "left",
                display: "grid",
                gap: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: "0 0 6px",
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#FF5500",
                      letterSpacing: "0.1em",
                    }}
                  >
                    AI MENTOR
                  </p>
                  <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
                    Get a practice question, concept explanation, or weak-area plan before the round starts.
                  </p>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {mentorSkillPool.slice(0, 4).map((skill) => (
                    <MentorPill key={skill}>{skill}</MentorPill>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                  gap: 10,
                }}
              >
                {MENTOR_ACTIONS.map((action) => {
                  const isSelected = mentorIntent === action.id;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => setMentorIntent(action.id)}
                      style={{
                        textAlign: "left",
                        borderRadius: 10,
                        border: isSelected
                          ? "1px solid rgba(255,85,0,0.35)"
                          : "1px solid rgba(255,255,255,0.08)",
                        background: isSelected
                          ? "rgba(255,85,0,0.08)"
                          : "rgba(255,255,255,0.02)",
                        padding: 14,
                        cursor: "pointer",
                      }}
                    >
                      <p
                        style={{
                          margin: "0 0 6px",
                          fontSize: 12,
                          fontWeight: 700,
                          color: isSelected ? "#fff" : "rgba(255,255,255,0.86)",
                        }}
                      >
                        {action.label}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 11,
                          color: "rgba(255,255,255,0.54)",
                          lineHeight: 1.5,
                        }}
                      >
                        {action.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <label
                  htmlFor="mentor-prompt"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.72)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {mentorPromptMeta.title}
                </label>
                <textarea
                  id="mentor-prompt"
                  value={mentorPrompt}
                  onChange={(event) => setMentorPrompt(event.target.value)}
                  placeholder={mentorPromptMeta.placeholder}
                  rows={3}
                  style={{
                    width: "100%",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.02)",
                    color: "#fff",
                    padding: "12px 14px",
                    fontSize: 13,
                    lineHeight: 1.6,
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => requestMentorAction(mentorIntent, { message: mentorPrompt })}
                  disabled={isMentorLoading}
                  style={{
                    borderRadius: 8,
                    border: "1px solid rgba(255,85,0,0.25)",
                    background: "rgba(255,85,0,0.12)",
                    color: "#FF5500",
                    padding: "10px 14px",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    cursor: isMentorLoading ? "wait" : "pointer",
                  }}
                >
                  {isMentorLoading ? "Loading..." : `Run ${formatMentorLabel(mentorIntent)}`}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    requestMentorAction("generate-question", {
                      message: mentorPrompt,
                    })
                  }
                  disabled={isMentorLoading}
                  style={{
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.04)",
                    color: "rgba(255,255,255,0.75)",
                    padding: "10px 14px",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    cursor: isMentorLoading ? "wait" : "pointer",
                  }}
                >
                  New Practice Question
                </button>
              </div>

              {mentorTargetKey ? null : (
                <MentorResponsePanel
                  response={mentorResponse}
                  error={mentorError}
                  isLoading={isMentorLoading}
                />
              )}
            </div>

            {canStartInterview ? null : (
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#fca5a5",
                  textAlign: "center",
                }}
              >
                {startValidationMessage || "Complete interview setup before starting."}
              </p>
            )}
            <button
              onClick={beginInterview}
              className="arena-btn arena-btn--submit"
              style={{
                padding: "16px 40px",
                fontSize: 14,
                borderRadius: 8,
                opacity: canStartInterview ? 1 : 0.45,
                cursor: canStartInterview ? "pointer" : "not-allowed",
                filter: canStartInterview ? "none" : "grayscale(0.3)",
              }}
              disabled={!canStartInterview}
            >
              <svg
                style={{ width: 18, height: 18 }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
              </svg>
              {isUploadingResume
                ? "UPLOADING RESUME..."
                : isBootstrapping
                  ? "GENERATING FIRST QUESTION..."
                  : "BEGIN INTERVIEW"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="arena-shell">
      <div className="arena-topbar">
        <div className="arena-breadcrumb">
          <span>ARENA</span>
          <span className="arena-bc-sep">›</span>
          <span className="arena-bc-track">{trackLabel}</span>
          <span className="arena-bc-sep">•</span>
          <span className="arena-bc-mode">{activeConfig.company.toUpperCase()}</span>
        </div>
        <button
          className="arena-end-btn"
          onClick={() => {
            stopSpeaking();
            if (isRecording) {
              stopRecording();
            }
            navigate(-1);
          }}
        >
          END SESSION <span style={{ fontSize: 16 }}>×</span>
        </button>
      </div>

      <div className="arena-qrow">
        <span className="arena-qnum">/{String(currentQuestionNumber).padStart(2, "0")}</span>
        <div className="arena-track-bar">
          <div className="arena-track-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="arena-qtotal">{totalQuestions} TOTAL</span>
      </div>

      <div className="arena-main">
        <div className="arena-left">
            <div className={`arena-spline-frame ${isSplineExpanded ? "arena-spline-frame--expanded" : ""}`}>
            <div className="arena-status-badge">
              <span className={`arena-status-dot ${isSpeaking || isRecording ? "arena-status-dot--on" : ""}`} />
              {isRecording ? "RECORDING" : isSpeaking ? "SPEAKING" : "READY"}
            </div>
            <div
              className="arena-status-badge"
              style={{ top: 56, maxWidth: "min(70vw, 420px)" }}
              title={responseModeAllowsVoice ? voiceLockLabel : "Text mode only"}
            >
              {responseModeAllowsVoice ? `VOICE LOCK: ${voiceLockLabel}` : "INPUT MODE: TEXT ONLY"}
            </div>
            <button
              type="button"
              className="arena-expand-btn"
              onClick={() => setIsSplineExpanded((value) => !value)}
              aria-label={isSplineExpanded ? "Collapse robo view" : "Expand robo view"}
            >
              {isSplineExpanded ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 9-6-6" />
                  <path d="M3 8V3h5" />
                  <path d="m15 9 6-6" />
                  <path d="M16 3h5v5" />
                  <path d="m9 15-6 6" />
                  <path d="M3 16v5h5" />
                  <path d="m15 15 6 6" />
                  <path d="M21 16v5h-5" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m8 3-5 5" />
                  <path d="M3 3h5v5" />
                  <path d="m16 3 5 5" />
                  <path d="M16 3h5v5" />
                  <path d="m8 21-5-5" />
                  <path d="M3 16v5h5" />
                  <path d="m16 21 5-5" />
                  <path d="M16 21h5v-5" />
                </svg>
              )}
            </button>

            {isSplineExpanded ? (
              <div className="arena-overlay-top-actions">
                <div className="arena-top-right-actions">
                  {currentQuestionNumber < totalQuestions ? (
                    <button
                      type="button"
                      className="arena-overlay-action-btn"
                      onClick={() => handleSubmitCurrentAnswer({ skipped: true })}
                      disabled={!canSubmitCurrentAnswer}
                    >
                      Skip
                    </button>
                  ) : null}
                    <button
                      type="button"
                      className="arena-overlay-action-btn arena-overlay-action-btn--primary"
                      onClick={() => handleSubmitCurrentAnswer()}
                      disabled={!canSubmitCurrentAnswer}
                    >
                    {currentQuestionNumber < totalQuestions ? "Submit" : "Finish"}
                  </button>
                </div>
              </div>
            ) : null}

            <SplineOrb />

            {isSplineExpanded ? (
              <div className="arena-user-preview" aria-label="User camera preview">
                <p className="arena-user-preview-label">You</p>
                <div className="arena-user-preview-box">
                  <div className="arena-user-preview-controls">
                    <button
                      type="button"
                      className={`arena-user-control-btn ${micEnabled && responseModeAllowsVoice ? "is-on" : ""}`}
                      aria-label={micEnabled ? "Turn microphone off" : "Turn microphone on"}
                      disabled={!responseModeAllowsVoice}
                      onClick={() => {
                        if (responseModeAllowsVoice) {
                          if (isRecording) stopRecording();
                          setMicEnabled((value) => !value);
                        }
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z" />
                        <path d="M19 11a7 7 0 0 1-14 0" />
                        <path d="M12 18v3" />
                        <path d="M8 21h8" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={`arena-user-control-btn ${cameraEnabled ? "is-on" : ""}`}
                      aria-label={cameraEnabled ? "Turn camera off" : "Turn camera on"}
                      onClick={() => setCameraEnabled((value) => !value)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="7" width="13" height="10" rx="2" />
                        <path d="m16 10 5-3v10l-5-3z" />
                      </svg>
                    </button>
                  </div>

                  {cameraEnabled && cameraReady ? (
                    <video
                      ref={userVideoRef}
                      className="arena-user-video"
                      autoPlay
                      muted
                      playsInline
                      onLoadedMetadata={(event) => {
                        event.currentTarget.play?.();
                        setCameraReady(true);
                      }}
                      onError={() => {
                        setCameraReady(false);
                        setCameraError("Camera unavailable");
                      }}
                    />
                  ) : userProfile.avatarUrl ? (
                    <img
                      src={userProfile.avatarUrl}
                      alt="Profile"
                      className="arena-user-avatar-img"
                    />
                  ) : (
                    <div className="arena-user-avatar-fallback">{userProfile.initial}</div>
                  )}

                  {cameraEnabled && !cameraReady ? (
                    <div className="arena-user-preview-status">
                      {cameraError || "Starting camera..."}
                    </div>
                  ) : null}

                  <div className="arena-user-profile-chip">
                    {userProfile.avatarUrl ? (
                      <img
                        src={userProfile.avatarUrl}
                        alt={`${userProfile.displayName} profile`}
                        className="arena-user-profile-chip-img"
                      />
                    ) : (
                      <span className="arena-user-profile-chip-fallback">{userProfile.initial}</span>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {isSplineExpanded ? (
              <div className="arena-expanded-controls">
                <div>
                  <p className="arena-tone-label">QUESTION {currentQuestionNumber}</p>
                  <p className="arena-expanded-question">
                    {currentQuestion?.question || "Preparing your question..."}
                  </p>
                  <p className="arena-expanded-subtitle">
                    Speak naturally and keep your answer concise, structured, and impact-focused.
                  </p>
                  <div
                    style={{
                      marginTop: 12,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      maxWidth: 560,
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 6px",
                        fontSize: 10,
                        letterSpacing: "0.08em",
                        color: "rgba(255,255,255,0.5)",
                        fontWeight: 700,
                      }}
                    >
                      {transcriptPanelLabel}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "rgba(255,255,255,0.85)" }}>
                      {cleanText(currentTranscript || currentAnswer) || transcriptEmptyState}
                    </p>
                  </div>
                </div>
                <div className="arena-expanded-actions">
                  <div className="arena-timer-display">
                    <svg style={{ width: 18, height: 18, opacity: 0.5 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" strokeWidth={2} />
                      <path strokeLinecap="round" strokeWidth={2} d="M12 6v6l4 2" />
                    </svg>
                    {timer.fmt}
                  </div>
                </div>
              </div>
            ) : (
              <div className="arena-spline-footer">
                <div>
                  <p className="arena-tone-label">TOPIC</p>
                  <p className="arena-tone-val">
                    {(currentQuestion?.topic || activeConfig.focus?.[0] || activeConfig.title).toUpperCase()}
                  </p>
                  <div
                    style={{
                      marginTop: 8,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 10,
                      padding: "8px 10px",
                      maxWidth: 420,
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 4px",
                        fontSize: 9,
                        letterSpacing: "0.08em",
                        color: "rgba(255,255,255,0.5)",
                        fontWeight: 700,
                      }}
                    >
                      {transcriptPanelLabel}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, lineHeight: 1.5, color: "rgba(255,255,255,0.85)" }}>
                      {cleanText(currentTranscript || currentAnswer) ||
                        (responseModeAllowsVoice
                          ? "Speak to capture your response..."
                          : "Type to preview your response...")}
                    </p>
                  </div>
                </div>
                <div className="arena-timer-display">
                  <svg style={{ width: 18, height: 18, opacity: 0.5 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth={2} />
                    <path strokeLinecap="round" strokeWidth={2} d="M12 6v6l4 2" />
                  </svg>
                  {timer.fmt}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="arena-right">
          <p className="arena-qlabel">
            QUESTION {currentQuestionNumber} / {totalQuestions}
          </p>
          <h2 className="arena-qtext">{currentQuestion?.question || "Preparing your question..."}</h2>

          {sessionError ? (
            <div
              style={{
                marginBottom: 16,
                border: "1px solid rgba(248,113,113,0.4)",
                background: "rgba(127,29,29,0.3)",
                color: "#fecaca",
                padding: "12px 14px",
                borderRadius: 10,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {sessionError}
            </div>
          ) : null}

          <p className="arena-resp-label">YOUR RESPONSE</p>
          <textarea
            className="arena-textarea"
            placeholder={textAreaPlaceholder}
            value={textAreaValue}
            onChange={(event) => {
              if (responseModeAllowsTyping) {
                setCurrentAnswer(event.target.value);
              }
            }}
            readOnly={!responseModeAllowsTyping || isRecording}
          />

          <div className="arena-meta-row">
            <span>{metrics.words} WORDS</span>
            <span>MODE {responseMode.toUpperCase()}</span>
            <span>DIFFICULTY {String(currentDifficulty || activeConfig.difficulty).toUpperCase()}</span>
          </div>

          <div className="arena-action-row">
            {responseModeAllowsVoice ? (
              <button
                className={`arena-btn ${isRecording ? "arena-btn--recording" : "arena-btn--voice"}`}
                onClick={() => (isRecording ? stopRecording() : startRecording())}
                disabled={isBusy}
              >
                {isRecording ? (
                  <>
                    <svg className="arena-btn-icon" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                    STOP
                  </>
                ) : (
                  <>
                    <svg className="arena-btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-14 0m14 0a7 7 0 00-14 0m14 0v1a7 7 0 01-14 0v-1m7 8v4m-4 0h8"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 1a3 3 0 00-3 3v7a3 3 0 006 0V4a3 3 0 00-3-3z"
                      />
                    </svg>
                    VOICE
                  </>
                )}
              </button>
            ) : (
              <button className="arena-btn arena-btn--skip" disabled>
                TEXT MODE
              </button>
            )}

            {currentQuestionNumber < totalQuestions ? (
              <button
                className="arena-btn arena-btn--skip"
                onClick={() => handleSubmitCurrentAnswer({ skipped: true })}
                disabled={!canSubmitCurrentAnswer}
              >
                <svg className="arena-btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <polygon points="5 4 15 12 5 20" fill="currentColor" />
                  <line x1="19" y1="5" x2="19" y2="19" strokeWidth={2.5} />
                </svg>
                SKIP
              </button>
            ) : null}

            <button
              className="arena-btn arena-btn--submit"
              onClick={() => handleSubmitCurrentAnswer()}
              disabled={!canSubmitCurrentAnswer}
            >
              {isSubmittingAnswer ? "SUBMITTING..." : currentQuestionNumber < totalQuestions ? "SUBMIT" : "FINISH"}
              <svg className="arena-btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="arena-metrics">
        <div className="arena-metric-card">
          <p className="arena-metric-label">CLARITY</p>
          <p className="arena-metric-val">✦ {metrics.clarity}</p>
        </div>
        <div className="arena-metric-card">
          <p className="arena-metric-label">PACE</p>
          <p className="arena-metric-val">✦ {metrics.pace}</p>
        </div>
        <div className="arena-metric-card">
          <p className="arena-metric-label">SIGNAL</p>
          <p className="arena-metric-val">✦ {metrics.signal}</p>
        </div>
      </div>
    </div>
  );
}
