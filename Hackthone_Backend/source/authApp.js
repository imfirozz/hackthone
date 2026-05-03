const path = require("path");
const fs = require("fs");
const envPaths = [
  path.resolve(__dirname, "../.env"),
  path.resolve(process.cwd(), "Hackthone_Backend/.env"),
  path.resolve(process.cwd(), ".env")
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
const authRouter = require("./routes/userAuth");
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
app.use("/", authRouter);

redisClient.on("error", (error) => {
  console.log(`Redis unavailable: ${error.message}`);
});

let initializationPromise = null;
let redisInitializationPromise = null;

async function ensureRedisConnection() {
  if (redisClient?.isOpen) {
    return;
  }

  if (!redisInitializationPromise) {
    redisInitializationPromise = redisClient
      .connect()
      .then(() => {
        console.log("Redis connected");
      })
      .catch((error) => {
        console.log(`Redis disabled for this run: ${error.message}`);
      });
  }

  await redisInitializationPromise;
}

async function initializeAuthServices() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      await connectDatabase();
      console.log("DB connected");
      await ensureRedisConnection();
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
  initializeAuthServices,
};
