const { randomUUID } = require("crypto");
const redisClient = require("../config/redis");

const SESSION_KEY_PREFIX = "interview:session:";
const SESSION_TTL_SECONDS = 60 * 60 * 4;
const memorySessions = new Map();

const cleanText = (value = "") => value.replace(/\s+/g, " ").trim();

const normalizeDifficulty = (value = "") => {
  const normalizedValue = cleanText(value).toLowerCase();

  if (["beginner", "basic", "easy"].includes(normalizedValue)) {
    return "easy";
  }

  if (["intermediate", "medium"].includes(normalizedValue)) {
    return "medium";
  }

  if (["advanced", "hard", "senior"].includes(normalizedValue)) {
    return "hard";
  }

  return normalizedValue || "medium";
};

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => cleanText(String(item))).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/,|;|\||\n|\s\/\s/)
      .map((item) => cleanText(item))
      .filter(Boolean);
  }

  return [];
};

const normalizeProgressionValue = (value, fallback = 0) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : fallback;
};

const normalizeResponseMode = (value = "") => {
  const normalizedValue = cleanText(value).toLowerCase();

  if (!normalizedValue) {
    return "";
  }

  if (["text", "voice", "hybrid"].includes(normalizedValue)) {
    return normalizedValue;
  }

  return "";
};

const normalizePositiveInteger = (value, fallback = 8) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? Math.round(parsedValue) : fallback;
};

const normalizeResumeSkills = (value = {}) => ({
  languages: normalizeList(value?.languages),
  frameworks: normalizeList(value?.frameworks),
  tools: normalizeList(value?.tools),
  concepts: normalizeList(value?.concepts),
});

const getSessionKey = (sessionId) => `${SESSION_KEY_PREFIX}${sessionId}`;

const canUseRedis = () => Boolean(redisClient && (redisClient.isOpen || redisClient.isReady));

const cloneSession = (session) => JSON.parse(JSON.stringify(session));

const readFromMemory = (sessionId) => {
  const session = memorySessions.get(sessionId);
  return session ? cloneSession(session) : null;
};

const writeToMemory = (session) => {
  memorySessions.set(session.sessionId, cloneSession(session));
};

const readSession = async (sessionId) => {
  if (!sessionId) {
    return null;
  }

  if (canUseRedis()) {
    try {
      const rawValue = await redisClient.get(getSessionKey(sessionId));
      if (rawValue) {
        return JSON.parse(rawValue);
      }
    } catch (error) {
      // Fall back to in-memory storage if Redis is temporarily unavailable.
    }
  }

  return readFromMemory(sessionId);
};

const writeSession = async (session) => {
  const updatedSession = {
    ...session,
    updatedAt: new Date().toISOString(),
  };

  writeToMemory(updatedSession);

  if (canUseRedis()) {
    try {
      await redisClient.set(getSessionKey(updatedSession.sessionId), JSON.stringify(updatedSession), {
        EX: SESSION_TTL_SECONDS,
      });
    } catch (error) {
      // Keep the in-memory copy even if Redis write fails.
    }
  }

  return updatedSession;
};

const deleteSession = async (sessionId) => {
  if (!sessionId) {
    return;
  }

  memorySessions.delete(sessionId);

  if (canUseRedis()) {
    try {
      await redisClient.del(getSessionKey(sessionId));
    } catch (error) {
      // Ignore delete failure and let the in-memory state act as the source of truth.
    }
  }
};

const normalizeSessionContext = (context = {}) => ({
  company: cleanText(context.company),
  round: cleanText(context.round),
  domain: cleanText(context.domain).toLowerCase() || "general",
  skills: normalizeList(context.skills),
  focus: normalizeList(context.focus),
  currentDifficulty: normalizeDifficulty(context.difficulty),
  title: cleanText(context.title),
  category: cleanText(context.category),
  mode: cleanText(context.mode),
  responseMode: normalizeResponseMode(context.responseMode),
  questionTarget: normalizePositiveInteger(context.questionTarget, 0),
  resumeFileName: cleanText(context.resumeFileName),
  resumeParser: cleanText(context.resumeParser),
  resumeSkills: normalizeResumeSkills(context.resumeSkills),
});

const mergeUniqueHistory = (values = [], nextValue, limit = 12) => {
  if (!nextValue) {
    return values.slice(-limit);
  }

  const mergedValues = [...values, nextValue];
  return mergedValues.slice(-limit);
};

const createSession = (context = {}, sessionId) => {
  const normalizedContext = normalizeSessionContext(context);
  const now = new Date().toISOString();
  const startsAtMedium = normalizedContext.currentDifficulty === "medium";

  return {
    sessionId: sessionId || randomUUID(),
    company: normalizedContext.company,
    round: normalizedContext.round,
    domain: normalizedContext.domain,
    title: normalizedContext.title,
    category: normalizedContext.category,
    mode: normalizedContext.mode,
    responseMode: normalizedContext.responseMode || "text",
    skills: normalizedContext.skills,
    focus: normalizedContext.focus,
    questionTarget: normalizedContext.questionTarget || 8,
    resumeFileName: normalizedContext.resumeFileName,
    resumeParser: normalizedContext.resumeParser,
    resumeSkills: normalizedContext.resumeSkills,
    currentDifficulty: normalizedContext.currentDifficulty,
    questionCount: 0,
    askedQuestions: [],
    askedTopics: [],
    history: [],
    lastQuestion: null,
    lastEvaluation: null,
    mediumSuccessStreak: 0,
    mediumPromotionThreshold: startsAtMedium ? 2 : 0,
    createdAt: now,
    updatedAt: now,
  };
};

const hydrateSession = (session, context = {}) => {
  const normalizedContext = normalizeSessionContext(context);
  const currentDifficulty =
    session.currentDifficulty || normalizedContext.currentDifficulty || "medium";
  const normalizedDifficulty = normalizeDifficulty(currentDifficulty);
  const existingMediumSuccessStreak = normalizeProgressionValue(session.mediumSuccessStreak, 0);
  const existingMediumPromotionThreshold = normalizeProgressionValue(
    session.mediumPromotionThreshold,
    normalizedDifficulty === "medium" ? 2 : 0,
  );

  return {
    ...session,
    company: normalizedContext.company || session.company,
    round: normalizedContext.round || session.round,
    domain: normalizedContext.domain || session.domain || "general",
    title: normalizedContext.title || session.title || "",
    category: normalizedContext.category || session.category || "",
    mode: normalizedContext.mode || session.mode || "",
    responseMode: normalizedContext.responseMode || session.responseMode || "text",
    skills: normalizedContext.skills.length > 0 ? normalizedContext.skills : session.skills || [],
    focus: normalizedContext.focus.length > 0 ? normalizedContext.focus : session.focus || [],
    questionTarget: normalizedContext.questionTarget || session.questionTarget || 8,
    resumeFileName: normalizedContext.resumeFileName || session.resumeFileName || "",
    resumeParser: normalizedContext.resumeParser || session.resumeParser || "",
    resumeSkills:
      Object.values(normalizedContext.resumeSkills || {}).some((items) => Array.isArray(items) && items.length > 0)
        ? normalizedContext.resumeSkills
        : session.resumeSkills || normalizeResumeSkills(),
    currentDifficulty: normalizedDifficulty,
    mediumSuccessStreak: normalizedDifficulty === "medium" ? existingMediumSuccessStreak : 0,
    mediumPromotionThreshold:
      normalizedDifficulty === "medium" ? existingMediumPromotionThreshold : 0,
  };
};

const getOrCreateInterviewSession = async ({ sessionId, context, reset = false }) => {
  if (reset && sessionId) {
    await deleteSession(sessionId);
  }

  const existingSession = reset ? null : await readSession(sessionId);
  const activeSession = existingSession
    ? hydrateSession(existingSession, context)
    : createSession(context, sessionId);

  return writeSession(activeSession);
};

const getDifficultyOrder = () => ["easy", "medium", "hard"];

const getDifficultyProgression = (session = {}, difficulty, score) => {
  const normalizedDifficulty = normalizeDifficulty(difficulty);
  const numericScore = Number(score) || 0;
  const isCorrectAnswer = numericScore >= 6;
  const mediumSuccessStreak = normalizeProgressionValue(session.mediumSuccessStreak, 0);
  const mediumPromotionThreshold = normalizeProgressionValue(
    session.mediumPromotionThreshold,
    normalizedDifficulty === "medium" ? 2 : 0,
  );

  if (normalizedDifficulty === "easy") {
    if (isCorrectAnswer) {
      return {
        nextDifficulty: "medium",
        mediumSuccessStreak: 0,
        mediumPromotionThreshold: 2,
      };
    }

    return {
      nextDifficulty: "easy",
      mediumSuccessStreak: 0,
      mediumPromotionThreshold: 0,
    };
  }

  if (normalizedDifficulty === "medium") {
    if (isCorrectAnswer) {
      const requiredCorrectAnswers = mediumPromotionThreshold || 2;
      const nextMediumSuccessStreak = mediumSuccessStreak + 1;

      if (nextMediumSuccessStreak >= requiredCorrectAnswers) {
        return {
          nextDifficulty: "hard",
          mediumSuccessStreak: 0,
          mediumPromotionThreshold: 0,
        };
      }

      return {
        nextDifficulty: "medium",
        mediumSuccessStreak: nextMediumSuccessStreak,
        mediumPromotionThreshold: requiredCorrectAnswers,
      };
    }

    return {
      nextDifficulty: "easy",
      mediumSuccessStreak: 0,
      mediumPromotionThreshold: 0,
    };
  }

  if (normalizedDifficulty === "hard") {
    if (isCorrectAnswer) {
      return {
        nextDifficulty: "hard",
        mediumSuccessStreak: 0,
        mediumPromotionThreshold: 0,
      };
    }

    return {
      nextDifficulty: "medium",
      mediumSuccessStreak: 0,
      mediumPromotionThreshold: 1,
    };
  }

  return {
    nextDifficulty: normalizedDifficulty,
    mediumSuccessStreak: 0,
    mediumPromotionThreshold: 0,
  };
};

const getNextDifficulty = (difficulty, score, session = {}) => {
  const progression = getDifficultyProgression(session, difficulty, score);
  return progression.nextDifficulty;
};

const getQuestionProgression = (session, requestedDifficulty) => ({
  sessionId: session.sessionId,
  difficulty: normalizeDifficulty(session.currentDifficulty || requestedDifficulty),
  questionNumber: Number(session.questionCount || 0) + 1,
  previousQuestions: Array.isArray(session.askedQuestions) ? session.askedQuestions : [],
  previousTopics: Array.isArray(session.askedTopics) ? session.askedTopics : [],
});

const recordGeneratedQuestion = async (sessionId, questionData, difficulty) => {
  const session = await readSession(sessionId);
  if (!session) {
    return null;
  }

  const normalizedDifficulty = normalizeDifficulty(difficulty || session.currentDifficulty);
  const baselineMediumSuccessStreak = normalizeProgressionValue(session.mediumSuccessStreak, 0);
  const baselineMediumPromotionThreshold = normalizeProgressionValue(
    session.mediumPromotionThreshold,
    normalizedDifficulty === "medium" ? 2 : 0,
  );

  const nextSession = {
    ...session,
    currentDifficulty: normalizedDifficulty,
    questionCount: Number(session.questionCount || 0) + 1,
    askedQuestions: mergeUniqueHistory(session.askedQuestions || [], questionData?.question),
    askedTopics: mergeUniqueHistory(session.askedTopics || [], questionData?.topic),
    lastQuestion: questionData
      ? {
          ...questionData,
          difficulty: normalizedDifficulty,
          baselineMediumSuccessStreak,
          baselineMediumPromotionThreshold,
        }
      : null,
    history: [...(session.history || []), {
      type: "question",
      question: questionData?.question || "",
      topic: questionData?.topic || "",
      difficulty: normalizedDifficulty,
      createdAt: new Date().toISOString(),
    }].slice(-20),
  };

  return writeSession(nextSession);
};

const recordAnswerEvaluation = async (sessionId, payload = {}) => {
  const session = await readSession(sessionId);
  if (!session) {
    return null;
  }

  const normalizedQuestion = cleanText(payload.question);
  const currentDifficulty = normalizeDifficulty(
    session.lastQuestion?.difficulty || session.currentDifficulty || payload.difficulty,
  );
  const progressionBaseline = {
    mediumSuccessStreak: normalizeProgressionValue(
      session.lastQuestion?.baselineMediumSuccessStreak,
      session.mediumSuccessStreak,
    ),
    mediumPromotionThreshold: normalizeProgressionValue(
      session.lastQuestion?.baselineMediumPromotionThreshold,
      currentDifficulty === "medium" ? 2 : session.mediumPromotionThreshold,
    ),
  };
  const progression = getDifficultyProgression(
    progressionBaseline,
    currentDifficulty,
    payload.evaluation?.score || 0,
  );
  const nextDifficulty = progression.nextDifficulty;
  const currentHistory = Array.isArray(session.history) ? session.history : [];
  const lastHistoryEntry = currentHistory[currentHistory.length - 1];
  const shouldReplaceLastAnswer =
    lastHistoryEntry?.type === "answer" &&
    cleanText(lastHistoryEntry.question) === normalizedQuestion;
  const nextAnswerEntry = {
    type: "answer",
    question: payload.question || "",
    topic: session.lastQuestion?.topic || "",
    answer: payload.answer || "",
    score: payload.evaluation?.score || 0,
    difficulty: currentDifficulty,
    resultingDifficulty: nextDifficulty,
    confidence: payload.evaluation?.confidence || "",
    trend: payload.evaluation?.trend || "",
    review: {
      feedback: payload.evaluation?.feedback || "",
      strength: payload.evaluation?.strength || "",
      improvement: payload.evaluation?.improvement || "",
      idealAnswer: payload.evaluation?.idealAnswer || "",
    },
    mediumSuccessStreak: progression.mediumSuccessStreak,
    mediumPromotionThreshold: progression.mediumPromotionThreshold,
    createdAt: shouldReplaceLastAnswer ? lastHistoryEntry.createdAt : new Date().toISOString(),
  };
  const nextHistory = shouldReplaceLastAnswer
    ? [...currentHistory.slice(0, -1), nextAnswerEntry]
    : [...currentHistory, nextAnswerEntry];

  const nextSession = {
    ...session,
    currentDifficulty: nextDifficulty,
    mediumSuccessStreak: progression.mediumSuccessStreak,
    mediumPromotionThreshold: progression.mediumPromotionThreshold,
    lastEvaluation: {
      question: payload.question || "",
      answer: payload.answer || "",
      ...payload.evaluation,
    },
    history: nextHistory.slice(-20),
  };

  const updatedSession = await writeSession(nextSession);
  return {
    session: updatedSession,
    nextDifficulty,
  };
};

module.exports = {
  deleteSession,
  getDifficultyOrder,
  getDifficultyProgression,
  getNextDifficulty,
  getOrCreateInterviewSession,
  getQuestionProgression,
  normalizeDifficulty,
  recordAnswerEvaluation,
  recordGeneratedQuestion,
};
