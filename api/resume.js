const {
  app,
  initializeResumeServices,
} = require("../Hackthone_Backend/source/resumeApp");

module.exports = async (req, res) => {
  try {
    await initializeResumeServices();
    return app(req, res);
  } catch (error) {
    console.error("Vercel resume bootstrap failed:", error);
    return res.status(500).json({
      message: "Resume service initialization failed.",
      error: error.message,
    });
  }
};
