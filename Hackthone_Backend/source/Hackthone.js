const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const express = require("express");
const main = require("./config/DataBase");
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/userAuth");
const resumeRouter = require("./routes/resumeRoutes");
const interviewRouter = require("./routes/interviewRoutes");
const recordsRouter = require("./routes/recordsRoutes");
const redisClient = require("./config/redis");
const frontendDistPath = path.resolve(__dirname, "../../Hackthone_frontend/dist");
const frontendIndexPath = path.join(frontendDistPath, "index.html");

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5177,http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  const matchedOrigin = requestOrigin ? allowedOrigins.find((origin) => origin === requestOrigin) : "";

  if (!requestOrigin || matchedOrigin) {
    res.header("Access-Control-Allow-Origin", requestOrigin || allowedOrigins[0]);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use("/", authRouter)
app.use("/api/resume", resumeRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/records", recordsRouter);

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  app.get("/", (_req, res) => {
    res.sendFile(frontendIndexPath);
  });
}

redisClient.on("error", (error) => {
  console.log(`Redis unavailable: ${error.message}`);
});

const startRedisIfAvailable = async () => {
  try {
    await redisClient.connect();
    console.log("Redis connected");
  } catch (error) {
    console.log(`Redis disabled for this run: ${error.message}`);
  }
};

const initialiazeConnetion = async () => {
  try {
    await main();
    console.log("DB connected");

    startRedisIfAvailable();

    app.listen(process.env.PORT, () => {
      console.log("server is running on the port " + process.env.PORT);
    });
  } catch (err) {
    console.log("error " + err);
  }
};

initialiazeConnetion();
