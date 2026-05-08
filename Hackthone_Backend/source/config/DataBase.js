const mongoose = require("mongoose");

let connectionPromise = null;

mongoose.set("bufferCommands", false);

const CONNECT_OPTS = {
  serverSelectionTimeoutMS: 8000,
  connectTimeoutMS: 8000,
  maxPoolSize: 10,
};

/**
 * Ordered list of connection strings; duplicates (same URI twice) are skipped.
 * Set multiple fallbacks: MONGODB_URI_2, MONGODB_URI_3, or MONGODB_URIS=a,b,c
 */
function collectMongoUris() {
  const parts = [
    process.env.DataBase_connection_string,
    process.env.MONGODB_URI,
    process.env.MONGO_URI,
    process.env.DATABASE_URL,
    process.env.MONGODB_URI_2,
    process.env.MONGODB_URI_3,
    process.env.MONGODB_URI_4,
  ];

  const listEnv = process.env.MONGODB_URIS || process.env.MONGODB_URI_LIST || "";
  if (listEnv.trim()) {
    parts.push(...listEnv.split(/[\n,]/).map((s) => s.trim()).filter(Boolean));
  }

  const seen = new Set();
  const uris = [];
  for (const raw of parts) {
    const uri = String(raw || "").trim();
    if (!uri || uri.toLowerCase().startsWith("your_")) {
      continue;
    }
    if (seen.has(uri)) {
      continue;
    }
    seen.add(uri);
    uris.push(uri);
  }
  return uris;
}

async function connectToUri(uri) {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.disconnect().catch(() => {});

  await mongoose.connect(uri, CONNECT_OPTS);
  return mongoose.connection;
}

async function main() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uris = collectMongoUris();

  if (uris.length === 0) {
    throw new Error(
      "MongoDB connection string is missing. Set MONGODB_URI, DataBase_connection_string, or MONGODB_URIS in the deployment environment.",
    );
  }

  if (!connectionPromise) {
    connectionPromise = (async () => {
      let lastError = null;

      for (let i = 0; i < uris.length; i += 1) {
        try {
          console.log(`MongoDB: trying connection ${i + 1}/${uris.length}…`);
          const conn = await connectToUri(uris[i]);
          console.log(`MongoDB: connected using URI index ${i + 1}.`);
          return conn;
        } catch (error) {
          lastError = error;
          console.error(
            `MongoDB: connection attempt ${i + 1}/${uris.length} failed: ${error?.message || error}`,
          );
        }
      }

      connectionPromise = null;
      throw lastError || new Error("All MongoDB connection attempts failed.");
    })().catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  await connectionPromise;
  return mongoose.connection;
}

module.exports = main;
