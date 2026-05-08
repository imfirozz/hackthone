const path = require("path");
const fs = require("fs");

const envPaths = [
  path.resolve(__dirname, "../.env"),
  path.resolve(process.cwd(), "Hackthone_Backend/.env"),
  path.resolve(process.cwd(), ".env"),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require("dotenv").config({ path: envPath });
    break;
  }
}

const express = require("express");
const cookieParser = require("cookie-parser");

const connectDatabase = require("./config/DataBase");
const interviewRouter = require("./routes/interviewRoutes");
const redisClient = require("./config/redis");

const allowedOrigins = (
  process.env.FRONTEND_URL || "http://localhost:5177,http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  const matchedOrigin = requestOrigin
    ? allowedOrigins.find((origin) => origin === requestOrigin)
    : "";

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

app.use("/api/interview", interviewRouter);
app.use("/", interviewRouter);

redisClient.on("error", (error) => {
  console.log(`Redis unavailable: ${error.message}`);
});

let initializationPromise = null;
let redisInitializationStarted = false;

function startRedisIfAvailable() {
  if (redisClient?.isOpen || redisInitializationStarted) {
    return;
  }

  redisInitializationStarted = true;
  redisClient
    .connect()
    .then(() => {
      console.log("Redis connected");
    })
    .catch((error) => {
      console.log(`Redis disabled for interview API: ${error.message}`);
    });
}

async function initializeInterviewServices() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      try {
        await connectDatabase();
        console.log("DB connected");
      } catch (error) {
        console.log(`Interview API continuing without MongoDB: ${error.message}`);
      }

      startRedisIfAvailable();
      return app;
    })().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  return initializationPromise;
}

module.exports = {
  app,
  initializeInterviewServices,
};
