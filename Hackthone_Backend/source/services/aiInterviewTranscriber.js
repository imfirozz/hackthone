const { GoogleGenAI } = require("@google/genai");

const GEMINI_MODEL = "gemini-2.5-flash";

const cleanText = (value = "") => String(value).replace(/\s+/g, " ").trim();

const getAiClient = () => {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();

  if (!apiKey || apiKey.toLowerCase().startsWith("your_")) {
    throw new Error(
      "Voice transcription is not configured on the backend. Add a real GEMINI_API_KEY to enable spoken answers.",
    );
  }

  return new GoogleGenAI({ apiKey });
};

const normalizeTranscript = (value = "") =>
  cleanText(value)
    .replace(/^transcript\s*:\s*/i, "")
    .replace(/^spoken answer\s*:\s*/i, "")
    .trim();

const transcribeInterviewAudio = async ({ audioBuffer, mimeType = "audio/wav" }) => {
  if (!audioBuffer?.length) {
    throw new Error("Recorded audio is empty.");
  }

  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              "Transcribe this interview answer exactly as spoken. Return only the transcript as plain text. Do not summarize, do not explain, and do not add labels.",
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

  return {
    transcript,
    transcriber: "gemini",
  };
};

module.exports = {
  transcribeInterviewAudio,
};
