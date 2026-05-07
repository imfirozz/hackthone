const { app, initializeServices } = require("../Hackthone_Backend/source/app");

module.exports = async (req, res) => {
  try {
    await initializeServices();
    return app(req, res);
  } catch (error) {
    console.error("Vercel API bootstrap failed:", error);
    req.bootstrapError = error;
    res.setHeader("x-service-bootstrap", "degraded");
    return app(req, res);
  }
};
