const mongoose = require("mongoose");

const getMongoReadyState = () => mongoose.connection?.readyState || 0;

const isMongoConnected = () => getMongoReadyState() === 1;

const resolveFallbackValue = async (fallbackValue) =>
  typeof fallbackValue === "function" ? fallbackValue() : fallbackValue;

const withMongoFallback = async ({
  label = "Mongo fallback",
  fallbackValue = null,
  operation,
}) => {
  if (!isMongoConnected()) {
    console.log(`${label}: MongoDB connection is not ready`);
    return resolveFallbackValue(fallbackValue);
  }

  try {
    return await operation();
  } catch (error) {
    console.log(`${label}: ${error?.message || error}`);
    return resolveFallbackValue(fallbackValue);
  }
};

module.exports = {
  getMongoReadyState,
  isMongoConnected,
  withMongoFallback,
};
