const { createHash } = require("crypto");
const express = require("express");
const multer = require("multer");
const optionalUserMiddleware = require("../middleware/optionalUserMiddleware");
const {
  analyzePerformanceHistory,
  evaluateInterviewAnswer,
} = require("../services/aiInterviewEvaluator");
const { transcribeInterviewAudio } = require("../services/aiInterviewTranscriber");
const { simulateInterviewEngine } = require("../services/interviewEngineTester");
const {
  analyzeSkills,
  generateInterviewQuestion,
  normalizeFocusAreas,
} = require("../services/aiInterviewQuestionGenerator");
const { createInterviewMentorResponse } = require("../services/aiInterviewMentor");
const {
  getOrCreateInterviewSession,
  getQuestionProgression,
  normalizeDifficulty,
  recordAnswerEvaluation,
  recordGeneratedQuestion,
} = require("../services/interviewSessionService");
const { persistInterviewSessionState } = require("../services/interviewPersistenceService");

const interviewRouter = express.Router();
interviewRouter.use(optionalUserMiddleware);
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 12 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    const normalizedMimeType = normalizeField(file?.mimetype).toLowerCase();
    const isAudioFile =
      normalizedMimeType.startsWith("audio/") ||
      /\.(wav|mp3|m4a|aac|ogg|flac|webm)$/i.test(file?.originalname || "");

    if (!isAudioFile) {
      return callback(new Error("Only audio files are allowed for transcription."));
    }

    return callback(null, true);
  },
});

const normalizeField = (value) => (typeof value === "string" ? value.trim() : "");
const normalizeBoolean = (value) => value === true || value === "true" || value === 1 || value === "1";
const normalizeScore = (value) => {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  return Math.max(0, Math.min(10, Math.round(parsedValue)));
};

const normalizeScoreList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeScore(item)).filter((score) => score !== null);
  }

  if (typeof value === "string") {
    return value
      .split(/,|;|\||\n/)
      .map((item) => normalizeScore(item))
      .filter((score) => score !== null);
  }

  return [];
};

const normalizePositiveInteger = (value, fallback = 8) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? Math.round(parsedValue) : fallback;
};

const normalizeResponseMode = (value = "") => {
  const normalizedValue = normalizeField(value).toLowerCase();
  return ["text", "voice", "hybrid"].includes(normalizedValue) ? normalizedValue : "text";
};

const normalizeResumeSkills = (value = {}) => ({
  languages: Array.isArray(value?.languages) ? value.languages.map((item) => normalizeField(item)).filter(Boolean) : [],
  frameworks: Array.isArray(value?.frameworks) ? value.frameworks.map((item) => normalizeField(item)).filter(Boolean) : [],
  tools: Array.isArray(value?.tools) ? value.tools.map((item) => normalizeField(item)).filter(Boolean) : [],
  concepts: Array.isArray(value?.concepts) ? value.concepts.map((item) => normalizeField(item)).filter(Boolean) : [],
});

const getSessionAnswerScores = (session) =>
  Array.isArray(session?.history)
    ? session.history
        .filter((entry) => entry?.type === "answer")
        .map((entry) => normalizeScore(entry?.score))
        .filter((score) => score !== null)
    : [];

const getSessionAnswerEntries = (session) =>
  Array.isArray(session?.history) ? session.history.filter((entry) => entry?.type === "answer") : [];

const normalizeComparisonText = (value) => normalizeField(String(value || "")).toLowerCase();

const compressAnswerEntries = (entries = []) =>
  entries.reduce((compressedEntries, entry) => {
    const lastEntry = compressedEntries[compressedEntries.length - 1];
    const currentQuestionKey = normalizeComparisonText(entry?.question);
    const lastQuestionKey = normalizeComparisonText(lastEntry?.question);
    const currentAnswerKey = normalizeComparisonText(entry?.answer);
    const lastAnswerKey = normalizeComparisonText(lastEntry?.answer);
    const isSameQuestionRetry = currentQuestionKey && currentQuestionKey === lastQuestionKey;
    const isSameAnswerRetry =
      !currentQuestionKey &&
      currentAnswerKey &&
      currentAnswerKey === lastAnswerKey &&
      normalizeDifficulty(entry?.difficulty || entry?.resultingDifficulty) ===
        normalizeDifficulty(lastEntry?.difficulty || lastEntry?.resultingDifficulty);

    if (lastEntry && (isSameQuestionRetry || isSameAnswerRetry)) {
      compressedEntries[compressedEntries.length - 1] = entry;
      return compressedEntries;
    }

    compressedEntries.push(entry);
    return compressedEntries;
  }, []);

const buildInterviewSteps = (session) => {
  const answerEntries = compressAnswerEntries(getSessionAnswerEntries(session));

  const cumulativeScores = [];

  return answerEntries.reduce((steps, entry) => {
    const stepScore = normalizeScore(entry?.score);

    if (stepScore === null) {
      return steps;
    }

    const previousScores = cumulativeScores.slice();
    cumulativeScores.push(stepScore);
    const stepAllScores = cumulativeScores.slice();
    const stepRecentScores = stepAllScores.slice(-3);
    const performance = analyzePerformanceHistory({
      allScores: previousScores,
      currentScore: stepScore,
    });

    steps.push({
      answer: normalizeField(entry?.answer),
      score: stepScore,
      difficulty: normalizeDifficulty(entry?.difficulty || entry?.resultingDifficulty),
      recentScores: stepRecentScores,
      allScores: stepAllScores,
      confidence: performance.confidence,
      trend: performance.trend,
    });

    return steps;
  }, []);
};

const buildDefaultSessionId = (req) =>
  `interview-${createHash("sha1").update(String(req.ip || "local")).digest("hex").slice(0, 16)}`;

const hasBodyField = (body, fieldNames = []) =>
  fieldNames.some((fieldName) => Object.prototype.hasOwnProperty.call(body || {}, fieldName));

const buildSkillValidationError = (skillAnalysis) => ({
  message: "skills must include at least one valid technical skill.",
  invalidSkills: skillAnalysis.invalidSkills,
});

const buildRequiredFieldsError = (fields = []) => ({
  message: `${fields.join(", ")} ${fields.length === 1 ? "is" : "are"} required.`,
});

const buildEmptyListError = (fieldName) => ({
  message: `${fieldName} must include at least one non-empty value.`,
});

const buildQuestionRequestValidation = (body = {}) => {
  const company = normalizeField(body?.company);
  const round = normalizeField(body?.round || body?.interviewRound) || "technical";
  const difficulty = normalizeField(body?.difficulty || body?.level || body?.difficultyLevel);
  const domain = normalizeField(body?.domain || body?.role);
  const skillAnalysis = analyzeSkills(body?.skills || body?.candidateSkills);
  const focus = normalizeFocusAreas(body?.focus || body?.focusAreas);
  const questionNumber = Number(body?.questionNumber) || 1;
  const title = normalizeField(body?.title);
  const category = normalizeField(body?.category);
  const mode = normalizeField(body?.mode);
  const responseMode = normalizeResponseMode(body?.responseMode);
  const questionTarget = normalizePositiveInteger(body?.questionTarget, 8);
  const resumeFileName = normalizeField(body?.resumeFileName);
  const resumeParser = normalizeField(body?.resumeParser);
  const resumeSkills = normalizeResumeSkills(body?.resumeSkills);
  const missingFields = [];

  if (!company) {
    missingFields.push("company");
  }

  if (!difficulty) {
    missingFields.push("difficulty");
  }

  if (!domain) {
    missingFields.push("domain");
  }

  if (missingFields.length > 0) {
    return {
      ok: false,
      status: 400,
      error: buildRequiredFieldsError(missingFields),
    };
  }

  if (hasBodyField(body, ["skills", "candidateSkills"]) && skillAnalysis.rawSkills.length === 0) {
    return {
      ok: false,
      status: 400,
      error: buildEmptyListError("skills"),
    };
  }

  if (skillAnalysis.rawSkills.length > 0 && skillAnalysis.validSkills.length === 0) {
    return {
      ok: false,
      status: 400,
      error: buildSkillValidationError(skillAnalysis),
    };
  }

  if (hasBodyField(body, ["focus", "focusAreas"]) && focus.length === 0) {
    return {
      ok: false,
      status: 400,
      error: buildEmptyListError("focus"),
    };
  }

  if (skillAnalysis.validSkills.length === 0 && focus.length === 0) {
    return {
      ok: false,
      status: 400,
      error: {
        message: "At least one valid skill or focus area is required.",
      },
    };
  }

  return {
    ok: true,
    value: {
      company,
      round,
      difficulty,
      domain,
      questionNumber,
      skillAnalysis,
      skills: skillAnalysis.validSkills,
      focus,
      title,
      category,
      mode,
      responseMode,
      questionTarget,
      resumeFileName,
      resumeParser,
      resumeSkills,
    },
  };
};

const isQuestionGenerationRequest = (body) => {
  const company = normalizeField(body?.company);
  const round = normalizeField(body?.round || body?.interviewRound) || "technical";
  const difficulty = normalizeField(body?.difficulty || body?.level || body?.difficultyLevel);
  const question = normalizeField(body?.question);
  const answer = normalizeField(body?.answer);
  const skill = normalizeField(body?.skill);

  if (question || answer || skill) {
    return false;
  }

  return Boolean(company && round && difficulty);
};

const handleInterviewEvaluation = async (req, res) => {
  try {
    if (isQuestionGenerationRequest(req.body)) {
      return handleInterviewQuestionGeneration(req, res);
    }

    const question = normalizeField(req.body?.question);
    const answer = normalizeField(req.body?.answer);
    const skill = normalizeField(req.body?.skill);
    const difficulty = normalizeField(req.body?.difficulty || req.body?.level || req.body?.difficultyLevel);
    const providedSessionId = normalizeField(req.body?.sessionId);
    const shouldTrackSession = req.path === "/submit-answer" || Boolean(providedSessionId);
    const sessionId = shouldTrackSession ? providedSessionId || buildDefaultSessionId(req) : "";
    let session = null;

    if (!question || !answer || !skill || !difficulty) {
      return res.status(400).json({
        message: "question, answer, skill, and difficulty are required.",
      });
    }

    if (shouldTrackSession) {
      session = await getOrCreateInterviewSession({
        sessionId,
        context: {
          difficulty,
        },
      });
    }

    const sessionScores = getSessionAnswerScores(session);
    const requestRecentScores = normalizeScoreList(req.body?.recentScores);
    const requestAllScores = normalizeScoreList(req.body?.allScores);
    const recentScores = requestRecentScores.length > 0 ? requestRecentScores : sessionScores.slice(-5);
    const allScores = requestAllScores.length > 0 ? requestAllScores : sessionScores;
    const isSubmitAnswerRoute = req.path === "/submit-answer";

    const result = await evaluateInterviewAnswer({
      question,
      answer,
      skill,
      difficulty,
      recentScores,
      allScores,
    });

    let nextDifficulty = normalizeDifficulty(difficulty);
    let updatedSession = session;

    if (shouldTrackSession) {
      const sessionUpdate = await recordAnswerEvaluation(sessionId, {
        question,
        answer,
        difficulty,
        evaluation: result.evaluation,
      });

      if (sessionUpdate?.nextDifficulty) {
        nextDifficulty = sessionUpdate.nextDifficulty;
      }
      updatedSession = sessionUpdate?.session || session;

      if (updatedSession) {
        await persistInterviewSessionState({
          session: updatedSession,
          user: req.result || null,
        });
      }
    }

    if (isSubmitAnswerRoute) {
      return res.status(200).json({
        ...(shouldTrackSession ? { sessionId, nextDifficulty } : {}),
        review: {
          feedback: result.evaluation.feedback,
          strength: result.evaluation.strength,
          improvement: result.evaluation.improvement,
          idealAnswer: result.evaluation.idealAnswer,
        },
        steps: buildInterviewSteps(updatedSession),
      });
    }

    return res.status(200).json({
      message: "Answer evaluated successfully",
      evaluator: result.evaluator,
      ...(shouldTrackSession ? { sessionId, nextDifficulty } : {}),
      data: result.evaluation,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to evaluate answer",
      error: error.message,
    });
  }
};

const handleInterviewQuestionGeneration = async (req, res) => {
  try {
    const validation = buildQuestionRequestValidation(req.body);

    if (!validation.ok) {
      return res.status(validation.status).json(validation.error);
    }

    const { company, round, difficulty, skills, focus, domain, questionNumber } = validation.value;

    const result = await generateInterviewQuestion({
      company,
      round,
      skills,
      difficulty,
      focus,
      domain,
      questionNumber,
    });

    return res.status(200).json({
      message: "Question generated successfully",
      generator: result.generator,
      data: result.question,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to generate question",
      error: error.message,
    });
  }
};

const handleInterviewMentor = async (req, res) => {
  try {
    const result = await createInterviewMentorResponse({
      body: req.body,
      user: req.result || null,
    });

    if (result?.error) {
      return res.status(result.error.status || 400).json({
        message: result.error.message || "Failed to generate mentor response.",
      });
    }

    return res.status(200).json({
      message: "Mentor response generated successfully",
      mentor: result.mentor,
      mode: result.mode,
      intent: result.intent,
      conversationMode: result.conversationMode || "interview",
      profile: result.profile,
      data: result.data,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to generate mentor response",
      error: error.message,
    });
  }
};

const handleNextQuestion = async (req, res) => {
  try {
    const validation = buildQuestionRequestValidation(req.body);
    const requestedSessionId = normalizeField(req.body?.sessionId) || buildDefaultSessionId(req);
    const reset = normalizeBoolean(req.body?.reset);

    if (!validation.ok) {
      return res.status(validation.status).json(validation.error);
    }

    const {
      company,
      round,
      difficulty,
      skills,
      focus,
      domain,
      title,
      category,
      mode,
      responseMode,
      questionTarget,
      resumeFileName,
      resumeParser,
      resumeSkills,
    } = validation.value;

    const session = await getOrCreateInterviewSession({
      sessionId: requestedSessionId,
      context: {
        company,
        round,
        domain,
        skills,
        focus,
        difficulty,
        title,
        category,
        mode,
        responseMode,
        questionTarget,
        resumeFileName,
        resumeParser,
        resumeSkills,
      },
      reset,
    });

    const progression = getQuestionProgression(session, difficulty);
    const result = await generateInterviewQuestion({
      company: session.company,
      round: session.round,
      skills: session.skills,
      difficulty: progression.difficulty,
      focus: session.focus,
      domain: session.domain,
      questionNumber: progression.questionNumber,
      previousQuestions: progression.previousQuestions,
      previousTopics: progression.previousTopics,
      variantSeed: session.sessionId,
    });

    const updatedSession = await recordGeneratedQuestion(
      session.sessionId,
      result.question,
      progression.difficulty,
    );

    if (updatedSession) {
      await persistInterviewSessionState({
        session: updatedSession,
        user: req.result || null,
      });
    }

    return res.status(200).json({
      message: "Question generated successfully",
      generator: result.generator,
      sessionId: session.sessionId,
      questionNumber: updatedSession?.questionCount || progression.questionNumber,
      difficulty: updatedSession?.currentDifficulty || progression.difficulty,
      data: result.question,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to generate next question",
      error: error.message,
    });
  }
};

const handleAudioTranscription = async (req, res) => {
  audioUpload.single("audio")(req, res, async (error) => {
    try {
      if (error) {
        return res.status(400).json({ message: error.message });
      }

      if (!req.file?.buffer) {
        return res.status(400).json({
          message:
            "Recorded audio is required. Send it as multipart/form-data using the field name 'audio'.",
        });
      }

      const result = await transcribeInterviewAudio({
        audioBuffer: req.file.buffer,
        mimeType: normalizeField(req.file.mimetype) || "audio/wav",
      });

      return res.status(200).json({
        message: "Audio transcribed successfully",
        transcriber: result.transcriber,
        transcript: result.transcript,
      });
    } catch (transcriptionError) {
      const normalizedMessage = normalizeField(transcriptionError.message);
      const statusCode =
        normalizedMessage.includes("not configured") || normalizedMessage.includes("api_key")
          ? 503
          : 500;

      return res.status(statusCode).json({
        message: normalizedMessage || "Failed to transcribe audio.",
      });
    }
  });
};

const handleInterviewEngineTest = async (req, res) => {
  try {
    const answersSequence = Array.isArray(req.body?.answersSequence)
      ? req.body.answersSequence
          .map((item) => {
            if (typeof item === "string") {
              return item.trim();
            }

            if (item && typeof item === "object") {
              const normalizedAnswer =
                typeof item.answer === "string"
                  ? item.answer.trim()
                  : typeof item.response === "string"
                    ? item.response.trim()
                    : typeof item.text === "string"
                      ? item.text.trim()
                      : "";

              if (!normalizedAnswer) {
                return null;
              }

              return {
                ...item,
                answer: normalizedAnswer,
              };
            }

            return null;
          })
          .filter(Boolean)
      : [];
    const question = normalizeField(req.body?.question);
    const skill = normalizeField(req.body?.skill);

    if (answersSequence.length === 0) {
      return res.status(400).json({
        message: "answersSequence is required and must be a non-empty array.",
      });
    }

    const result = await simulateInterviewEngine({
      answersSequence,
      question,
      skill,
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to simulate interview engine",
      error: error.message,
    });
  }
};

interviewRouter.post("/", handleInterviewEvaluation);
interviewRouter.post("/evaluate", handleInterviewEvaluation);
interviewRouter.post("/submit-answer", handleInterviewEvaluation);
interviewRouter.post("/question", handleInterviewQuestionGeneration);
interviewRouter.post("/generate-question", handleInterviewQuestionGeneration);
interviewRouter.post("/next-question", handleNextQuestion);
interviewRouter.post("/mentor", handleInterviewMentor);
interviewRouter.post("/coach", handleInterviewMentor);
interviewRouter.post("/transcribe-audio", handleAudioTranscription);
interviewRouter.post("/test-engine", handleInterviewEngineTest);
interviewRouter.post("/simulate-engine", handleInterviewEngineTest);

module.exports = interviewRouter;
