const {
  app,
  initializeRecordsServices,
} = require("../Hackthone_Backend/source/recordsApp");

module.exports = async (req, res) => {
  try {
    await initializeRecordsServices();
    return app(req, res);
  } catch (error) {
    console.error("Vercel records bootstrap failed:", error);
    return res.status(500).json({
      message: "Records service initialization failed.",
      error: error.message,
    });
  }
};
