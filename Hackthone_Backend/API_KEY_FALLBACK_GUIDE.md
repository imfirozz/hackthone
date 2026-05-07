# API Key Fallback System - Implementation Guide

## Overview

Your backend now has a robust API key fallback and rotation system that automatically switches between multiple API keys when one fails or hits rate limits. This prevents service disruptions and ensures continuous availability.

## How It Works

### Key Features

1. **Automatic Failover**: If an API key hits rate limit (429 error) or fails, the system automatically rotates to the next available key
2. **Failure Tracking**: Each API key's failure count is tracked
3. **Cooldown Period**: Failed keys enter a 1-minute cooldown before being retried
4. **Intelligent Rotation**: The system prioritizes keys with fewer failures
5. **Transparent to Callers**: Applications don't need to handle API key rotation logic

### Architecture

The system consists of:

- **[apiKeyManager.js](./source/config/apiKeyManager.js)** - Core manager handling key rotation and fallback
- **Updated Services**:
  - `aiInterviewTranscriber.js` - Audio transcription with fallback
  - `aiInterviewMentor.js` - Mentor AI with fallback
  - `aiResumeParser.js` - Resume parsing with fallback
  - `aiInterviewEvaluator.js` - Answer evaluation with fallback
  - `aiInterviewQuestionGenerator.js` - Question generation with fallback

## Configuration

### Setup Your API Keys

Add multiple API keys to your `.env` file:

```env
# Primary API Key (Required)
GEMINI_API_KEY=your_primary_key_here

# Secondary API Key (Optional but recommended)
GEMINI_API_KEY_2=your_secondary_key_here

# Tertiary API Key (Optional)
GEMINI_API_KEY_3=your_tertiary_key_here

# Quaternary API Key (Optional)
GEMINI_API_KEY_4=your_quaternary_key_here
```

### Important Notes

- Only `GEMINI_API_KEY` is required for the system to work
- Add as many fallback keys as you have available
- Invalid keys (starting with "your\_" placeholder) are automatically skipped
- Keys are tried in priority order (PRIMARY → SECONDARY → TERTIARY → QUATERNARY)

## How The System Responds to Errors

### Rate Limit (429 Error)

```
API Call #1 → Rate limit hit
  ↓
[Log: ❌ [RATE_LIMIT] Key PRIMARY failed]
  ↓
API Call #2 → Rotates to SECONDARY key
  ↓
[Log: 🔀 Rotating from PRIMARY to SECONDARY]
  ↓
✅ Request succeeds
```

### Other Errors

```
API Call #1 → Connection timeout
  ↓
[Log: ❌ [ERROR] Key PRIMARY failed]
  ↓
[PRIMARY enters 1-minute cooldown]
  ↓
API Call #2 → Rotates to SECONDARY
  ↓
✅ Request succeeds or tries next key
```

### All Keys Fail

```
If all API keys fail after trying them all:
- Error is logged with details
- Exception is thrown to calling code
- Calling code can handle gracefully or show fallback UI
```

## Usage in Your Code

### Before (Without Fallback)

```javascript
const { GoogleGenAI } = require("@google/genai");

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  return new GoogleGenAI({ apiKey });
};

const generateContent = async (prompt) => {
  const ai = getAiClient();
  return await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
};
```

**Problem**: Single API key = single point of failure

### After (With Fallback)

```javascript
const { getApiKeyManager } = require("../config/apiKeyManager");

const generateContent = async (prompt) => {
  const manager = getApiKeyManager();

  try {
    return await manager.executeWithFallback(async (ai) => {
      return await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
    });
  } catch (error) {
    console.error("All API keys failed:", error);
    throw error;
  }
};
```

**Benefits**:

- Automatic retry with different keys
- Transparent to calling code
- Detailed logging of failures
- Cooldown management

## Monitoring & Debugging

### View API Key Status

```javascript
const { getApiKeyManager } = require("../config/apiKeyManager");

const manager = getApiKeyManager();
const status = manager.getStatus();

console.log(status);
// Output:
// [
//   { name: "PRIMARY", priority: 1, failures: 0, inCooldown: false },
//   { name: "SECONDARY", priority: 2, failures: 2, inCooldown: true },
//   { name: "TERTIARY", priority: 3, failures: 0, inCooldown: false }
// ]
```

### Console Logs

The system provides detailed logging:

```
📡 Attempt 1 with PRIMARY
❌ [RATE_LIMIT] Key PRIMARY failed (1 times). Error: 429 Too Many Requests
🔀 Rotating from PRIMARY to SECONDARY. Available keys: 3
⏳ Retrying with next API key...
📡 Attempt 2 with SECONDARY
✅ [SUCCESS] Response generated with SECONDARY
```

### Reset Failure Counters (Periodic)

If you want to reset failure counters periodically (e.g., every hour):

```javascript
const { getApiKeyManager } = require("../config/apiKeyManager");

// Reset every 60 minutes
setInterval(
  () => {
    const manager = getApiKeyManager();
    manager.resetFailureCounters();
    console.log("API key failure counters reset");
  },
  60 * 60 * 1000,
);
```

## Error Handling

### Handling Exceptions

```javascript
try {
  const response = await manager.executeWithFallback(async (ai) => {
    return await ai.models.generateContent({...});
  });
} catch (error) {
  // This error means ALL keys failed
  if (error.message.includes("All API key(s) failed")) {
    // Show user a message or return cached/fallback data
    console.error("All API keys exhausted, using fallback");
    return getFallbackResponse();
  }
  throw error;
}
```

## Best Practices

1. **Add Multiple Keys**: Add at least 2-3 API keys to provide redundancy
2. **Monitor Quotas**: Keep track of each API key's usage quota in your dashboard
3. **Periodic Resets**: Reset failure counters periodically (daily/weekly) to allow failed keys to recover
4. **Log Analysis**: Monitor logs for patterns of specific keys failing
5. **Update Keys**: If a key consistently fails after cooldown, consider replacing it
6. **Test Failover**: Periodically test by temporarily disabling the primary key to verify failover works

## Configuration Details

### Failure Tracking

- **Failure Count**: Incremented each time a key fails
- **Cooldown Duration**: 1 minute (60000 ms) - adjustable in `apiKeyManager.js`
- **Max Retries**: Defaults to number of available keys

### Priority System

Keys are prioritized by:

1. How long ago they failed (failed keys wait longer)
2. Number of failures (fewer failures = higher priority)
3. Availability (keys in cooldown are skipped)

## Customization

Edit `apiKeyManager.js` to customize:

```javascript
// Line ~10: Adjust cooldown duration (in ms)
this.keyRetryDelay = 60000; // Change to 30000 for 30 seconds

// Line ~11: Adjust max failures before rotation
this.maxFailuresBefore Rotation = 3; // Change threshold

// Line ~66-69: Add more API key environment variables
const fifthKey = (process.env.GEMINI_API_KEY_5 || "").trim();
if (fifthKey && !fifthKey.toLowerCase().startsWith("your_")) {
  keys.push({ key: fifthKey, priority: 5, name: "FIFTH" });
}
```

## Troubleshooting

### Issue: All keys showing failures

**Causes**:

- All API keys have exceeded quota
- API service is down
- Network connectivity issue

**Solution**:

- Check API service status
- Verify network connectivity
- Check API quotas
- Add new API keys
- Check `.env` file syntax

### Issue: Same key used repeatedly despite failures

**Cause**: All other keys in cooldown or unavailable

**Solution**:

- Wait for cooldown to expire (1 minute)
- Reset failure counters if available
- Add more API keys
- Check which keys are configured

### Issue: Not seeing fallback logs

**Cause**: Logger level may be too high

**Solution**:

- Check your logging configuration
- Ensure `console.error` and `console.log` are enabled
- Add explicit logging to your code

## Performance Impact

- **Memory**: Minimal - only tracks key metadata
- **CPU**: Negligible - simple round-robin logic
- **Network**: No additional requests (only uses keys as needed)
- **Latency**: Adds ~500ms delay between retries (configurable)

## Migration Guide

### If updating existing code:

1. **Add imports**:

   ```javascript
   const { getApiKeyManager } = require("../config/apiKeyManager");
   ```

2. **Replace API client creation**:

   ```javascript
   // OLD
   const ai = new GoogleGenAI({ apiKey });

   // NEW
   const manager = getApiKeyManager();
   return manager.executeWithFallback(async (ai) => {
     // Use ai here
   });
   ```

3. **Update .env**:

   ```bash
   # Add fallback keys
   GEMINI_API_KEY_2=your_secondary_key
   GEMINI_API_KEY_3=your_tertiary_key
   ```

4. **Test**: Verify that all services still work
5. **Monitor**: Watch logs for rate limit rotations

## Support

For issues or questions:

1. Check the console logs for detailed error messages
2. Verify .env configuration
3. Check API key quotas
4. Review this guide's troubleshooting section

---

**Implementation Date**: May 8, 2026  
**System**: Hackathon Backend - AI Interview Platform  
**API Provider**: Google Gemini (gemini-2.5-flash)
