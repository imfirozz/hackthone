const InterviewSessionRecord = require("../Models/InterviewSessionRecord");

const METRIC_LABELS = {
  communication: "Communication",
  technical: "Technical Depth",
  confidence: "Confidence",
  problemSolving: "Problem Solving",
  systemDesign: "System Design",
  delivery: "Delivery",
};

const CONFIDENCE_SCORE_MAP = {
  low: 58,
  medium: 74,
  high: 90,
};

const DIFFICULTY_BOOST_MAP = {
  easy: 0,
  medium: 4,
  hard: 8,
};

const FRONTEND_KEYWORDS = [
  "frontend",
  "react",
  "react.js",
  "redux",
  "redux toolkit",
  "react router",
  "html",
  "css",
  "tailwind",
  "browser api",
  "javascript",
  "flexbox",
  "parcel",
  "responsive",
  "ui",
];

const BACKEND_KEYWORDS = [
  "backend",
  "node",
  "express",
  "mongodb",
  "mongo",
  "redis",
  "sql",
  "mysql",
  "postgres",
  "api",
  "database",
  "server",
  "authentication",
];

const SYSTEM_DESIGN_KEYWORDS = [
  "system",
  "design",
  "scalability",
  "architecture",
  "distributed",
  "cache",
  "load balancing",
  "performance",
  "microservice",
];

const PROBLEM_SOLVING_KEYWORDS = [
  "algorithm",
  "algorithms",
  "data structures",
  "problem solving",
  "debug",
  "optimization",
  "trade-off",
  "tradeoff",
  "reasoning",
  "state management",
];

const normalizeText = (value = "") => String(value).replace(/\s+/g, " ").trim();

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const isValidDate = (value) =>
  value instanceof Date && !Number.isNaN(value.getTime());

const toValidDate = (value, fallback = new Date()) => {
  const parsedDate = value ? new Date(value) : null;

  if (isValidDate(parsedDate)) {
    return parsedDate;
  }

  return fallback;
};

const toTimestamp = (value, fallback = 0) => {
  const parsedDate = value instanceof Date ? value : new Date(value);

  if (isValidDate(parsedDate)) {
    return parsedDate.getTime();
  }

  return fallback;
};

const average = (values = []) => {
  const numericValues = values.filter((value) => Number.isFinite(value));

  if (numericValues.length === 0) {
    return 0;
  }

  return Math.round(
    numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length,
  );
};

const uniqueList = (values = []) =>
  values.reduce((items, value) => {
    const normalizedValue = normalizeText(value);

    if (
      normalizedValue &&
      !items.some((item) => item.toLowerCase() === normalizedValue.toLowerCase())
    ) {
      items.push(normalizedValue);
    }

    return items;
  }, []);

const titleCase = (value = "") =>
  normalizeText(value)
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      if (word.length <= 3 && /^[a-z0-9]+$/i.test(word)) {
        return word.toUpperCase();
      }

      return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
    })
    .join(" ");

const normalizeScope = (value = "", user = null) => {
  const normalizedValue = normalizeText(value).toLowerCase();

  if (normalizedValue === "mine" && user?._id) {
    return "mine";
  }

  return "all";
};

const flattenResumeSkills = (resumeSkills = {}) =>
  [
    ...(Array.isArray(resumeSkills?.languages) ? resumeSkills.languages : []),
    ...(Array.isArray(resumeSkills?.frameworks) ? resumeSkills.frameworks : []),
    ...(Array.isArray(resumeSkills?.tools) ? resumeSkills.tools : []),
    ...(Array.isArray(resumeSkills?.concepts) ? resumeSkills.concepts : []),
  ].map((value) => normalizeText(value)).filter(Boolean);

const getRecordTimestamp = (record = {}) => {
  const dateCandidates = [
    record.completedAt,
    record.updatedAt,
    record.startedAt,
    record.createdAt,
  ];

  const matchedDate = dateCandidates.find((value) => value);
  return toValidDate(matchedDate, new Date());
};

const getDateKey = (value) => {
  const parsedDate = toValidDate(value, null);

  if (!parsedDate) {
    return "";
  }

  return parsedDate.toISOString().slice(0, 10);
};

const calculateDurationMinutes = (record = {}) => {
  const startedAt = record?.startedAt ? toValidDate(record.startedAt, null) : null;
  const completedAt = record?.completedAt ? toValidDate(record.completedAt, null) : null;
  const latestStepAt = Array.isArray(record?.steps)
    ? [...record.steps]
        .map((step) => (step?.submittedAt ? toValidDate(step.submittedAt, null) : null))
        .filter((value) => isValidDate(value))
        .sort((left, right) => right.getTime() - left.getTime())[0]
    : null;
  const sessionEnd = completedAt || latestStepAt;

  if (
    startedAt &&
    sessionEnd &&
    isValidDate(startedAt) &&
    isValidDate(sessionEnd)
  ) {
    const diffInMinutes = Math.round(
      Math.max(sessionEnd.getTime() - startedAt.getTime(), 0) / 60000,
    );

    if (diffInMinutes > 0) {
      return clamp(diffInMinutes, 8, 120);
    }
  }

  const answerCount = Array.isArray(record?.steps) ? record.steps.length : 0;
  const questionCount = Number(record?.questionCount) || answerCount;
  return clamp(10 + answerCount * 4 + Math.max(questionCount - answerCount, 0) * 2, 10, 120);
};

const getLatestReview = (record = {}) => {
  const latestReviewedStep = Array.isArray(record?.steps)
    ? [...record.steps]
        .reverse()
        .find(
          (step) =>
            normalizeText(step?.review?.feedback) ||
            normalizeText(step?.review?.improvement),
        )
    : null;

  return {
    feedback:
      normalizeText(latestReviewedStep?.review?.feedback) ||
      normalizeText(record?.lastEvaluation?.feedback),
    improvement:
      normalizeText(latestReviewedStep?.review?.improvement) ||
      normalizeText(record?.lastEvaluation?.improvement),
  };
};

const getNormalizedSteps = (record = {}) => {
  const storedSteps = Array.isArray(record?.steps)
    ? record.steps.filter((step) => step && typeof step === "object")
    : [];

  if (storedSteps.length > 0) {
    return storedSteps;
  }

  const lastEvaluation = record?.lastEvaluation;
  if (!lastEvaluation || typeof lastEvaluation !== "object") {
    return [];
  }

  const fallbackScore = Number(lastEvaluation?.score);
  const fallbackQuestion = normalizeText(lastEvaluation?.question);
  const fallbackAnswer = normalizeText(lastEvaluation?.answer);
  const fallbackFeedback =
    normalizeText(lastEvaluation?.feedback) ||
    normalizeText(lastEvaluation?.improvement) ||
    normalizeText(lastEvaluation?.idealAnswer);

  if (
    !Number.isFinite(fallbackScore) &&
    !fallbackQuestion &&
    !fallbackAnswer &&
    !fallbackFeedback
  ) {
    return [];
  }

  return [
    {
      question: fallbackQuestion,
      topic:
        normalizeText(record?.lastQuestion?.topic) ||
        normalizeText(record?.lastQuestion?.skill) ||
        normalizeText(record?.domain),
      difficulty:
        normalizeText(record?.currentDifficulty) ||
        normalizeText(record?.lastQuestion?.difficulty) ||
        "medium",
      answer: fallbackAnswer,
      score: Number.isFinite(fallbackScore) ? fallbackScore : 0,
      confidence: normalizeText(lastEvaluation?.confidence),
      trend: normalizeText(lastEvaluation?.trend),
      review: {
        feedback: normalizeText(lastEvaluation?.feedback),
        strength: normalizeText(lastEvaluation?.strength),
        improvement: normalizeText(lastEvaluation?.improvement),
        idealAnswer: normalizeText(lastEvaluation?.idealAnswer),
      },
      askedAt: record?.startedAt || record?.createdAt || null,
      submittedAt:
        record?.completedAt || record?.updatedAt || record?.startedAt || null,
    },
  ];
};

const collectTagPool = (record = {}) =>
  uniqueList([
    record.domain,
    ...(Array.isArray(record.skills) ? record.skills : []),
    ...(Array.isArray(record.focus) ? record.focus : []),
    ...flattenResumeSkills(record.resumeSkills),
    ...(Array.isArray(record.steps)
      ? record.steps.flatMap((step) => [step?.topic, step?.difficulty])
      : []),
    record?.lastQuestion?.topic,
    record?.lastQuestion?.skill,
  ]);

const includesKeyword = (items = [], keywords = []) =>
  items.some((item) =>
    keywords.some((keyword) => item.includes(keyword.toLowerCase())),
  );

const resolveRoleLabel = (record = {}, loweredTags = []) => {
  const normalizedDomain = normalizeText(record?.domain).toLowerCase();

  if (normalizedDomain === "frontend") {
    return "Frontend Developer";
  }

  if (normalizedDomain === "backend") {
    if (includesKeyword(loweredTags, ["java", "spring"])) {
      return "Java Developer";
    }

    if (includesKeyword(loweredTags, ["python", "django", "flask", "fastapi"])) {
      return "Python Developer";
    }

    return "Backend Developer";
  }

  const hasFrontendSignals = includesKeyword(loweredTags, FRONTEND_KEYWORDS);
  const hasBackendSignals = includesKeyword(loweredTags, BACKEND_KEYWORDS);
  const hasJavaSignals = includesKeyword(loweredTags, ["java", "spring"]);
  const hasPythonSignals = includesKeyword(loweredTags, [
    "python",
    "django",
    "flask",
    "fastapi",
  ]);

  if (hasFrontendSignals && hasBackendSignals) {
    return "Full Stack Developer";
  }

  if (hasJavaSignals && !hasFrontendSignals) {
    return "Java Developer";
  }

  if (hasPythonSignals && !hasFrontendSignals) {
    return "Python Developer";
  }

  if (hasFrontendSignals) {
    return "Frontend Developer";
  }

  if (hasBackendSignals) {
    return "Backend Developer";
  }

  return "General Candidate";
};

const resolveRoundLabel = (record = {}) => {
  const normalizedMode = normalizeText(record?.mode).toLowerCase();
  const normalizedRound = normalizeText(record?.round).toLowerCase();

  if (normalizedMode === "mock" || normalizedRound === "mock") {
    return "Mock Interview";
  }

  if (normalizedMode === "technical" || normalizedRound === "technical") {
    return "Technical Interview";
  }

  if (normalizedMode === "hr" || normalizedRound === "hr") {
    return "HR Interview";
  }

  if (normalizedRound === "managerial" || normalizedMode === "managerial") {
    return "Managerial Interview";
  }

  if (normalizedRound) {
    return titleCase(normalizedRound);
  }

  return "Interview Session";
};

const resolveCompanyLabel = (record = {}) => {
  const explicitCompany = normalizeText(record?.company);

  if (explicitCompany) {
    return titleCase(explicitCompany);
  }

  if (/startup/i.test(normalizeText(record?.category))) {
    return "Startup";
  }

  return "AIX";
};

const resolveInterviewerLabel = (company = "AIX", round = "Interview Session") => {
  if (/hr/i.test(round)) {
    return `${company} People Panel`;
  }

  if (/managerial/i.test(round)) {
    return `${company} Leadership Panel`;
  }

  if (/technical/i.test(round)) {
    return `${company} Engineering Panel`;
  }

  return `${company} Interview Panel`;
};

const resolveCandidateName = (record = {}) => {
  const user = record?.user || {};
  const nameFromParts = [user.firstName, user.lastName]
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .join(" ");

  if (nameFromParts) {
    return nameFromParts;
  }

  const emailValue = normalizeText(user.email);
  if (emailValue.includes("@")) {
    return titleCase(emailValue.split("@")[0].replace(/[._-]+/g, " "));
  }

  return `Candidate ${String(record?.sessionId || "AIX").slice(-4).toUpperCase()}`;
};

const resolveCandidateEmail = (record = {}) =>
  normalizeText(record?.user?.email).toLowerCase();

const buildCandidateKey = (candidateName, candidateEmail) =>
  candidateEmail || candidateName.toLowerCase();

const deriveSessionMetrics = ({
  baseScore,
  confidenceValue,
  answerWordAverage,
  loweredTags,
  roundLabel,
  responseMode,
  currentDifficulty,
}) => {
  const designSignals = includesKeyword(loweredTags, SYSTEM_DESIGN_KEYWORDS) ? 8 : 0;
  const problemSignals = includesKeyword(loweredTags, PROBLEM_SOLVING_KEYWORDS) ? 7 : 0;
  const frontendSignals = includesKeyword(loweredTags, FRONTEND_KEYWORDS) ? 4 : 0;
  const backendSignals = includesKeyword(loweredTags, BACKEND_KEYWORDS) ? 5 : 0;
  const difficultyBoost =
    DIFFICULTY_BOOST_MAP[normalizeText(currentDifficulty).toLowerCase()] || 0;
  const voiceBoost = ["voice", "hybrid"].includes(normalizeText(responseMode).toLowerCase())
    ? 4
    : 0;
  const technicalRoundBoost = /technical/i.test(roundLabel) ? 6 : 0;
  const hrRoundBoost = /hr/i.test(roundLabel) ? 4 : 0;
  const answerDepthBoost = clamp(Math.round(answerWordAverage / 18), 0, 10);

  const communication = clamp(
    Math.round(baseScore * 0.72 + confidenceValue * 0.2 + answerDepthBoost + voiceBoost + hrRoundBoost),
    50,
    99,
  );
  const technical = clamp(
    Math.round(baseScore * 0.88 + technicalRoundBoost + difficultyBoost + frontendSignals + backendSignals),
    50,
    99,
  );
  const problemSolving = clamp(
    Math.round(baseScore * 0.84 + problemSignals + difficultyBoost),
    50,
    99,
  );
  const systemDesign = clamp(
    Math.round(baseScore * 0.8 + designSignals + backendSignals + technicalRoundBoost),
    50,
    99,
  );
  const delivery = clamp(
    Math.round((communication + confidenceValue + baseScore) / 3 + Math.min(answerDepthBoost, 5)),
    50,
    99,
  );

  return {
    communication,
    technical,
    confidence: clamp(confidenceValue, 50, 99),
    problemSolving,
    systemDesign,
    delivery,
  };
};

const normalizeInterviewRecord = (record = {}) => {
  const steps = getNormalizedSteps(record);

  if (steps.length === 0) {
    return null;
  }

  const tagPool = collectTagPool(record);
  const loweredTags = tagPool.map((tag) => tag.toLowerCase());
  const candidate = resolveCandidateName(record);
  const email = resolveCandidateEmail(record);
  const role = resolveRoleLabel(record, loweredTags);
  const round = resolveRoundLabel(record);
  const company = resolveCompanyLabel(record);
  const interviewer = resolveInterviewerLabel(company, round);
  const answerScores = steps
    .map((step) => Number(step?.score))
    .filter((value) => Number.isFinite(value));
  const averageStepScore = average(answerScores);
  const baseScore = clamp(Math.round(40 + averageStepScore * 6), 50, 100);
  const answerWordAverage = average(
    steps.map((step) =>
      normalizeText(step?.answer)
        .split(/\s+/)
        .filter(Boolean).length,
    ),
  );
  const confidenceValue = average(
    steps.map((step) => {
      const normalizedConfidence = normalizeText(step?.confidence).toLowerCase();
      return CONFIDENCE_SCORE_MAP[normalizedConfidence] || baseScore;
    }),
  );
  const metrics = deriveSessionMetrics({
    baseScore,
    confidenceValue,
    answerWordAverage,
    loweredTags,
    roundLabel: round,
    responseMode: record?.responseMode,
    currentDifficulty: record?.currentDifficulty,
  });
  const latestReview = getLatestReview(record);
  const dateValue = getRecordTimestamp(record);
  const date = toValidDate(dateValue, new Date()).toISOString();
  const duration = calculateDurationMinutes(record);
  const focusTags = uniqueList([
    ...(Array.isArray(record?.focus) ? record.focus : []),
    ...(Array.isArray(record?.skills) ? record.skills : []),
    ...flattenResumeSkills(record?.resumeSkills),
    ...(steps.map((step) => step?.topic).filter(Boolean) || []),
  ]).slice(0, 4);

  return {
    id: normalizeText(record?.sessionId),
    sessionId: normalizeText(record?.sessionId),
    candidate,
    email,
    role,
    round,
    interviewer,
    company,
    date,
    duration,
    score: baseScore,
    communication: metrics.communication,
    technical: metrics.technical,
    confidence: metrics.confidence,
    problemSolving: metrics.problemSolving,
    systemDesign: metrics.systemDesign,
    delivery: metrics.delivery,
    feedback:
      latestReview.feedback ||
      "Session captured. Review details will grow as more answers are submitted.",
    nextStep:
      latestReview.improvement ||
      "Keep building more interview history to unlock sharper coaching.",
    focusTags,
    responseMode: normalizeText(record?.responseMode) || "text",
    status: normalizeText(record?.status) || "completed",
    answerCount: steps.length,
    questionCount: Number(record?.questionCount) || steps.length,
    currentDifficulty:
      normalizeText(record?.currentDifficulty) ||
      normalizeText(steps[steps.length - 1]?.difficulty) ||
      "medium",
  };
};

const buildActivityStreak = (records = []) => {
  const uniqueDays = uniqueList(records.map((record) => getDateKey(record.date)))
    .filter(Boolean)
    .sort((left, right) => toTimestamp(right) - toTimestamp(left));

  if (uniqueDays.length === 0) {
    return 0;
  }

  let streak = 1;

  for (let index = 1; index < uniqueDays.length; index += 1) {
    const previousDay = new Date(uniqueDays[index - 1]);
    const currentDay = new Date(uniqueDays[index]);
    const diffInDays = Math.round(
      (previousDay.getTime() - currentDay.getTime()) / 86400000,
    );

    if (diffInDays === 1) {
      streak += 1;
      continue;
    }

    break;
  }

  return streak;
};

const loadPersistedSessions = async ({ scope = "all", user = null } = {}) => {
  const filter = {
    $or: [
      { "steps.0": { $exists: true } },
      { answerCount: { $gt: 0 } },
      { "lastEvaluation.score": { $exists: true } },
      { "lastEvaluation.feedback": { $exists: true, $ne: "" } },
    ],
  };

  if (scope === "mine" && user?._id) {
    filter.user = user._id;
  }

  return InterviewSessionRecord.find(filter)
    .sort({ completedAt: -1, updatedAt: -1, startedAt: -1 })
    .populate("user", "firstName lastName email role")
    .lean();
};

const fetchInterviewRecords = async ({ scope = "all", user = null } = {}) => {
  const persistedSessions = await loadPersistedSessions({ scope, user });

  return persistedSessions
    .map((record) => {
      try {
        return normalizeInterviewRecord(record);
      } catch (error) {
        console.log(
          `Skipping malformed interview record ${
            normalizeText(record?.sessionId) || "<unknown>"
          }: ${error.message}`,
        );
        return null;
      }
    })
    .filter(Boolean)
    .sort((left, right) => toTimestamp(right.date) - toTimestamp(left.date));
};

const buildCandidateDirectory = (records = []) => {
  const groupedCandidates = records.reduce((candidateMap, record) => {
    const candidateKey = buildCandidateKey(record.candidate, record.email);

    if (!candidateMap[candidateKey]) {
      candidateMap[candidateKey] = [];
    }

    candidateMap[candidateKey].push(record);
    return candidateMap;
  }, {});

  return Object.values(groupedCandidates)
    .map((candidateRecords) => {
      const sortedNewestFirst = [...candidateRecords].sort(
        (left, right) => toTimestamp(right.date) - toTimestamp(left.date),
      );
      const sortedOldestFirst = [...candidateRecords].sort(
        (left, right) => toTimestamp(left.date) - toTimestamp(right.date),
      );
      const latestRecord = sortedNewestFirst[0];
      const firstRecord = sortedOldestFirst[0];
      const skillAverages = Object.keys(METRIC_LABELS).reduce((metrics, key) => {
        metrics[key] = average(candidateRecords.map((record) => Number(record[key]) || 0));
        return metrics;
      }, {});
      const rankedSkills = Object.entries(skillAverages).sort(
        (left, right) => right[1] - left[1],
      );
      const strongestSkills = rankedSkills
        .slice(0, 2)
        .map(([key]) => METRIC_LABELS[key]);
      const weakestSkills = rankedSkills
        .slice(-2)
        .map(([key]) => METRIC_LABELS[key]);
      const averageScore = average(candidateRecords.map((record) => record.score));
      const bestScore = candidateRecords.length
        ? Math.max(...candidateRecords.map((record) => record.score))
        : 0;

      return {
        id: buildCandidateKey(latestRecord.candidate, latestRecord.email),
        name: latestRecord.candidate,
        email: latestRecord.email,
        role: latestRecord.role,
        company: latestRecord.company,
        avgScore: averageScore,
        bestScore,
        sessions: candidateRecords.length,
        lastInterviewDate: latestRecord.date,
        firstInterviewDate: firstRecord.date,
        lastRound: latestRecord.round,
        trend: latestRecord.score - firstRecord.score,
        streak: buildActivityStreak(candidateRecords),
        strongestSkills,
        weakestSkills,
        skills: skillAverages,
        focusTags: uniqueList(
          candidateRecords.flatMap((record) => record.focusTags || []),
        ).slice(0, 5),
        recentInterviews: sortedNewestFirst.slice(0, 3).map((record) => ({
          company: record.company,
          role: record.role,
          score: record.score,
          date: record.date,
          round: record.round,
        })),
        latestFeedback: latestRecord.feedback,
        nextStep: latestRecord.nextStep,
      };
    })
    .sort((left, right) => right.avgScore - left.avgScore);
};

const buildLeaderboardEntries = (records = []) =>
  buildCandidateDirectory(records)
    .map((candidateSummary) => ({
      name: candidateSummary.name,
      role: candidateSummary.role,
      company: candidateSummary.company,
      score: candidateSummary.avgScore,
      delta: candidateSummary.trend,
      streak: candidateSummary.streak,
      interviewsCompleted: candidateSummary.sessions,
      sessions: candidateSummary.sessions,
      strengths: candidateSummary.strongestSkills,
      weaknesses: candidateSummary.weakestSkills,
      skills: candidateSummary.skills,
      recentInterviews: candidateSummary.recentInterviews,
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 100)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

const buildAnalyticsSummary = (records = []) => {
  const passCount = records.filter((record) => record.score >= 70).length;
  const strongHireCount = records.filter((record) => record.score >= 85).length;
  const candidates = buildCandidateDirectory(records);

  return {
    totalSessions: records.length,
    totalCandidates: candidates.length,
    averageScore: average(records.map((record) => record.score)),
    averageDuration: average(records.map((record) => record.duration)),
    passRate: records.length ? Math.round((passCount / records.length) * 100) : 0,
    strongHireRate: records.length
      ? Math.round((strongHireCount / records.length) * 100)
      : 0,
  };
};

module.exports = {
  buildAnalyticsSummary,
  buildCandidateDirectory,
  buildLeaderboardEntries,
  fetchInterviewRecords,
  normalizeScope,
};
