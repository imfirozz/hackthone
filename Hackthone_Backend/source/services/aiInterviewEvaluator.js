const { GoogleGenAI } = require("@google/genai");

const GEMINI_MODEL = "gemini-2.5-flash";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "do",
  "does",
  "for",
  "from",
  "how",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "their",
  "this",
  "to",
  "what",
  "when",
  "where",
  "which",
  "why",
  "with",
]);

const DISPLAY_TERM_MAP = {
  api: "API",
  apis: "APIs",
  ci: "CI",
  cd: "CD",
  dbms: "DBMS",
  dom: "DOM",
  oop: "OOP",
  sql: "SQL",
  ui: "UI",
  ux: "UX",
};

const IDEAL_ANSWER_LIBRARY = [
  {
    pattern: /\bvirtual dom\b/i,
    answer:
      "Virtual DOM is React's in-memory DOM representation. React diffs it against the previous tree and updates only changed real DOM nodes.",
  },
  {
    pattern: /\bredux toolkit\b/i,
    answer:
      "Redux Toolkit is the standard way to write Redux logic. It reduces boilerplate with helpers like configureStore and createSlice.",
  },
  {
    pattern: /\breact router\b/i,
    answer:
      "React Router handles client-side routing in React applications. It maps URLs to components without full page reloads.",
  },
  {
    pattern: /\bparcel\b/i,
    answer:
      "Parcel is a zero-config web bundler. It resolves dependencies, applies transforms, and produces optimized frontend builds.",
  },
  {
    pattern: /\bstate management\b/i,
    answer:
      "State management controls how application data is stored, updated, and shared. Good state design keeps data flow predictable and maintainable.",
  },
  {
    pattern: /\breact(?:\.js)?\b/i,
    answer:
      "React is a JavaScript library for building user interfaces with reusable components. It updates the UI efficiently by reconciling changes through the virtual DOM.",
  },
];

const cleanText = (value = "") => value.replace(/\s+/g, " ").trim();

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

const normalizeScore = (value) => {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return 0;
  }

  return Math.max(0, Math.min(10, Math.round(parsedValue)));
};

const normalizeScoreList = (value) => {
  const toNormalizedScore = (item) => {
    const parsedValue = Number(item);
    return Number.isFinite(parsedValue) ? normalizeScore(parsedValue) : null;
  };

  if (Array.isArray(value)) {
    return value.map((item) => toNormalizedScore(item)).filter((score) => score !== null);
  }

  if (typeof value === "string") {
    return value
      .split(/,|;|\||\n/)
      .map((item) => toNormalizedScore(item))
      .filter((score) => score !== null);
  }

  return [];
};

const normalizeConfidence = (value = "") => {
  const normalizedValue = cleanText(value).toLowerCase();

  if (["high", "medium", "low"].includes(normalizedValue)) {
    return normalizedValue;
  }

  return "medium";
};

const CONFIDENCE_LEVELS = ["low", "medium", "high"];

const limitWords = (value = "", maxWords = 20) => {
  const cleanedValue = cleanText(value);
  if (!cleanedValue) {
    return "";
  }

  const words = cleanedValue.split(/\s+/);
  if (words.length <= maxWords) {
    return cleanedValue;
  }

  return words.slice(0, maxWords).join(" ");
};

const limitSentences = (value = "", maxSentences = 2) => {
  const cleanedValue = cleanText(value);
  if (!cleanedValue) {
    return "";
  }

  const sentences = cleanedValue.match(/[^.!?]+[.!?]?/g)?.map((sentence) => cleanText(sentence)) || [];
  if (sentences.length <= maxSentences) {
    return cleanedValue;
  }

  return sentences.slice(0, maxSentences).join(" ");
};

const normalizeEvaluation = (value) => {
  const data = value && typeof value === "object" ? value : {};
  const rawStrength = typeof data.strength === "string" ? data.strength : "";
  const normalizedStrength = limitWords(rawStrength, 20);
  const safeStrength =
    !normalizedStrength ||
    /\b(does not|doesn't|incorrect|wrong|unclear|missing|contradict|not technically|fails|no clear strength)\b/i.test(
      normalizedStrength,
    )
      ? "No clear strength in the answer"
      : normalizedStrength;

  return {
    score: normalizeScore(data.score),
    feedback: limitWords(typeof data.feedback === "string" ? data.feedback : "", 20),
    strength: safeStrength,
    improvement: limitWords(typeof data.improvement === "string" ? data.improvement : "", 20),
    idealAnswer: limitWords(limitSentences(typeof data.idealAnswer === "string" ? data.idealAnswer : "", 2), 36),
    confidence: normalizeConfidence(data.confidence),
  };
};

const tokenize = (value = "") =>
  cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9+# ]/g, " ")
    .split(/\s+/)
    .filter((token) => token && token.length > 1 && !STOP_WORDS.has(token));

const toSentenceCase = (value = "") => {
  const cleanedValue = cleanText(value);
  if (!cleanedValue) {
    return "";
  }

  return cleanedValue.charAt(0).toUpperCase() + cleanedValue.slice(1);
};

const formatList = (items = []) => {
  if (items.length === 0) {
    return "";
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
};

const formatDisplayTerm = (value = "") =>
  value
    .split(/\s+/)
    .map((part) => DISPLAY_TERM_MAP[part.toLowerCase()] || part)
    .join(" ");

const ensureSentence = (value = "") => {
  const cleanedValue = cleanText(value);
  if (!cleanedValue) {
    return "";
  }

  return /[.!?]$/.test(cleanedValue) ? cleanedValue : `${cleanedValue}.`;
};

const getPrimaryTopic = ({ skill, question }) => {
  const cleanedSkill = cleanText(skill);
  if (cleanedSkill) {
    return cleanedSkill;
  }

  const tokens = tokenize(question);
  return tokens.slice(0, 3).join(" ");
};

const extractConceptPhrase = ({ question, skill }) => {
  const cleanedQuestion = cleanText(question).replace(/[?]$/, "");
  const cleanedSkill = cleanText(skill);

  const patterns = [
    /^what\s+is\s+(.+?)(?:\s+in\s+.+)?$/i,
    /^what\s+are\s+(.+?)(?:\s+in\s+.+)?$/i,
    /^explain\s+(.+?)(?:\s+in\s+.+)?$/i,
    /^why\s+use\s+(.+?)(?:\s+in\s+.+)?$/i,
    /^how\s+does\s+(.+?)\s+work(?:\s+in\s+.+)?$/i,
    /^how\s+would\s+you\s+(?:design|handle|structure|manage|approach)\s+(.+?)(?:\s+in\s+.+)?$/i,
    /^how\s+do\s+you\s+(?:design|handle|structure|manage|approach)\s+(.+?)(?:\s+in\s+.+)?$/i,
  ];

  for (const pattern of patterns) {
    const match = cleanedQuestion.match(pattern);
    if (match?.[1]) {
      return cleanText(match[1]);
    }
  }

  return cleanedSkill || cleanedQuestion;
};

const getAnswerSnippet = (answer = "") => {
  const cleanedAnswer = cleanText(answer);
  if (!cleanedAnswer) {
    return "";
  }

  const sentence = cleanedAnswer.split(/[.!?]/).map((part) => part.trim()).find(Boolean) || cleanedAnswer;
  return sentence.length > 80 ? `${sentence.slice(0, 77).trim()}...` : sentence;
};

const getQuestionIntent = (question = "") => {
  const normalizedQuestion = cleanText(question).toLowerCase();

  if (/^what\b/.test(normalizedQuestion) || /\bwhat is\b/.test(normalizedQuestion)) {
    return "definition";
  }

  if (/^how\b/.test(normalizedQuestion)) {
    return "process";
  }

  if (/^why\b/.test(normalizedQuestion)) {
    return "reasoning";
  }

  if (/\bdifference\b|\bcompare\b|\bvs\b|\bversus\b/.test(normalizedQuestion)) {
    return "comparison";
  }

  return "general";
};

const getKeyTerms = (value = "", limit = 4) =>
  [...new Set(tokenize(value))]
    .filter((token) => token.length > 2)
    .slice(0, limit);

const getQuestionConceptTokens = ({ question, skill }) => {
  const skillTokenSet = new Set(tokenize(skill));
  return tokenize(question)
    .filter((token) => !skillTokenSet.has(token))
    .slice(0, 3);
};

const getCoveredTerms = ({ question, skill, answer }) => {
  const answerTokenSet = new Set(tokenize(answer));
  const questionConceptTokens = getQuestionConceptTokens({ question, skill });
  const skillTokenSet = new Set(tokenize(skill));
  const preferredTerms = getKeyTerms(question, 5).filter((term) => !skillTokenSet.has(term));
  const coveredTerms = [];
  const consumedTokens = new Set();

  if (
    questionConceptTokens.length > 1 &&
    questionConceptTokens.every((token) => answerTokenSet.has(token))
  ) {
    coveredTerms.push(formatDisplayTerm(questionConceptTokens.join(" ")));
    questionConceptTokens.forEach((token) => consumedTokens.add(token));
  }

  for (const term of [...new Set(preferredTerms)]) {
    if (consumedTokens.has(term)) {
      continue;
    }

    if (answerTokenSet.has(term)) {
      coveredTerms.push(formatDisplayTerm(term));
    }
  }

  return [...new Set(coveredTerms)].slice(0, 3);
};

const getMissingTerms = ({ question, skill, answer }) => {
  const answerTokenSet = new Set(tokenize(answer));
  const questionConceptTokens = getQuestionConceptTokens({ question, skill });
  const skillTokenSet = new Set(tokenize(skill));
  const preferredTerms = getKeyTerms(question, 5).filter((term) => !skillTokenSet.has(term));
  const missingTerms = [];
  const consumedTokens = new Set();

  if (
    questionConceptTokens.length > 1 &&
    questionConceptTokens.some((token) => !answerTokenSet.has(token))
  ) {
    missingTerms.push(formatDisplayTerm(questionConceptTokens.join(" ")));
    questionConceptTokens.forEach((token) => consumedTokens.add(token));
  }

  for (const term of [...new Set(preferredTerms)]) {
    if (consumedTokens.has(term)) {
      continue;
    }

    if (!answerTokenSet.has(term)) {
      missingTerms.push(formatDisplayTerm(term));
    }
  }

  return [...new Set(missingTerms)].slice(0, 3);
};

const buildFallbackIdealAnswer = ({ question, answer, skill, score }) => {
  const sourceText = `${question} ${skill}`;
  const libraryMatch = IDEAL_ANSWER_LIBRARY.find((entry) => entry.pattern.test(sourceText));
  if (libraryMatch) {
    return libraryMatch.answer;
  }

  const conceptPhrase = extractConceptPhrase({ question, skill }) || getPrimaryTopic({ skill, question });
  const topic = getPrimaryTopic({ skill, question }) || "the topic";
  const cleanedAnswer = cleanText(answer);

  if (score >= 4 && cleanedAnswer) {
    const sentences =
      cleanedAnswer.split(/[.!?]/).map((part) => part.trim()).filter(Boolean).slice(0, 2);
    const firstSentence = sentences[0] || cleanedAnswer;

    let rewritten = firstSentence;
    if (/^it\s+is\b/i.test(rewritten)) {
      rewritten = rewritten.replace(/^it\s+is\b/i, `${conceptPhrase} is`);
    } else if (/^it's\b/i.test(rewritten)) {
      rewritten = rewritten.replace(/^it's\b/i, `${conceptPhrase} is`);
    }

    const rewrittenSentences = [ensureSentence(rewritten)];
    if (sentences[1]) {
      rewrittenSentences.push(ensureSentence(sentences[1]));
    }

    return limitWords(rewrittenSentences.join(" "), 36);
  }

  if (conceptPhrase && topic && conceptPhrase.toLowerCase() !== topic.toLowerCase()) {
    return limitWords(
      `${conceptPhrase} is a core concept in ${topic}. It should be defined by its purpose and core mechanism.`,
      36,
    );
  }

  return limitWords(
    `${conceptPhrase} is a technical concept that should be defined clearly with its purpose and mechanism.`,
    36,
  );
};

const countOverlap = (leftTokens, rightTokens) => {
  const rightTokenSet = new Set(rightTokens);
  return [...new Set(leftTokens)].filter((token) => rightTokenSet.has(token)).length;
};

const MEANINGLESS_ANSWER_PATTERN =
  /\b(idk|i do not know|i don't know|no idea|not sure|maybe|random|blah|nothing|skip)\b/i;
const MECHANISM_SIGNAL_PATTERN =
  /\b(compare|diff|update|render|store|share|dispatch|route|map|resolve|transform|bundle|cache|request|response|state|component|tree|node|memory|flow|mechanism|internally)\b/i;
const TRADEOFF_SIGNAL_PATTERN =
  /\b(trade-?off|tradeoffs|pros and cons|advantages? and disadvantages?|balance|compromise|cost|drawback|overhead|sacrifice|versus|vs)\b/i;
const SYSTEM_LEVEL_SIGNAL_PATTERN =
  /\b(system|architecture|architectural|scalability|scalable|data flow|layer|service|boundary|integration|throughput|latency|consistency|reliability|distributed|end-to-end|workflow)\b/i;
const REAL_WORLD_EXAMPLE_PATTERN =
  /\b(for example|for instance|e\.g\.|in production|in a real project|in a real-world|user clicks|api call|checkout|dashboard|authentication|search results|shopping cart)\b/i;
const CONTRADICTION_SIGNAL_PATTERN =
  /\b(same as|exactly the same as|just a copy|only a copy|copy of the real dom|nothing but)\b/i;
const NEGATED_CONTRADICTION_PATTERN =
  /\bnot\b[^.]{0,24}\b(same as|exactly the same as|just a copy|only a copy|copy of the real dom)\b/i;

const getLibraryIdealAnswer = ({ question, skill }) => {
  const sourceText = `${question} ${skill}`;
  const libraryMatch = IDEAL_ANSWER_LIBRARY.find((entry) => entry.pattern.test(sourceText));
  return libraryMatch?.answer || "";
};

const getIdealSupportTokens = ({ question, skill, idealAnswer }) => {
  const excludedTokens = new Set([...tokenize(question), ...tokenize(skill)]);

  return tokenize(idealAnswer).filter((token) => !excludedTokens.has(token));
};

const getRecentPerformanceAdjustment = (scores = []) => {
  const normalizedScores = normalizeScoreList(scores).slice(-5);

  if (normalizedScores.length < 3) {
    return 0;
  }

  if (normalizedScores.every((score) => score >= 7)) {
    return 1;
  }

  if (normalizedScores.every((score) => score <= 4)) {
    return -1;
  }

  return 0;
};

const getAverageScore = (scores = []) => {
  if (scores.length === 0) {
    return 0;
  }

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
};

const getRecentTrend = (scores = []) => {
  const recentScores = normalizeScoreList(scores).slice(-3);

  if (recentScores.length < 3) {
    return "unstable";
  }

  const [firstScore, secondScore, thirdScore] = recentScores;

  if (recentScores.every((score) => score <= 3)) {
    return "declining";
  }

  if (thirdScore >= 7 && firstScore <= 4 && secondScore <= 4) {
    return "improving";
  }

  if (firstScore < secondScore && secondScore < thirdScore) {
    return "improving";
  }

  if (firstScore > secondScore && secondScore > thirdScore) {
    return "declining";
  }

  if (recentScores.every((score) => score >= 7)) {
    return "stable";
  }

  if (thirdScore < firstScore && thirdScore <= secondScore && (firstScore > secondScore || secondScore > thirdScore)) {
    return "declining";
  }

  return "unstable";
};

const adjustConfidenceByTrend = (confidence, trend) => {
  const normalizedConfidence = normalizeConfidence(confidence);
  const currentIndex = CONFIDENCE_LEVELS.indexOf(normalizedConfidence);

  if (currentIndex === -1) {
    return normalizedConfidence;
  }

  if (trend === "improving") {
    return CONFIDENCE_LEVELS[Math.min(currentIndex + 1, CONFIDENCE_LEVELS.length - 1)];
  }

  if (trend === "declining") {
    return CONFIDENCE_LEVELS[Math.max(currentIndex - 1, 0)];
  }

  return normalizedConfidence;
};

const analyzePerformanceHistory = ({ allScores = [], currentScore = 0 }) => {
  const historicalScores = normalizeScoreList(allScores);
  const scoreSeries = [...historicalScores, normalizeScore(currentScore)].filter((score) => Number.isFinite(score));

  if (scoreSeries.length === 0) {
    return {
      consistency: "unstable",
      trend: "unstable",
      confidence: "low",
    };
  }

  const minimumScore = Math.min(...scoreSeries);
  const maximumScore = Math.max(...scoreSeries);
  const averageScore = getAverageScore(scoreSeries);
  const strongScoreCount = scoreSeries.filter((score) => score >= 7).length;
  const weakScoreCount = scoreSeries.filter((score) => score <= 4).length;

  const consistency =
    scoreSeries.length >= 3 && maximumScore - minimumScore <= 2 ? "stable" : "unstable";

  const trend = getRecentTrend(scoreSeries);

  let baseConfidence = "medium";
  if (
    consistency === "stable" &&
    averageScore >= 7 &&
    strongScoreCount >= Math.ceil(scoreSeries.length * 0.6)
  ) {
    baseConfidence = "high";
  } else if (
    averageScore <= 4.5 ||
    weakScoreCount >= Math.ceil(scoreSeries.length / 2) ||
    (consistency === "unstable" && averageScore < 6)
  ) {
    baseConfidence = "low";
  }

  const confidence = adjustConfidenceByTrend(baseConfidence, trend);

  return {
    consistency,
    trend,
    confidence,
  };
};

const getConceptLabel = ({ question, skill }) => {
  const conceptPhrase = extractConceptPhrase({ question, skill });
  const topic = getPrimaryTopic({ skill, question });
  const candidateLabel = conceptPhrase || topic || "the concept";
  return cleanText(candidateLabel) || "the concept";
};

const getMissingConceptLabel = ({ questionIntent, conceptLabel }) => {
  if (questionIntent === "process") {
    return `the core mechanism of ${conceptLabel}`;
  }

  if (questionIntent === "reasoning") {
    return `the technical rationale behind ${conceptLabel}`;
  }

  if (questionIntent === "comparison") {
    return `the trade-off in ${conceptLabel}`;
  }

  return `the core concept of ${conceptLabel}`;
};

const buildFallbackEvaluation = ({ question, answer, skill, difficulty, recentScores = [], allScores = [] }) => {
  const cleanedAnswer = cleanText(answer);
  const topic = getPrimaryTopic({ skill, question }) || "the topic";
  const conceptLabel = getConceptLabel({ question, skill });
  const questionIntent = getQuestionIntent(question);
  const normalizedDifficulty = normalizeDifficulty(difficulty);
  const missingConceptLabel = getMissingConceptLabel({ questionIntent, conceptLabel });

  if (!cleanedAnswer) {
    return normalizeEvaluation({
      score: 0,
      feedback: `The answer is empty and does not explain ${conceptLabel}.`,
      strength: "It does not provide a usable technical explanation.",
      improvement: `Define ${conceptLabel} clearly and explain how it works.`,
      idealAnswer: buildFallbackIdealAnswer({ question, answer, skill, score: 0 }),
      confidence: analyzePerformanceHistory({ allScores, currentScore: 0 }).confidence,
    });
  }

  const answerTokens = tokenize(cleanedAnswer);
  const contextTokens = [...tokenize(question), ...tokenize(skill)];
  const idealAnswerReference = getLibraryIdealAnswer({ question, skill });
  const idealAnswerTokens = tokenize(idealAnswerReference);
  const idealSupportTokens = getIdealSupportTokens({
    question,
    skill,
    idealAnswer: idealAnswerReference,
  });
  const overlapCount = countOverlap(answerTokens, contextTokens);
  const idealOverlapCount = idealAnswerTokens.length > 0 ? countOverlap(answerTokens, idealAnswerTokens) : 0;
  const supportOverlapCount = idealSupportTokens.length > 0 ? countOverlap(answerTokens, idealSupportTokens) : 0;
  const answerWordCount = cleanedAnswer.split(/\s+/).filter(Boolean).length;
  const hasExample = /\b(example|for example|for instance|e\.g\.)\b/i.test(cleanedAnswer);
  const hasReasoning = /\b(because|so that|therefore|which means|this means|helps|used to)\b/i.test(
    cleanedAnswer,
  );
  const hasMechanismSignal = MECHANISM_SIGNAL_PATTERN.test(cleanedAnswer);
  const hasTradeoffSignal = TRADEOFF_SIGNAL_PATTERN.test(cleanedAnswer);
  const hasSystemLevelThinking = SYSTEM_LEVEL_SIGNAL_PATTERN.test(cleanedAnswer);
  const hasRealWorldExample = REAL_WORLD_EXAMPLE_PATTERN.test(cleanedAnswer);
  const hasEightPlusQualifier = hasTradeoffSignal || hasSystemLevelThinking || hasRealWorldExample;
  const coveredTerms = getCoveredTerms({ question, skill, answer: cleanedAnswer });
  const missingTerms = getMissingTerms({ question, skill, answer: cleanedAnswer });
  const coveredTermsText = formatList(coveredTerms);
  const missingTermsText = formatList(missingTerms);
  const isMeaninglessAnswer =
    MEANINGLESS_ANSWER_PATTERN.test(cleanedAnswer) ||
    answerWordCount <= 2 ||
    (answerWordCount <= 5 && overlapCount === 0);
  const isKeywordOnlyAnswer =
    overlapCount >= 1 &&
    answerWordCount < 12 &&
    !hasReasoning &&
    !hasMechanismSignal &&
    !hasExample &&
    idealOverlapCount < 2;
  const coherentExplanation =
    answerWordCount >= 8 && (hasReasoning || hasMechanismSignal || idealOverlapCount >= 2);
  const contradictsCoreConcept =
    CONTRADICTION_SIGNAL_PATTERN.test(cleanedAnswer) &&
    !NEGATED_CONTRADICTION_PATTERN.test(cleanedAnswer) &&
    supportOverlapCount <= 1 &&
    idealAnswerReference &&
    overlapCount >= 1;
  const hasCorrectnessAnchor = idealAnswerReference
    ? supportOverlapCount >= 2
    : coveredTerms.length > 0 && missingTerms.length === 0 && (hasMechanismSignal || hasReasoning);
  const isConceptuallyCorrect =
    !isMeaninglessAnswer &&
    !isKeywordOnlyAnswer &&
    !contradictsCoreConcept &&
    hasCorrectnessAnchor;
  const isClearAnswer =
    answerWordCount >= 8 &&
    (hasReasoning || hasMechanismSignal || supportOverlapCount >= 2 || coveredTerms.length > 0);
  const isPartiallyCorrect =
    isConceptuallyCorrect &&
    (supportOverlapCount >= 2 || coveredTerms.length > 0) &&
    answerWordCount >= 5;
  const explainsCoreConceptClearly = isConceptuallyCorrect && isClearAnswer;

  let baseScore = 0;

  if (contradictsCoreConcept) {
    baseScore = overlapCount >= 2 ? 1 : 0;
  } else if (isMeaninglessAnswer || isKeywordOnlyAnswer) {
    baseScore = isMeaninglessAnswer ? 0 : Math.min(3, Math.max(1, overlapCount));
  } else if (explainsCoreConceptClearly) {
    baseScore = 6;
    if (answerWordCount >= 18) baseScore += 1;
    if (hasMechanismSignal) baseScore += 1;
    if (hasExample) baseScore += 1;
    if (missingTerms.length === 0 && (answerWordCount >= 28 || normalizedDifficulty === "hard")) {
      baseScore += 1;
    }
  } else if (isPartiallyCorrect) {
    baseScore = 4;
    if (answerWordCount >= 10) baseScore += 1;
    if (hasMechanismSignal || hasReasoning) baseScore += 1;
    baseScore = Math.min(baseScore, 6);
  } else {
    baseScore = overlapCount >= 2 ? 3 : overlapCount === 1 ? 2 : 1;
  }

  if (baseScore >= 8 && !hasEightPlusQualifier) {
    baseScore = 7;
  }

  let score = baseScore;
  const recentPerformanceAdjustment = getRecentPerformanceAdjustment(recentScores);

  if (recentPerformanceAdjustment > 0 && explainsCoreConceptClearly) {
    score += 1;
  } else if (recentPerformanceAdjustment < 0 && score >= 5) {
    score -= 1;
  }

  if (contradictsCoreConcept || isMeaninglessAnswer || isKeywordOnlyAnswer || !isConceptuallyCorrect || baseScore <= 3) {
    score = Math.min(score, 3);
  }

  if (explainsCoreConceptClearly) {
    score = Math.max(score, 6);
  }

  if (score >= 8 && !hasEightPlusQualifier) {
    score = 7;
  }

  score = Math.max(0, Math.min(10, score));
  const performanceAnalysis = analyzePerformanceHistory({ allScores, currentScore: score });

  let feedback = `The answer is unclear and does not explain ${missingConceptLabel}.`;
  if (contradictsCoreConcept) {
    feedback = `The answer contradicts the core concept and is technically incorrect.`;
  }
  if (score >= 4 && score <= 6) {
    feedback = `The answer shows partial understanding of ${conceptLabel}, but it does not explain ${missingConceptLabel}.`;
  } else if (score >= 7 && score <= 8) {
    feedback = `The answer explains ${conceptLabel} correctly and covers the core idea clearly.`;
  } else if (score >= 9) {
    feedback = `The answer explains ${conceptLabel} clearly and adds strong technical depth.`;
  }

  let strength = "No clear strength in the answer";
  if (hasRealWorldExample) {
    strength = `It uses a concrete example to support the explanation.`;
  } else if (hasTradeoffSignal) {
    strength = `It identifies a real technical trade-off.`;
  } else if (hasSystemLevelThinking) {
    strength = `It connects the idea to system-level design.`;
  } else if (hasMechanismSignal || hasReasoning) {
    strength = `It explains part of the mechanism behind ${conceptLabel}.`;
  } else if (score >= 4) {
    strength = `It stays focused on ${conceptLabel}.`;
  }

  if (score <= 3) {
    strength = "No clear strength in the answer";
  }

  let improvement = `Explain ${missingConceptLabel} more clearly and add one technical detail.`;
  if (score >= 7) {
    if (!hasRealWorldExample && !hasTradeoffSignal && !hasSystemLevelThinking) {
      improvement = `Add a real-world example or mention performance trade-offs.`;
    } else if (!hasRealWorldExample) {
      improvement = `Add one real-world example to make the explanation more concrete.`;
    } else if (!hasTradeoffSignal) {
      improvement = `Mention one technical trade-off or optimization detail.`;
    } else if (!hasSystemLevelThinking) {
      improvement = `Add one system-level implication or scaling consideration.`;
    } else {
      improvement = `Add one optimization detail or edge case to deepen the answer.`;
    }
  } else if (contradictsCoreConcept) {
    improvement = `Correct the definition first, then explain the actual mechanism clearly.`;
  } else if (questionIntent === "process") {
    improvement = `Explain the sequence step by step and show how ${conceptLabel} works.`;
  } else if (questionIntent === "reasoning") {
    improvement = `State the technical reason and one key trade-off more clearly.`;
  } else if (questionIntent === "comparison") {
    improvement = `Compare both sides directly and name the technical trade-off clearly.`;
  } else if (questionIntent === "definition") {
    improvement = `Define ${conceptLabel} first, then explain how it works internally.`;
  }

  if (!hasExample && score >= 4 && score < 7) {
    improvement = `${improvement} Add one short example.`;
  }

  return normalizeEvaluation({
    score,
    feedback: toSentenceCase(feedback),
    strength: toSentenceCase(strength),
    improvement: toSentenceCase(improvement),
    idealAnswer: buildFallbackIdealAnswer({ question, answer, skill, score }),
    confidence: performanceAnalysis.confidence,
  });
};

const evaluateWithGemini = async ({ question, answer, skill, difficulty, recentScores = [], allScores = [] }) => {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: `
You are an expert interviewer evaluating a candidate’s answer.

---

INPUT:

Question:
${question}

Candidate Answer:
${answer}

Skill:
${skill}

Difficulty:
${difficulty}

---

SHORT-TERM MEMORY (recent performance: last 3–5 answers):

recentScores:
${JSON.stringify(normalizeScoreList(recentScores))}

---

LONG-TERM MEMORY (entire interview performance):

allScores:
${JSON.stringify(normalizeScoreList(allScores))}

---

EVALUATION OBJECTIVE:

1. Evaluate the CURRENT answer first (primary factor)
2. Use recentScores to adjust difficulty-related strictness
3. Use allScores to determine consistency and confidence

---

SCORING RULES (STRICT):

1. Score from 0 to 10:

   * 0–3 → incorrect or irrelevant
   * 4–6 → partial understanding
   * 7–8 → good answer
   * 9–10 → excellent, complete

2. Evaluate based on:

   * correctness
   * depth
   * clarity
   * technical accuracy

CRITICAL:

   * If the answer is incorrect, vague, meaningless, or logically wrong -> score MUST be between 0 and 3
   * Mentioning keywords without correct explanation MUST NOT increase score
   * If the answer contradicts the concept -> score should be 0 or 1
   * Do NOT reward effort, wording, or length if the concept is wrong
   * Be strict and realistic, like a real interviewer

CORRECTNESS OVERRIDE RULE:

   * If the core concept is incorrect -> ignore all other qualities and assign low score (0–3)

ONLY give score 4+ if:

   * the answer is conceptually correct
   * AND explains the idea clearly
   * Score 8+ ONLY if the answer includes trade-offs OR system-level thinking OR a real-world example

---

SHORT-TERM ADJUSTMENT (recentScores):

* If recent scores are consistently high (≥7):
  -> allow slight reward (+1 max)

* If recent scores are inconsistent:
  -> do NOT adjust score

* If recent scores are consistently low (≤4):
  -> be stricter (−1 max)

---

LONG-TERM ANALYSIS (allScores):

Determine:

* consistency (stable / unstable)
* trend (improving / declining / unstable)

Rules:

* If overall performance is stable and strong:
  -> confidence = "high"

* If mixed or fluctuating:
  -> confidence = "medium"

* If mostly weak or inconsistent:
  -> confidence = "low"

IMPORTANT:

* Long-term data should NOT heavily change the score
* It only affects confidence and subtle judgment tone

---

OUTPUT FORMAT (STRICT JSON ONLY):

{
"score": 0,
"feedback": "",
"strength": "",
"improvement": "",
"idealAnswer": "",
"confidence": "low | medium | high"
}

---

RESPONSE RULES:

* Feedback MUST be clear, grammatically correct, and professional
* Use simple, direct English
* Do NOT generate meaningless or unclear sentences
* Always explain what is wrong and what is missing
* Keep all responses short, clean, and human-readable

FEEDBACK FIELD RULES:

* "strength" MUST highlight a real positive point
* If no real strength exists -> return: "No clear strength in the answer"
* Do NOT repeat negative feedback inside "strength"

IMPROVEMENT RULE:

* If score ≥ 7:
  -> improvement MUST be refinement, not correction
  -> suggest adding depth, example, or optimization
  -> do NOT say "explain clearly" if already clear

---

IDEAL ANSWER RULES:

* Must be technically correct and meaningful
* Must explain the core concept clearly
* 1–2 lines only
* Avoid vague or circular definitions

---

Return ONLY JSON. No explanation.
`,
  });

  const rawText = typeof response.text === "string" ? response.text : "";
  if (!rawText) {
    return null;
  }

  return normalizeEvaluation(parseJsonPayload(rawText));
};

const evaluateInterviewAnswer = async ({
  question,
  answer,
  skill,
  difficulty,
  level,
  recentScores = [],
  allScores = [],
}) => {
  const resolvedDifficulty = normalizeDifficulty(difficulty || level);
  const normalizedRecentScores = normalizeScoreList(recentScores);
  const normalizedAllScores = normalizeScoreList(allScores);

  try {
    const aiEvaluation = await evaluateWithGemini({
      question,
      answer,
      skill,
      difficulty: resolvedDifficulty,
      recentScores: normalizedRecentScores,
      allScores: normalizedAllScores,
    });
    if (aiEvaluation) {
      return {
        evaluator: "gemini",
        evaluation: aiEvaluation,
      };
    }
  } catch (error) {
    // Fall back to heuristic scoring if the AI call fails or returns invalid JSON.
  }

  return {
    evaluator: "fallback",
    evaluation: buildFallbackEvaluation({
      question,
      answer,
      skill,
      difficulty: resolvedDifficulty,
      recentScores: normalizedRecentScores,
      allScores: normalizedAllScores,
    }),
  };
};

module.exports = {
  analyzePerformanceHistory,
  evaluateInterviewAnswer,
};
