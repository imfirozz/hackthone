/**
 * API Key Manager - Handles multiple API keys with fallback and rotation
 * Automatically switches to next API key on rate limit or failure
 */

const { GoogleGenAI } = require("@google/genai");

class ApiKeyManager {
  constructor() {
    this.apiKeys = this.initializeApiKeys();
    this.currentKeyIndex = 0;
    this.keyFailureCount = {}; // Track failures per key
    this.keyLastFailureTime = {}; // Track when key last failed
    this.keyRetryDelay = 60000; // 1 minute retry delay for failed keys
    this.maxFailuresBeforeRotation = 3; // Switch after 3 failures
    
    // Initialize failure tracking
    this.apiKeys.forEach((_, index) => {
      this.keyFailureCount[index] = 0;
      this.keyLastFailureTime[index] = 0;
    });
  }

  /**
   * Initialize API keys from environment variables
   * Supports multiple keys: PRIMARY, SECONDARY, TERTIARY, etc.
   */
  initializeApiKeys() {
    const keys = [];
    
    // Check for multiple API keys in environment
    const primaryKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
    const secondaryKey = (process.env.GEMINI_API_KEY_2 || "").trim();
    const tertiaryKey = (process.env.GEMINI_API_KEY_3 || "").trim();
    const quaternaryKey = (process.env.GEMINI_API_KEY_4 || "").trim();
    
    // Add keys that are configured
    if (primaryKey && !primaryKey.toLowerCase().startsWith("your_")) {
      keys.push({ key: primaryKey, priority: 1, name: "PRIMARY" });
    }
    if (secondaryKey && !secondaryKey.toLowerCase().startsWith("your_")) {
      keys.push({ key: secondaryKey, priority: 2, name: "SECONDARY" });
    }
    if (tertiaryKey && !tertiaryKey.toLowerCase().startsWith("your_")) {
      keys.push({ key: tertiaryKey, priority: 3, name: "TERTIARY" });
    }
    if (quaternaryKey && !quaternaryKey.toLowerCase().startsWith("your_")) {
      keys.push({ key: quaternaryKey, priority: 4, name: "QUATERNARY" });
    }
    
    if (keys.length === 0) {
      console.warn(
        "⚠️  No valid API keys configured. Add GEMINI_API_KEY or GEMINI_API_KEY_2/3/4 to .env"
      );
    }
    
    return keys;
  }

  /**
   * Get current active API key
   */
  getCurrentKey() {
    if (this.apiKeys.length === 0) {
      throw new Error("No API keys available");
    }
    
    const now = Date.now();
    
    // Find an available key that isn't in cooldown
    for (let i = 0; i < this.apiKeys.length; i++) {
      const index = (this.currentKeyIndex + i) % this.apiKeys.length;
      const keyInfo = this.apiKeys[index];
      const lastFailure = this.keyLastFailureTime[index] || 0;
      
      // Skip keys still in cooldown period
      if (now - lastFailure < this.keyRetryDelay) {
        continue;
      }
      
      // Use this key
      this.currentKeyIndex = index;
      return keyInfo;
    }
    
    // All keys in cooldown, reset and use the one with least failures
    let minFailures = Infinity;
    let bestIndex = 0;
    
    for (let i = 0; i < this.apiKeys.length; i++) {
      if ((this.keyFailureCount[i] || 0) < minFailures) {
        minFailures = this.keyFailureCount[i] || 0;
        bestIndex = i;
      }
    }
    
    this.currentKeyIndex = bestIndex;
    this.keyFailureCount[bestIndex] = 0; // Reset failure count
    this.keyLastFailureTime[bestIndex] = 0; // Reset cooldown
    
    console.log(`🔄 All keys in cooldown, resetting ${this.apiKeys[bestIndex].name}`);
    
    return this.apiKeys[bestIndex];
  }

  /**
   * Mark current key as failed and rotate to next
   */
  recordKeyFailure(error) {
    const currentKey = this.apiKeys[this.currentKeyIndex];
    
    // Detect rate limit errors
    const isRateLimit = this.isRateLimitError(error);
    const failureType = isRateLimit ? "RATE_LIMIT" : "ERROR";
    
    this.keyFailureCount[this.currentKeyIndex]++;
    this.keyLastFailureTime[this.currentKeyIndex] = Date.now();
    
    const failureCount = this.keyFailureCount[this.currentKeyIndex];
    const keyName = currentKey?.name || "UNKNOWN";
    
    console.error(
      `❌ [${failureType}] Key ${keyName} failed (${failureCount} times). ` +
      `Error: ${error.message}`
    );
    
    // Rotate to next key
    this.rotateKey();
  }

  /**
   * Rotate to next available API key
   */
  rotateKey() {
    const previousIndex = this.currentKeyIndex;
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    
    const newKey = this.apiKeys[this.currentKeyIndex];
    const oldKey = this.apiKeys[previousIndex];
    
    console.log(
      `🔀 Rotating from ${oldKey?.name} to ${newKey?.name}. ` +
      `Available keys: ${this.apiKeys.length}`
    );
  }

  /**
   * Check if error is a rate limit error
   */
  isRateLimitError(error) {
    if (!error) return false;
    
    const message = error.message?.toLowerCase() || "";
    const errorMessage = error.toString().toLowerCase();
    
    return (
      error.status === 429 ||
      message.includes("rate limit") ||
      message.includes("too many requests") ||
      message.includes("quota") ||
      errorMessage.includes("429") ||
      errorMessage.includes("rate")
    );
  }

  /**
   * Get Gemini client with current API key
   */
  getClient() {
    const keyInfo = this.getCurrentKey();
    
    if (!keyInfo) {
      throw new Error("No valid API key available");
    }
    
    try {
      return new GoogleGenAI({ apiKey: keyInfo.key });
    } catch (error) {
      console.error(`Failed to create client with ${keyInfo.name}:`, error.message);
      this.recordKeyFailure(error);
      
      // Recursively try next key
      if (this.apiKeys.length > 1) {
        return this.getClient();
      }
      
      throw error;
    }
  }

  /**
   * Execute function with automatic retry on different API key
   */
  async executeWithFallback(fn, maxRetries = this.apiKeys.length) {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const client = this.getClient();
        console.log(`📡 Attempt ${attempt + 1} with ${this.apiKeys[this.currentKeyIndex]?.name}`);
        
        return await fn(client);
      } catch (error) {
        lastError = error;
        this.recordKeyFailure(error);
        
        if (attempt < maxRetries - 1) {
          console.log(`⏳ Retrying with next API key...`);
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    
    throw new Error(
      `All ${maxRetries} API key(s) failed. Last error: ${lastError?.message}`
    );
  }

  /**
   * Get status of all keys
   */
  getStatus() {
    return this.apiKeys.map((keyInfo, index) => ({
      name: keyInfo.name,
      priority: keyInfo.priority,
      failures: this.keyFailureCount[index] || 0,
      lastFailure: this.keyLastFailureTime[index] || 0,
      inCooldown: (Date.now() - (this.keyLastFailureTime[index] || 0)) < this.keyRetryDelay,
    }));
  }

  /**
   * Reset all failure counters (useful for periodic reset)
   */
  resetFailureCounters() {
    this.apiKeys.forEach((_, index) => {
      this.keyFailureCount[index] = 0;
      this.keyLastFailureTime[index] = 0;
    });
    console.log("🔄 API Key failure counters reset");
  }
}

// Singleton instance
let instance;

const getApiKeyManager = () => {
  if (!instance) {
    instance = new ApiKeyManager();
  }
  return instance;
};

module.exports = {
  ApiKeyManager,
  getApiKeyManager,
};
