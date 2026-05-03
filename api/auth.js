const { app, initializeAuthServices } = require("../Hackthone_Backend/source/authApp");

module.exports = async (req, res) => {
  try {
    await initializeAuthServices();
    return app(req, res);
  } catch (error) {
    console.error("Vercel auth bootstrap failed:", error);
    return res.status(500).json({
      message: "Authentication service initialization failed.",
      error: error.message,
    });
  }
};
