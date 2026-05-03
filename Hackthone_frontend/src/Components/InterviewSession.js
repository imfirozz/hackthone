import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getStoredAuthSession } from "../services/authApi";
import {
  fetchNextInterviewQuestion,
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
  return (
    <div
      className="arena-spline-viewer"
      style={{
        background:
          "radial-gradient(circle at 30% 20%, rgba(249,115,22,0.26), transparent 28%), radial-gradient(circle at 68% 32%, rgba(14,165,233,0.18), transparent 24%), radial-gradient(circle at 50% 70%, rgba(255,255,255,0.08), transparent 30%)",
      }}
    />
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
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const userVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);

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
  const resumeTags = useMemo(() => {
    if (!resumeInsights) {
      return [];
    }

    return uniqueList([
      ...(resumeInsights.languages || []),
      ...(resumeInsights.frameworks || []),
      ...(resumeInsights.tools || []),
      ...(resumeInsights.concepts || []),
    ]).slice(0, 10);
  }, [resumeInsights]);
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
  const isBusy = isBootstrapping || isSubmittingAnswer || isTranscribingVoice;
  const canSubmitCurrentAnswer = !isBusy && !isRecording;

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

    if (responseModeAllowsVoice && !voiceFeaturesSupported) {
      setSessionError(
        "Voice mode is not available in this browser. Switch to Text mode or use Chrome/Edge for live transcription.",
      );
      return;
    }

    setIsBootstrapping(true);

    try {
      const parsedResume = await uploadResumeIfNeeded();
      const mergedConfig = {
        ...mergeResumeIntoInterviewConfig(iv, parsedResume),
        responseMode,
        questionTarget: totalQuestions,
        resumeFileName: cleanText(resumeFile?.name || resumeFileName),
        resumeParser: cleanText(resumeParser),
        resumeSkills: parsedResume || resumeInsights || null,
      };
      const freshSessionId = createInterviewSessionId();

      setActiveConfig(mergedConfig);
      setAnsweredQuestions([]);
      setExpandedReview(null);
      setSessionId(freshSessionId);
      await loadNextQuestion({
        configOverride: mergedConfig,
        nextSessionId: freshSessionId,
        difficultyOverride: mergedConfig.difficulty,
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

            <button
              onClick={beginInterview}
              className="arena-btn arena-btn--submit"
              style={{ padding: "16px 40px", fontSize: 14, borderRadius: 8 }}
              disabled={isBootstrapping || isUploadingResume}
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
