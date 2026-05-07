import {
  API_BASE_URL,
  expireAuthSession,
  getStoredAuthSession,
} from "./authApi";

function buildUrl(pathname) {
  return `${API_BASE_URL}${pathname}`;
}

async function parseResponsePayload(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : {};
}

async function requestInterviewApi(pathname, options = {}) {
  const {
    method = "GET",
    body,
    isFormData = false,
  } = options;
  const session = getStoredAuthSession();
  const headers = {
    Accept: "application/json",
    ...(isFormData ? {} : body ? { "Content-Type": "application/json" } : {}),
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
  };

  const response = await fetch(buildUrl(pathname), {
    method,
    headers,
    credentials: "include",
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });
  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    if (response.status === 401 && session?.token) {
      expireAuthSession();
      throw new Error("Session expired. Please sign in again.");
    }

    throw new Error(payload?.message || "Request failed");
  }

  return payload;
}

export async function uploadResumeFile(file) {
  const formData = new FormData();
  formData.append("resume", file);

  return requestInterviewApi("/api/resume/upload", {
    method: "POST",
    body: formData,
    isFormData: true,
  });
}

export async function fetchNextInterviewQuestion(payload) {
  return requestInterviewApi("/api/interview/next-question", {
    method: "POST",
    body: payload,
  });
}

export async function submitInterviewAnswer(payload) {
  return requestInterviewApi("/api/interview/submit-answer", {
    method: "POST",
    body: payload,
  });
}

export async function transcribeInterviewAudio(audioFile) {
  const formData = new FormData();
  formData.append("audio", audioFile);

  return requestInterviewApi("/api/interview/transcribe-audio", {
    method: "POST",
    body: formData,
    isFormData: true,
  });
}

export async function requestInterviewMentor(payload) {
  return requestInterviewApi("/api/interview/mentor", {
    method: "POST",
    body: payload,
  });
}
