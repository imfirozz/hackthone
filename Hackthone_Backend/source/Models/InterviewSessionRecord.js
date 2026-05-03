const mongoose = require("mongoose");
const { Schema } = mongoose;

const interviewReviewSchema = new Schema(
  {
    feedback: { type: String, trim: true, default: "" },
    strength: { type: String, trim: true, default: "" },
    improvement: { type: String, trim: true, default: "" },
    idealAnswer: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const interviewStepSchema = new Schema(
  {
    question: { type: String, trim: true, default: "" },
    topic: { type: String, trim: true, default: "" },
    difficulty: { type: String, trim: true, default: "" },
    answer: { type: String, trim: true, default: "" },
    score: { type: Number, min: 0, max: 10, default: 0 },
    confidence: { type: String, trim: true, default: "" },
    trend: { type: String, trim: true, default: "" },
    review: { type: interviewReviewSchema, default: () => ({}) },
    askedAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
  },
  { _id: false },
);

const interviewSessionRecordSchema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "user",
      default: null,
      index: true,
    },
    title: { type: String, trim: true, default: "" },
    category: { type: String, trim: true, default: "" },
    mode: { type: String, trim: true, default: "" },
    responseMode: {
      type: String,
      enum: ["text", "voice", "hybrid"],
      default: "text",
    },
    company: { type: String, trim: true, default: "" },
    round: { type: String, trim: true, default: "" },
    domain: { type: String, trim: true, default: "general" },
    skills: [{ type: String, trim: true }],
    focus: [{ type: String, trim: true }],
    questionTarget: { type: Number, min: 1, default: 8 },
    currentDifficulty: { type: String, trim: true, default: "medium" },
    questionCount: { type: Number, min: 0, default: 0 },
    answerCount: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["started", "in_progress", "completed", "abandoned"],
      default: "started",
    },
    resumeFileName: { type: String, trim: true, default: "" },
    resumeParser: { type: String, trim: true, default: "" },
    resumeSkills: {
      languages: [{ type: String, trim: true }],
      frameworks: [{ type: String, trim: true }],
      tools: [{ type: String, trim: true }],
      concepts: [{ type: String, trim: true }],
    },
    lastQuestion: { type: Schema.Types.Mixed, default: null },
    lastEvaluation: { type: Schema.Types.Mixed, default: null },
    steps: { type: [interviewStepSchema], default: [] },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const InterviewSessionRecord = mongoose.model(
  "interview_session_record",
  interviewSessionRecordSchema,
);

module.exports = InterviewSessionRecord;
