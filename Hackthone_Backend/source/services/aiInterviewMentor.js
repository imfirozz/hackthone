const { GoogleGenAI } = require("@google/genai");
const InterviewSessionRecord = require("../Models/InterviewSessionRecord");
const {
  analyzeSkills,
  generateInterviewQuestion,
  normalizeFocusAreas,
} = require("./aiInterviewQuestionGenerator");
const { evaluateInterviewAnswer } = require("./aiInterviewEvaluator");
const {
  buildAnalyticsSummary,
  buildCandidateDirectory,
  fetchInterviewRecords,
} = require("./recordsService");

const GEMINI_MODEL = "gemini-2.5-flash";

const ALLOWED_INTENTS = new Set([
  "generate-question",
  "explain-concept",
  "improve-answer",
  "answer-feedback",
  "weak-area-coaching",
  "general_chat",
]);

const GENERAL_CHAT_PATTERNS = [
  /^(hi|hello|hey|howdy|greetings|yo|sup|what'?s up)/i,
  /\bhow are you\b/i,
  /\bwho are you\b/i,
  /\bwhat can you do\b/i,
  /\bhelp me\b/i,
  /\bthank(s| you)\b/i,
  /\b(write|create|build|make) (a |an |the )?(function|program|script|code|app|component|class)\b/i,
  /\b(solve|solution|approach) (this|the|a)? ?(problem|challenge|task)\b/i,
  /\b(what is|what are|define|meaning of|difference between)\b/i,
  /\b(how to|how do|how does|how can|can you)\b/i,
  /\b(debug|fix|error|bug|issue|not working)\b/i,
  /\b(roadmap|learning path|learn|study|resources)\b/i,
  /\b(career|job|salary|company|placement|hire)\b/i,
  /\b(best practice|pattern|architecture|design pattern)\b/i,
  /\b(compare|vs|versus|or)\b.*\b(which|better|prefer)\b/i,
  /\b(time complexity|space complexity|big o|o\()\b/i,
  /\b(linked list|binary tree|hash map|stack|queue|graph|heap|trie|array|sorting|searching)\b/i,
  /\b(docker|kubernetes|aws|cloud|devops|ci\/cd|git|linux)\b/i,
];

const PROFILE_TRIGGER_PATTERNS = [
  /\b(my resume|my profile|my skills|my history|from my)\b/i,
  /\b(personali[sz]ed|based on me|use my|about me)\b/i,
  /\b(my weak|my strong|my score|my performance|my analytics)\b/i,
  /\b(my interview|my past|my previous|my recent)\b/i,
];

const TECHNICAL_TOPIC_PATTERNS = [
  /\breact(?:\.js)?\b/i,
  /\bredux(?: toolkit)?\b/i,
  /\bvirtual dom\b/i,
  /\bstate management\b/i,
  /\breact router\b/i,
  /\bperformance\b/i,
  /\bmemo(?:ization)?\b/i,
  /\busememo\b/i,
  /\busecallback\b/i,
  /\buseeffect\b/i,
  /\bjsx\b/i,
  /\bjavascript\b/i,
  /\btypescript\b/i,
  /\bnode(?:\.js)?\b/i,
  /\bexpress(?:\.js)?\b/i,
  /\bapi\b/i,
  /\brest\b/i,
  /\bgraphql\b/i,
  /\bauth(?:entication|orization)?\b/i,
  /\bdatabase\b/i,
  /\bmongo(?:db)?\b/i,
  /\bsql\b/i,
  /\bredis\b/i,
  /\bcache\b/i,
  /\bsystem design\b/i,
  /\bscalab(?:ility|le)\b/i,
  /\bdebug(?:ging)?\b/i,
  /\bdata structures?\b/i,
  /\balgorithms?\b/i,
  /\boop\b/i,
  /\bhtml\b/i,
  /\bcss\b/i,
  /\btailwind\b/i,
  /\bparcel\b/i,
  /\bwebpack\b/i,
  /\bproblem solving\b/i,
  /\bcommunication\b/i,
  /\bconfidence\b/i,
  /\bdelivery\b/i,
  /\btechnical depth\b/i,
  /\bhr\b/i,
  /\bbehavior(?:al)?\b/i,
];

const INTERVIEW_SCOPE_PATTERNS = [
  /\binterview\b/i,
  /\bresume\b/i,
  /\banswer\b/i,
  /\bquestion\b/i,
  /\bconcept\b/i,
  /\bcareer\b/i,
  /\bcommunication\b/i,
  /\bmock\b/i,
  /\bpractice\b/i,
  /\bcoach(?:ing)?\b/i,
  /\bprepare\b/i,
];

const cleanText = (value = "") => String(value).replace(/\s+/g, " ").trim();

const stripCodeFence = (value = "") =>
  value
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

const extractJsonPayload = (value = "") => {
  const strippedValue = stripCodeFence(value);
  const firstBraceIndex = strippedValue.indexOf("{");
  const lastBraceIndex = strippedValue.lastIndexOf("}");

  if (firstBraceIndex === -1 || lastBraceIndex === -1 || lastBraceIndex < firstBraceIndex) {
    return strippedValue;
  }

  return strippedValue.slice(firstBraceIndex, lastBraceIndex + 1);
};

const parseJsonPayload = (value = "") => JSON.parse(extractJsonPayload(value));

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

const normalizeInterviewType = (value = "") => {
  const normalizedValue = cleanText(value).toLowerCase();

  if (normalizedValue.includes("hr")) {
    return "hr";
  }

  if (normalizedValue.includes("manager")) {
    return "managerial";
  }

  return "technical";
};

const normalizeIntent = (value = "") => {
  const normalizedValue = cleanText(value).toLowerCase();

  if (
    [
      "generate-question",
      "question",
      "practice-question",
      "simulate-interview",
      "simulation",
      "interview-simulation",
    ].includes(normalizedValue)
  ) {
    return "generate-question";
  }

  if (["explain", "concept", "explain-concept"].includes(normalizedValue)) {
    return "explain-concept";
  }

  if (["improve", "improve-answer", "answer-improvement"].includes(normalizedValue)) {
    return "improve-answer";
  }

  if (["feedback", "evaluate-answer", "answer-feedback"].includes(normalizedValue)) {
    return "answer-feedback";
  }

  if (["weak-area", "weak-area-coaching", "coaching"].includes(normalizedValue)) {
    return "weak-area-coaching";
  }

  return "";
};

const flattenResumeSkills = (resumeSkills = {}) =>
  [
    ...(Array.isArray(resumeSkills?.languages) ? resumeSkills.languages : []),
    ...(Array.isArray(resumeSkills?.frameworks) ? resumeSkills.frameworks : []),
    ...(Array.isArray(resumeSkills?.tools) ? resumeSkills.tools : []),
    ...(Array.isArray(resumeSkills?.concepts) ? resumeSkills.concepts : []),
  ]
    .map((value) => cleanText(value))
    .filter(Boolean);

const toSentence = (value = "") => {
  const cleanedValue = cleanText(value);
  if (!cleanedValue) {
    return "";
  }

  return /[.!?]$/.test(cleanedValue) ? cleanedValue : `${cleanedValue}.`;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const normalizeWordList = (values = []) =>
  uniqueList(
    Array.isArray(values)
      ? values.map((value) => cleanText(value)).filter(Boolean)
      : [],
  ).slice(0, 6);

const normalizePracticeGuidance = (values = []) =>
  normalizeWordList(values).map((value) => toSentence(value));

const isInterviewRelevantTopic = (value = "") => {
  const normalizedValue = cleanText(value);

  if (!normalizedValue) {
    return false;
  }

  if (analyzeSkills([normalizedValue]).validSkills.length > 0) {
    return true;
  }

  return TECHNICAL_TOPIC_PATTERNS.some((pattern) => pattern.test(normalizedValue));
};

const isInterviewScopedRequest = ({ message = "", intent = "", question = "", answer = "", concept = "", focus = [], validSkills = [] }) => {
  if (intent && intent !== "generate-question" && ALLOWED_INTENTS.has(intent)) {
    return true;
  }

  if (question || answer || concept || validSkills.length > 0 || focus.length > 0) {
    return true;
  }

  const normalizedMessage = cleanText(message);
  if (!normalizedMessage) {
    return false;
  }

  return INTERVIEW_SCOPE_PATTERNS.some((pattern) => pattern.test(normalizedMessage));
};

const detectIntent = ({ message = "", question = "", answer = "", concept = "", focus = [] }) => {
  const normalizedMessage = cleanText(message).toLowerCase();

  if (question && answer) {
    return "answer-feedback";
  }

  if (answer && /\b(improve|rewrite|better answer|refine)\b/i.test(normalizedMessage)) {
    return "improve-answer";
  }

  if (concept || /\b(explain|difference|when would you use|trade-?off|why does)\b/i.test(normalizedMessage)) {
    return "explain-concept";
  }

  if (focus.length > 0 && /\b(weak|improve|coach|practice plan|struggling)\b/i.test(normalizedMessage)) {
    return "weak-area-coaching";
  }

  if (/\b(feedback|score|evaluate|review)\b/i.test(normalizedMessage) && answer) {
    return "answer-feedback";
  }

  return "generate-question";
};

const detectConversationMode = ({ message = "", intent = "", chatMode = "", question = "", answer = "", concept = "", focus = [], validSkills = [] }) => {
  if (chatMode === "interview") return "interview";
  if (chatMode === "profile") return "profile";
  if (chatMode === "general") return "general";

  const normalizedMessage = cleanText(message);

  if (PROFILE_TRIGGER_PATTERNS.some((p) => p.test(normalizedMessage))) {
    return "profile";
  }

  if (intent && intent !== "general_chat" && ALLOWED_INTENTS.has(intent)) {
    return "interview";
  }

  if (question && answer) return "interview";
  if (concept && validSkills.length > 0) return "interview";
  if (focus.length > 0 && validSkills.length > 0) return "interview";

  if (isInterviewScopedRequest({ message, intent, question, answer, concept, focus, validSkills })) {
    return "interview";
  }

  return "general";
};

const generateGeneralChatWithGemini = async ({ message, profile, user }) => {
  const ai = getGeminiClient();
  if (!ai) return null;

  const userName = profile?.candidateName || (user ? cleanText(`${user.firstName || ""} ${user.lastName || ""}`.trim()) : "");
  const greeting = userName ? `The user's name is ${userName}.` : "";

  const contents = `
You are an intelligent, friendly, and highly knowledgeable AI assistant called "AI Mentor".
You help with ALL types of conversations and questions.

${greeting}

You can help with:
- Coding and programming in any language
- Data Structures and Algorithms (DSA)
- System Design and Architecture
- Debugging and error fixing
- Career guidance and job advice
- Learning roadmaps and study plans
- Frontend/Backend/DevOps concepts
- Communication and soft skills
- General knowledge and explanations
- Writing code, functions, components
- Comparing technologies
- Best practices and design patterns
- Any general conversation

RULES:
- Be conversational, warm, and helpful
- Give practical, actionable answers
- Use code examples when relevant
- Use markdown formatting (headers, code blocks, bold, lists)
- Do NOT force interview context unless the user asks about interviews
- Be concise but thorough

User message: ${message}

Respond naturally. Use markdown formatting. If the user asks a coding question, include code examples in code blocks with the language specified.
`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
    });
    const rawText = typeof response.text === "string" ? response.text : "";
    if (!rawText) return null;
    return { reply: rawText.trim() };
  } catch {
    return null;
  }
};

const buildGuestModePrompt = (invalidSkills = []) => ({
  needsInput: true,
  reply: invalidSkills.length
    ? "I only use valid interview technologies. Share a real skill, interview type, and difficulty to continue."
    : "To help in guest mode, share a skill or technology, interview type, and difficulty.",
  practiceGuidance: [
    "Skill: React.js",
    "Interview Type: Technical",
    "Difficulty: Medium",
    "Company: Google (optional)",
  ],
  invalidSkills,
  requiredFields: ["skill", "interviewType", "difficulty"],
  template: {
    skill: "React.js",
    interviewType: "Technical",
    difficulty: "Medium",
    company: "Google",
  },
});

const buildNoHistoryPrompt = () => ({
  needsInput: false,
  reply:
    "You are logged in, but I do not have enough interview evidence yet. Upload a resume or complete one evaluated session to unlock personalized coaching.",
  practiceGuidance: [
    "Upload a resume so I can generate questions from your real stack.",
    "Complete one technical round to unlock weak-area coaching and score trends.",
  ],
});

const buildFallbackExplanation = ({ topic, interviewType, difficulty, profile }) => {
  const focusNote =
    profile?.weakAreas?.length > 0
      ? ` Pay extra attention to ${profile.weakAreas.slice(0, 2).join(" and ")} because those are currently weaker areas.`
      : "";

  return {
    reply: `Here is the interview-focused explanation for ${topic}.`,
    explanation: `${topic} should be explained through purpose, mechanism, and trade-offs. In a ${difficulty} ${interviewType} round, show when you would use it, what problem it solves, and what can go wrong if it is misused.${focusNote}`,
    practicalExample: `Use a short project example that shows where ${topic} improved maintainability, correctness, or performance.`,
    followUpQuestion: `What trade-off would you mention if an interviewer challenged your choice around ${topic}?`,
    practiceGuidance: [
      `Define ${topic} in one clear sentence.`,
      "Add one real example from a project or debugging scenario.",
      "Mention one trade-off or failure mode before you stop.",
    ],
  };
};

const buildFallbackAnswerImprovement = ({ answer, skill, question }) => {
  const cleanedAnswer = cleanText(answer);
  const improvedAnswer = cleanedAnswer
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => cleanText(sentence))
    .filter(Boolean)
    .join(" ");

  return {
    reply: `I tightened your answer for ${skill || "the topic"} without changing its core meaning.`,
    improvedAnswer,
    practiceGuidance: [
      "Lead with the core point in the first sentence.",
      "Add one mechanism or example tied to the question.",
      "End with why that detail matters in production.",
    ],
    improvementTips: normalizePracticeGuidance([
      question ? `Anchor every sentence back to the question: ${question}` : "",
      skill ? `Use one technical detail that proves real familiarity with ${skill}` : "",
      "Replace broad claims with a concrete example or trade-off.",
    ]),
  };
};

const buildFallbackWeakAreaCoaching = ({ weakAreas = [], profile, practiceQuestion }) => {
  const targetAreas = weakAreas.length > 0 ? weakAreas : profile?.weakAreas || [];
  const firstArea = targetAreas[0] || "Technical Depth";

  return {
    reply: `Your next coaching block should focus on ${targetAreas.slice(0, 2).join(" and ") || firstArea}.`,
    explanation: `Your recent history shows weaker performance around ${targetAreas.slice(0, 2).join(" and ") || firstArea}. Improve by tightening your explanation flow, adding one concrete example, and naming the trade-off or failure mode earlier.`,
    question: practiceQuestion?.question || "",
    topic: practiceQuestion?.topic || firstArea,
    practiceGuidance: [
      `Review the core idea behind ${firstArea} in interview language, not textbook language.`,
      "Practice one question aloud and keep the answer under 90 seconds.",
      "After each answer, check whether you explained mechanism, trade-off, and real usage.",
    ],
    improvementTips: normalizePracticeGuidance([
      "Write a short answer skeleton before speaking.",
      "Use one debugging or production example in every practice answer.",
      "Track whether your weakest area score improves across the next two sessions.",
    ]),
  };
};

const buildProfileSummary = (profile = {}) => ({
  resumeSkills: Array.isArray(profile.resumeSkills) ? profile.resumeSkills.slice(0, 12) : [],
  weakAreas: Array.isArray(profile.weakAreas) ? profile.weakAreas : [],
  strongAreas: Array.isArray(profile.strongAreas) ? profile.strongAreas : [],
  failedConcepts: Array.isArray(profile.failedConcepts) ? profile.failedConcepts : [],
  averageScore: Number.isFinite(profile.averageScore) ? profile.averageScore : null,
  interviewCount: Number.isFinite(profile.interviewCount) ? profile.interviewCount : 0,
  consistency: cleanText(profile.consistency) || "limited",
  preferredRole: cleanText(profile.preferredRole),
  preferredMode: cleanText(profile.preferredMode),
  recentDifficultyTrend: cleanText(profile.recentDifficultyTrend),
});

const normalizeMentorPayload = (value = {}) => {
  const message = cleanText(value?.message || value?.prompt || value?.query);
  const concept = cleanText(value?.concept || value?.topic);
  const question = cleanText(value?.question);
  const answer = cleanText(value?.answer);
  const company = cleanText(value?.company);
  const difficulty = normalizeDifficulty(value?.difficulty || value?.level || value?.difficultyLevel);
  const interviewType = normalizeInterviewType(value?.interviewType || value?.round || value?.interviewRound);
  const domain = cleanText(value?.domain || value?.role || value?.preferredRole).toLowerCase() || "general";
  const focus = normalizeFocusAreas(value?.focus || value?.focusAreas || value?.weakAreas || value?.topics);
  const explicitSkill = cleanText(value?.skill || value?.technology);
  const skillAnalysis = analyzeSkills(
    value?.skills ||
      value?.candidateSkills ||
      (explicitSkill ? [explicitSkill] : []),
  );
  const intent = normalizeIntent(value?.intent || value?.action || value?.mode);

  return {
    message,
    concept,
    question,
    answer,
    company,
    difficulty,
    interviewType,
    domain,
    focus,
    intent,
    explicitSkill,
    skillAnalysis,
  };
};

const loadLatestResumeRecord = async (userId) =>
  InterviewSessionRecord.findOne({
    user: userId,
    $or: [
      { "resumeSkills.languages.0": { $exists: true } },
      { "resumeSkills.frameworks.0": { $exists: true } },
      { "resumeSkills.tools.0": { $exists: true } },
      { "resumeSkills.concepts.0": { $exists: true } },
    ],
  })
    .sort({ updatedAt: -1 })
    .lean();

const deriveConsistency = (records = [], candidate = null) => {
  if (records.length < 2) {
    return "limited";
  }

  const scores = records.map((record) => Number(record.score)).filter(Number.isFinite);
  if (scores.length < 2) {
    return "limited";
  }

  const range = Math.max(...scores) - Math.min(...scores);
  if ((candidate?.avgScore || 0) >= 75 && range <= 12) {
    return "stable";
  }

  if (range <= 18) {
    return "mixed";
  }

  return "volatile";
};

const deriveDifficultyTrend = (sessions = []) => {
  const normalizedDifficulties = uniqueList(
    sessions
      .map((session) => normalizeDifficulty(session?.currentDifficulty))
      .filter(Boolean),
  );

  return normalizedDifficulties.join(" -> ");
};

const buildPersonalizedProfile = async (user) => {
  const [records, latestResumeRecord, persistedSessions] = await Promise.all([
    fetchInterviewRecords({ scope: "mine", user }),
    loadLatestResumeRecord(user._id),
    InterviewSessionRecord.find({ user: user._id })
      .sort({ updatedAt: -1 })
      .limit(8)
      .lean(),
  ]);
  const candidateSummary = buildCandidateDirectory(records)[0] || null;
  const analytics = buildAnalyticsSummary(records);
  const resumeSkills = uniqueList([
    ...flattenResumeSkills(latestResumeRecord?.resumeSkills),
    ...(candidateSummary?.focusTags || []),
  ]).filter((value) => isInterviewRelevantTopic(value));
  const failedConcepts = uniqueList(
    records
      .filter((record) => Number(record.score) < 65)
      .flatMap((record) => record.focusTags || []),
  )
    .filter((value) => isInterviewRelevantTopic(value))
    .slice(0, 5);
  const recentQuestions = uniqueList(
    persistedSessions.flatMap((session) =>
      Array.isArray(session?.steps)
        ? session.steps.map((step) => cleanText(step?.question)).filter(Boolean)
        : [],
    ),
  ).slice(0, 5);
  const recentTopics = uniqueList(
    persistedSessions.flatMap((session) =>
      Array.isArray(session?.steps)
        ? session.steps.map((step) => cleanText(step?.topic)).filter(Boolean)
        : [],
    ),
  ).slice(0, 5);

  return {
    mode: "personalized",
    candidateName: cleanText(
      `${cleanText(user?.firstName)} ${cleanText(user?.lastName)}`.trim(),
    ),
    resumeSkills,
    weakAreas: candidateSummary?.weakestSkills || [],
    strongAreas: candidateSummary?.strongestSkills || [],
    failedConcepts,
    averageScore: candidateSummary?.avgScore || analytics.averageScore || 0,
    interviewCount: analytics.totalSessions || records.length,
    recentScores: records.slice(0, 5).map((record) => record.score),
    allScores: records.map((record) => record.score),
    interviewHistory: records.slice(0, 5).map((record) => ({
      company: record.company,
      round: record.round,
      score: record.score,
      date: record.date,
      focusTags: record.focusTags || [],
    })),
    latestFeedback: cleanText(candidateSummary?.latestFeedback),
    nextStep: cleanText(candidateSummary?.nextStep),
    preferredRole: cleanText(user?.preferences?.defaultRoleFilter || candidateSummary?.role),
    preferredMode: cleanText(user?.preferences?.preferredInterviewMode),
    consistency: deriveConsistency(records, candidateSummary),
    recentDifficultyTrend: deriveDifficultyTrend(persistedSessions),
    recentQuestions,
    recentTopics,
  };
};

const buildGuestProfile = () => ({
  mode: "guest",
  candidateName: "",
  resumeSkills: [],
  weakAreas: [],
  strongAreas: [],
  failedConcepts: [],
  averageScore: null,
  interviewCount: 0,
  recentScores: [],
  allScores: [],
  interviewHistory: [],
  latestFeedback: "",
  nextStep: "",
  preferredRole: "",
  preferredMode: "",
  consistency: "limited",
  recentDifficultyTrend: "",
  recentQuestions: [],
  recentTopics: [],
});

const buildQuestionPayload = ({ normalizedBody, profile }) => {
  const validSkills =
    normalizedBody.skillAnalysis.validSkills.length > 0
      ? normalizedBody.skillAnalysis.validSkills
      : profile.resumeSkills.filter((value) => analyzeSkills([value]).validSkills.length > 0);
  const focus = uniqueList([
    ...normalizedBody.focus.filter((value) => isInterviewRelevantTopic(value)),
    ...(profile.failedConcepts || []),
  ]).slice(0, 4);

  return {
    skills: validSkills,
    focus,
  };
};

const getGeminiClient = () => {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return null;
  }

  return new GoogleGenAI({ apiKey });
};

const generateMentorWithGemini = async ({ intent, normalizedBody, profile, mode }) => {
  const ai = getGeminiClient();

  if (!ai) {
    return null;
  }

  const contents = `
You are an advanced AI Interview Mentor inside a mock interview platform.

You ONLY help with:
- technical interview preparation
- HR interview preparation
- resume-based interview guidance
- concept explanation
- answer improvement
- weak area coaching
- interview simulation
- communication improvement
- career preparation

Current mode: ${mode}
Intent: ${intent}

USER INPUT:
- Message: ${normalizedBody.message || "Not provided"}
- Skill(s): ${normalizedBody.skillAnalysis.validSkills.join(", ") || "Not provided"}
- Focus Areas: ${normalizedBody.focus.join(", ") || "Not provided"}
- Interview Type: ${normalizedBody.interviewType}
- Difficulty: ${normalizedBody.difficulty}
- Company: ${normalizedBody.company || "Not provided"}
- Domain: ${normalizedBody.domain}
- Concept: ${normalizedBody.concept || "Not provided"}
- Question: ${normalizedBody.question || "Not provided"}
- Answer: ${normalizedBody.answer || "Not provided"}

PERSONALIZED CONTEXT:
${JSON.stringify(buildProfileSummary(profile), null, 2)}

RULES:
- Be concise, realistic, and interview-focused
- If the user is in guest mode, do not assume resume data exists
- If personalized context exists, use weak areas and history intelligently
- Ignore invalid technologies and nonsense topics
- Do not act like a generic chatbot
- Do not answer unrelated prompts
- Preserve original meaning when improving an answer
- Keep explanations practical and interview-focused
- Questions must feel human, realistic, and non-repetitive

Return ONLY valid JSON in this format:
{
  "reply": "",
  "question": "",
  "topic": "",
  "explanation": "",
  "practicalExample": "",
  "followUpQuestion": "",
  "improvedAnswer": "",
  "practiceGuidance": [],
  "improvementTips": []
}
`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents,
  });
  const rawText = typeof response.text === "string" ? response.text : "";

  if (!rawText) {
    return null;
  }

  const parsedValue = parseJsonPayload(rawText);
  return {
    reply: toSentence(parsedValue?.reply),
    question: cleanText(parsedValue?.question),
    topic: cleanText(parsedValue?.topic),
    explanation: toSentence(parsedValue?.explanation),
    practicalExample: toSentence(parsedValue?.practicalExample),
    followUpQuestion: cleanText(parsedValue?.followUpQuestion),
    improvedAnswer: cleanText(parsedValue?.improvedAnswer),
    practiceGuidance: normalizePracticeGuidance(parsedValue?.practiceGuidance),
    improvementTips: normalizePracticeGuidance(parsedValue?.improvementTips),
  };
};

const buildGuestMentorResponse = ({ normalizedBody, intent }) => {
  const hasUsefulGuestContext =
    normalizedBody.skillAnalysis.validSkills.length > 0 ||
    normalizedBody.focus.length > 0 ||
    normalizedBody.concept ||
    normalizedBody.question ||
    normalizedBody.answer ||
    normalizedBody.message;

  if (!hasUsefulGuestContext && (!intent || intent === "generate-question")) {
    return {
      mentor: "fallback",
      mode: "guest",
      intent: "generate-question",
      profile: buildProfileSummary(buildGuestProfile()),
      data: buildGuestModePrompt(normalizedBody.skillAnalysis.invalidSkills),
    };
  }

  return null;
};

const buildPersonalizedMentorResponse = ({ profile }) => {
  if (profile.interviewCount > 0 || profile.resumeSkills.length > 0) {
    return null;
  }

  return {
    mentor: "fallback",
    mode: "personalized",
    intent: "weak-area-coaching",
    profile: buildProfileSummary(profile),
    data: buildNoHistoryPrompt(),
  };
};

const createQuestionResponse = async ({ normalizedBody, profile, mode }) => {
  const { skills, focus } = buildQuestionPayload({ normalizedBody, profile });
  const effectiveFocus =
    focus.length > 0
      ? focus
      : normalizedBody.interviewType === "hr"
        ? [normalizedBody.domain || profile.preferredRole || "communication"]
        : [];

  if (
    normalizedBody.interviewType !== "hr" &&
    skills.length === 0 &&
    effectiveFocus.length === 0
  ) {
    return {
      mentor: "fallback",
      data: buildGuestModePrompt(normalizedBody.skillAnalysis.invalidSkills),
    };
  }

  const questionResult = await generateInterviewQuestion({
    company: normalizedBody.company || "General",
    round: normalizedBody.interviewType,
    skills,
    difficulty: normalizedBody.difficulty,
    focus: effectiveFocus,
    domain: normalizedBody.domain || profile.preferredRole || "general",
    questionNumber: Math.max(1, profile.interviewCount + 1),
    previousQuestions: profile.recentQuestions || [],
    preferredTopic:
      normalizedBody.concept ||
      effectiveFocus[0] ||
      skills[0] ||
      profile.resumeSkills[0] ||
      "",
    variantSeed: profile.candidateName || mode,
  });

  return {
    mentor: questionResult.generator || "fallback",
    data: {
      reply:
        mode === "personalized"
          ? `This question is targeted at your current profile, with extra weight on ${effectiveFocus[0] || skills[0] || "your active stack"}.`
          : `This question matches the ${normalizedBody.difficulty} ${normalizedBody.interviewType} setup you asked for.`,
      question: questionResult.question.question,
      topic: questionResult.question.topic,
      practiceGuidance: normalizePracticeGuidance([
        "Answer in 60 to 90 seconds and lead with the core idea first.",
        "Use one real project or debugging example if the question allows it.",
        "Name the trade-off or failure mode before you stop.",
      ]),
      improvementTips: normalizePracticeGuidance([
        effectiveFocus[0]
          ? `Pay special attention to ${effectiveFocus[0]} because it is a current focus area.`
          : "",
        profile.weakAreas[0]
          ? `Your weakest area is ${profile.weakAreas[0]}, so be explicit about reasoning and structure.`
          : "",
      ]),
    },
  };
};

const createExplanationResponse = async ({ normalizedBody, profile, mode }) => {
  const topic =
    normalizedBody.concept ||
    normalizedBody.skillAnalysis.validSkills[0] ||
    normalizedBody.focus[0] ||
    profile.failedConcepts[0] ||
    profile.resumeSkills[0];

  if (!isInterviewRelevantTopic(topic) && normalizedBody.interviewType !== "hr") {
    return {
      mentor: "fallback",
      data: buildGuestModePrompt(normalizedBody.skillAnalysis.invalidSkills),
    };
  }

  const aiResponse = await generateMentorWithGemini({
    intent: "explain-concept",
    normalizedBody: {
      ...normalizedBody,
      concept: topic,
    },
    profile,
    mode,
  });

  return {
    mentor: aiResponse ? "gemini" : "fallback",
    data:
      aiResponse ||
      buildFallbackExplanation({
        topic,
        interviewType: normalizedBody.interviewType,
        difficulty: normalizedBody.difficulty,
        profile,
      }),
  };
};

const createAnswerImprovementResponse = async ({ normalizedBody, profile, mode }) => {
  if (!normalizedBody.answer) {
    return {
      mentor: "fallback",
      data: {
        needsInput: true,
        reply: "Send the answer you want to improve, and I will tighten it without changing its meaning.",
        practiceGuidance: ["Include the original answer, and optionally include the interview question."],
      },
    };
  }

  const aiResponse = await generateMentorWithGemini({
    intent: "improve-answer",
    normalizedBody,
    profile,
    mode,
  });

  return {
    mentor: aiResponse ? "gemini" : "fallback",
    data: aiResponse || buildFallbackAnswerImprovement(normalizedBody),
  };
};

const createAnswerFeedbackResponse = async ({ normalizedBody, profile }) => {
  if (!normalizedBody.question || !normalizedBody.answer) {
    return {
      mentor: "fallback",
      data: {
        needsInput: true,
        reply: "Send both the interview question and your answer so I can review it realistically.",
        practiceGuidance: ["Include question, answer, skill if known, and difficulty if known."],
      },
    };
  }

  const inferredSkill =
    normalizedBody.skillAnalysis.validSkills[0] ||
    normalizedBody.concept ||
    normalizedBody.focus[0] ||
    profile.resumeSkills[0] ||
    "General Technical Skill";
  const evaluation = await evaluateInterviewAnswer({
    question: normalizedBody.question,
    answer: normalizedBody.answer,
    skill: inferredSkill,
    difficulty: normalizedBody.difficulty,
    recentScores: profile.recentScores || [],
    allScores: profile.allScores || [],
  });
  const review = evaluation?.evaluation || {};

  return {
    mentor: evaluation?.evaluator || "fallback",
    data: {
      reply:
        profile.weakAreas.length > 0
          ? `I reviewed your answer against your current profile. Be especially careful with ${profile.weakAreas[0]}.`
          : "I reviewed your answer using interview-style scoring.",
      review: {
        score: review.score,
        feedback: review.feedback,
        strength: review.strength,
        improvement: review.improvement,
        idealAnswer: review.idealAnswer,
        confidence: review.confidence,
      },
      improvementTips: normalizePracticeGuidance([
        review.improvement,
        review.idealAnswer ? "Re-answer once using the ideal answer structure, but keep your own wording." : "",
        profile.nextStep || "",
      ]),
    },
  };
};

const createWeakAreaCoachingResponse = async ({ normalizedBody, profile, mode }) => {
  const weakAreas = uniqueList([
    ...normalizedBody.focus,
    ...profile.weakAreas,
    ...profile.failedConcepts,
  ]).slice(0, 4);

  const practiceQuestion =
    weakAreas.length > 0 || profile.resumeSkills.length > 0
      ? await generateInterviewQuestion({
          company: normalizedBody.company || "General",
          round: normalizedBody.interviewType,
          skills:
            normalizedBody.skillAnalysis.validSkills.length > 0
              ? normalizedBody.skillAnalysis.validSkills
              : profile.resumeSkills.filter((value) => analyzeSkills([value]).validSkills.length > 0),
          difficulty: normalizedBody.difficulty,
          focus: weakAreas.slice(0, 2),
          domain: normalizedBody.domain || profile.preferredRole || "general",
          questionNumber: Math.max(1, profile.interviewCount + 1),
          previousQuestions: profile.recentQuestions || [],
          preferredTopic: weakAreas[0] || profile.resumeSkills[0] || "",
          variantSeed: `${mode}-coaching`,
        })
      : null;

  const aiResponse = await generateMentorWithGemini({
    intent: "weak-area-coaching",
    normalizedBody: {
      ...normalizedBody,
      focus: weakAreas,
    },
    profile,
    mode,
  });

  if (aiResponse) {
    return {
      mentor: "gemini",
      data: {
        ...aiResponse,
        question: aiResponse.question || practiceQuestion?.question.question || "",
        topic: aiResponse.topic || practiceQuestion?.question.topic || weakAreas[0] || "",
      },
    };
  }

  return {
    mentor: practiceQuestion?.generator || "fallback",
    data: buildFallbackWeakAreaCoaching({
      weakAreas,
      profile,
      practiceQuestion: practiceQuestion?.question,
    }),
  };
};

const createInterviewMentorResponse = async ({ body = {}, user = null }) => {
  const normalizedBody = normalizeMentorPayload(body);
  const intent =
    normalizedBody.intent ||
    detectIntent({
      message: normalizedBody.message,
      question: normalizedBody.question,
      answer: normalizedBody.answer,
      concept: normalizedBody.concept,
      focus: normalizedBody.focus,
    });

  const chatMode = cleanText(body?.chatMode || body?.conversationMode).toLowerCase();
  const conversationMode = detectConversationMode({
    message: normalizedBody.message,
    intent,
    chatMode,
    question: normalizedBody.question,
    answer: normalizedBody.answer,
    concept: normalizedBody.concept,
    focus: normalizedBody.focus,
    validSkills: normalizedBody.skillAnalysis.validSkills,
  });

  if (conversationMode === "general") {
    const userMessage = normalizedBody.message || "Hello";
    const guestProfile = buildGuestProfile();
    const aiResponse = await generateGeneralChatWithGemini({
      message: userMessage,
      profile: user ? await buildPersonalizedProfile(user) : guestProfile,
      user,
    });

    return {
      mentor: aiResponse ? "gemini" : "fallback",
      mode: user ? "personalized" : "guest",
      intent: "general_chat",
      conversationMode: "general",
      profile: buildProfileSummary(user ? await buildPersonalizedProfile(user) : guestProfile),
      data: aiResponse || {
        reply: "Hi! I'm your AI Mentor. I can help with coding, DSA, system design, career guidance, interview prep, and much more. What would you like to explore?",
      },
    };
  }

  const profile = user ? await buildPersonalizedProfile(user) : buildGuestProfile();
  const mode = user ? "personalized" : "guest";

  if (!user) {
    const guestResponse = buildGuestMentorResponse({ normalizedBody, intent });
    if (guestResponse) {
      return guestResponse;
    }
  } else {
    const personalizedResponse = buildPersonalizedMentorResponse({ profile });
    if (personalizedResponse) {
      return personalizedResponse;
    }
  }

  let data;
  let mentor = "fallback";

  if (intent === "answer-feedback") {
    const feedbackResponse = await createAnswerFeedbackResponse({ normalizedBody, profile });
    mentor = feedbackResponse.mentor;
    data = feedbackResponse.data;
  } else if (intent === "improve-answer") {
    const improvementResponse = await createAnswerImprovementResponse({
      normalizedBody,
      profile,
      mode,
    });
    mentor = improvementResponse.mentor;
    data = improvementResponse.data;
  } else if (intent === "explain-concept") {
    const explanationResponse = await createExplanationResponse({ normalizedBody, profile, mode });
    mentor = explanationResponse.mentor;
    data = explanationResponse.data;
  } else if (intent === "weak-area-coaching") {
    const coachingResponse = await createWeakAreaCoachingResponse({ normalizedBody, profile, mode });
    mentor = coachingResponse.mentor;
    data = coachingResponse.data;
  } else {
    const questionResponse = await createQuestionResponse({ normalizedBody, profile, mode });
    mentor = questionResponse.mentor;
    data = questionResponse.data;
  }

  return {
    mentor,
    mode,
    intent,
    conversationMode,
    profile: buildProfileSummary(profile),
    data,
  };
};

module.exports = {
  createInterviewMentorResponse,
};
