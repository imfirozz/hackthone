const InterviewSessionRecord = require("../Models/InterviewSessionRecord");

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

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return uniqueList(value);
  }

  if (typeof value === "string") {
    return uniqueList(value.split(/,|;|\||\n/));
  }

  return [];
};

const normalizeResponseMode = (value = "") => {
  const normalizedValue = cleanText(value).toLowerCase();

  if (["voice", "hybrid", "text"].includes(normalizedValue)) {
    return normalizedValue;
  }

  return "text";
};

const toDateOrNull = (value) => {
  if (!value) {
    return null;
  }

  const parsedValue = new Date(value);
  return Number.isNaN(parsedValue.getTime()) ? null : parsedValue;
};

const normalizeResumeSkills = (value = {}) => ({
  languages: normalizeList(value?.languages),
  frameworks: normalizeList(value?.frameworks),
  tools: normalizeList(value?.tools),
  concepts: normalizeList(value?.concepts),
});

const getQuestionEntries = (session = {}) =>
  Array.isArray(session.history) ? session.history.filter((entry) => entry?.type === "question") : [];

const getAnswerEntries = (session = {}) =>
  Array.isArray(session.history) ? session.history.filter((entry) => entry?.type === "answer") : [];

const buildQuestionTimestampMap = (session = {}) =>
  getQuestionEntries(session).reduce((questionMap, entry) => {
    const key = cleanText(entry?.question).toLowerCase();

    if (key && !questionMap.has(key)) {
      questionMap.set(key, {
        askedAt: toDateOrNull(entry?.createdAt),
        topic: cleanText(entry?.topic),
      });
    }

    return questionMap;
  }, new Map());

const buildInterviewSteps = (session = {}) => {
  const questionTimestampMap = buildQuestionTimestampMap(session);

  return getAnswerEntries(session).map((entry) => {
    const questionKey = cleanText(entry?.question).toLowerCase();
    const questionMeta = questionTimestampMap.get(questionKey) || {};

    return {
      question: cleanText(entry?.question),
      topic: cleanText(entry?.topic || questionMeta.topic),
      difficulty: cleanText(entry?.difficulty),
      answer: cleanText(entry?.answer),
      score: Number(entry?.score) || 0,
      confidence: cleanText(entry?.confidence),
      trend: cleanText(entry?.trend),
      review: {
        feedback: cleanText(entry?.review?.feedback),
        strength: cleanText(entry?.review?.strength),
        improvement: cleanText(entry?.review?.improvement),
        idealAnswer: cleanText(entry?.review?.idealAnswer),
      },
      askedAt: questionMeta.askedAt,
      submittedAt: toDateOrNull(entry?.createdAt),
    };
  });
};

const resolveSessionStatus = (session = {}) => {
  const questionTarget = Number(session.questionTarget) || 0;
  const answerCount = getAnswerEntries(session).length;
  const questionCount = Number(session.questionCount) || 0;

  if (questionTarget > 0 && answerCount >= questionTarget) {
    return "completed";
  }

  if (questionCount > 0 && answerCount === 0) {
    return "started";
  }

  if (answerCount > 0) {
    return "in_progress";
  }

  return "started";
};

const persistInterviewSessionState = async ({ session, user = null }) => {
  if (!session?.sessionId) {
    return null;
  }

  const existingRecord = await InterviewSessionRecord.findOne({ sessionId: session.sessionId });
  const steps = buildInterviewSteps(session);
  const status = resolveSessionStatus(session);
  const startedAt =
    existingRecord?.startedAt || toDateOrNull(session.createdAt) || new Date();
  const completedAt =
    status === "completed" ? existingRecord?.completedAt || new Date() : existingRecord?.completedAt || null;

  return InterviewSessionRecord.findOneAndUpdate(
    { sessionId: session.sessionId },
    {
      $set: {
        user: user?._id || existingRecord?.user || null,
        title: cleanText(session.title),
        category: cleanText(session.category),
        mode: cleanText(session.mode),
        responseMode: normalizeResponseMode(session.responseMode),
        company: cleanText(session.company),
        round: cleanText(session.round),
        domain: cleanText(session.domain) || "general",
        skills: normalizeList(session.skills),
        focus: normalizeList(session.focus),
        questionTarget: Number(session.questionTarget) || 8,
        currentDifficulty: cleanText(session.currentDifficulty) || "medium",
        questionCount: Number(session.questionCount) || 0,
        answerCount: steps.length,
        status,
        resumeFileName: cleanText(session.resumeFileName),
        resumeParser: cleanText(session.resumeParser),
        resumeSkills: normalizeResumeSkills(session.resumeSkills),
        lastQuestion: session.lastQuestion || null,
        lastEvaluation: session.lastEvaluation || null,
        steps,
        startedAt,
        completedAt,
      },
      $setOnInsert: {
        sessionId: cleanText(session.sessionId),
      },
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    },
  );
};

module.exports = {
  persistInterviewSessionState,
};
