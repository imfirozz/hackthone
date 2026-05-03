const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { app, initializeServices } = require("./app");

const port = Number(process.env.PORT) || 3000;

const initializeConnection = async () => {
  try {
    await initializeServices();

    app.listen(port, () => {
      console.log("server is running on the port " + port);
    });
  } catch (error) {
    console.log("error " + error);
  }
};

initializeConnection();
