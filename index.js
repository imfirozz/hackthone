const { app, initializeServices } = require("../Hackthone_Backend/source/app");

module.exports = async (req, res) => {
  try {
    await initializeServices();
    return app(req, res);
  } catch (error) {
    console.error("Vercel API bootstrap failed:", error);
    return res.status(500).json({
      message: "Server initialization failed.",
      error: error.message,
    });
  }
};
