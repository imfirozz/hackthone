const express = require("express");
const userMiddleware = require("../middleware/userMiddlwere");
const {
  buildAnalyticsSummary,
  buildCandidateDirectory,
  buildLeaderboardEntries,
  fetchInterviewRecords,
  normalizeScope,
} = require("../services/recordsService");

const recordsRouter = express.Router();

recordsRouter.use(userMiddleware);

recordsRouter.get("/interviews", async (req, res) => {
  try {
    const scope = normalizeScope(req.query.scope, req.result);
    const records = await fetchInterviewRecords({
      scope,
      user: req.result,
    });

    return res.status(200).json({
      message: "Interview records fetched successfully.",
      scope,
      total: records.length,
      records,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch interview records.",
      error: error.message,
    });
  }
});

recordsRouter.get("/candidates", async (req, res) => {
  try {
    const scope = normalizeScope(req.query.scope, req.result);
    const records = await fetchInterviewRecords({
      scope,
      user: req.result,
    });
    const candidates = buildCandidateDirectory(records);

    return res.status(200).json({
      message: "Candidate records fetched successfully.",
      scope,
      total: candidates.length,
      candidates,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch candidate records.",
      error: error.message,
    });
  }
});

recordsRouter.get("/leaderboard", async (req, res) => {
  try {
    const scope = normalizeScope(req.query.scope, req.result);
    const records = await fetchInterviewRecords({
      scope,
      user: req.result,
    });
    const leaderboard = buildLeaderboardEntries(records);

    return res.status(200).json({
      message: "Leaderboard fetched successfully.",
      scope,
      total: leaderboard.length,
      leaderboard,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch leaderboard.",
      error: error.message,
    });
  }
});

recordsRouter.get("/analytics", async (req, res) => {
  try {
    const scope = normalizeScope(req.query.scope, req.result);
    const records = await fetchInterviewRecords({
      scope,
      user: req.result,
    });
    const summary = buildAnalyticsSummary(records);

    return res.status(200).json({
      message: "Analytics data fetched successfully.",
      scope,
      summary,
      total: records.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch analytics data.",
      error: error.message,
    });
  }
});

module.exports = recordsRouter;
