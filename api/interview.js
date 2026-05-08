const {
  app,
  initializeInterviewServices,
} = require("../Hackthone_Backend/source/interviewApp");

module.exports = async (req, res) => {
  try {
    await initializeInterviewServices();
    return app(req, res);
  } catch (error) {
    console.error("Vercel interview bootstrap failed:", error);
    return res.status(500).json({
      message: "Interview service initialization failed.",
      error: error.message,
    });
  }
};
