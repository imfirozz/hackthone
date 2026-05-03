const mongoose = require("mongoose");

let connectionPromise = null;

function resolveMongoUri() {
  return (
    process.env.DataBase_connection_string ||
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.DATABASE_URL ||
    ""
  ).trim();
}

async function main() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoUri = resolveMongoUri();

  if (!mongoUri) {
    throw new Error(
      "MongoDB connection string is missing. Set MONGODB_URI or DataBase_connection_string in the deployment environment.",
    );
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(mongoUri)
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
  }

  await connectionPromise;
  return mongoose.connection;
}

module.exports = main;
