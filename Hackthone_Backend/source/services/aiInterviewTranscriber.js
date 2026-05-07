const { getApiKeyManager } = require("../config/apiKeyManager");

const GEMINI_MODEL = "gemini-2.5-flash";

const cleanText = (value = "") => String(value).replace(/\s+/g, " ").trim();

const getAiClient = () => {
  const manager = getApiKeyManager();

  if (!manager.apiKeys || manager.apiKeys.length === 0) {
    throw new Error(
      "Voice transcription is not configured on the backend. Add real GEMINI_API_KEY values to .env to enable spoken answers.",
    );
  }

  return manager.getClient();
};

const normalizeTranscript = (value = "") =>
  cleanText(value)
    .replace(/^transcript\s*:\s*/i, "")
    .replace(/^spoken answer\s*:\s*/i, "")
    .trim();

const transcribeInterviewAudio = async ({
  audioBuffer,
  mimeType = "audio/wav",
}) => {
  if (!audioBuffer?.length) {
    throw new Error("Recorded audio is empty.");
  }

  const manager = getApiKeyManager();
  const response = await manager.executeWithFallback(async (ai) => {
    return await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Transcribe this interview answer exactly as spoken. Return only the transcript as plain text. Do not summarize, do not explain, and do not add labels.",
            },
            {
              inlineData: {
                mimeType,
                data: audioBuffer.toString("base64"),
              },
            },
          ],
        },
      ],
    });

    const transcript = normalizeTranscript(response?.text || "");

    if (!transcript) {
      throw new Error("No usable speech was detected in the recording.");
    }

    return transcript;
  });

  return {
    transcript,
    transcriber: "gemini",
  };
};

module.exports = {
  transcribeInterviewAudio,
};
