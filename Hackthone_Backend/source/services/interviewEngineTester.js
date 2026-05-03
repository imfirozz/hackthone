const {
  analyzePerformanceHistory,
  evaluateInterviewAnswer,
} = require("./aiInterviewEvaluator");
const {
  getDifficultyProgression,
  normalizeDifficulty,
} = require("./interviewSessionService");

const cleanText = (value = "") => value.replace(/\s+/g, " ").trim();

const normalizeAnswerText = (value) => (typeof value === "string" ? cleanText(value) : "");

const normalizeAnswerSequence = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return {
          answer: normalizeAnswerText(item),
        };
      }

      if (item && typeof item === "object") {
        return {
          answer: normalizeAnswerText(item.answer || item.response || item.text),
          question: normalizeAnswerText(item.question),
          skill: normalizeAnswerText(item.skill),
        };
      }

      return null;
    })
    .filter((item) => item?.answer);
};

const simulateInterviewEngine = async ({
  answersSequence,
  question = "",
  skill = "",
}) => {
  const normalizedAnswersSequence = normalizeAnswerSequence(answersSequence);
  const defaultQuestion = normalizeAnswerText(question) || "Explain the concept clearly.";
  const defaultSkill = normalizeAnswerText(skill) || "General Technical Interview";

  let currentDifficulty = "easy";
  let progressionState = {
    mediumSuccessStreak: 0,
    mediumPromotionThreshold: 0,
  };
  const allScores = [];
  const steps = [];

  for (const stepInput of normalizedAnswersSequence) {
    const recentScores = allScores.slice(-3);
    const result = await evaluateInterviewAnswer({
      question: stepInput.question || defaultQuestion,
      answer: stepInput.answer,
      skill: stepInput.skill || defaultSkill,
      difficulty: currentDifficulty,
      recentScores,
      allScores,
    });

    const score = Number(result?.evaluation?.score) || 0;
    allScores.push(score);

    const updatedRecentScores = allScores.slice(-3);
    const performance = analyzePerformanceHistory({
      allScores: allScores.slice(0, -1),
      currentScore: score,
    });

    steps.push({
      answer: stepInput.answer,
      score,
      difficulty: normalizeDifficulty(currentDifficulty),
      recentScores: updatedRecentScores,
      allScores: [...allScores],
      confidence: performance.confidence,
      trend: performance.trend,
    });

    const progression = getDifficultyProgression(progressionState, currentDifficulty, score);
    currentDifficulty = progression.nextDifficulty;
    progressionState = {
      mediumSuccessStreak: progression.mediumSuccessStreak,
      mediumPromotionThreshold: progression.mediumPromotionThreshold,
    };
  }

  return {
    steps,
  };
};

module.exports = {
  simulateInterviewEngine,
};
