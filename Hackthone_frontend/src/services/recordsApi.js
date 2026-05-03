import {
  API_BASE_URL,
  expireAuthSession,
  getStoredAuthSession,
} from "./authApi";

function buildUrl(pathname, query = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, value);
    }
  });

  const queryString = searchParams.toString();
  return `${API_BASE_URL}${pathname}${queryString ? `?${queryString}` : ""}`;
}

async function parseResponsePayload(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : {};
}

async function requestRecordsApi(pathname, options = {}) {
  const { method = "GET", query = {} } = options;
  const session = getStoredAuthSession();
  const headers = {
    Accept: "application/json",
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
  };

  const response = await fetch(buildUrl(pathname, query), {
    method,
    headers,
    credentials: "include",
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

export async function fetchInterviewRecords(query = {}) {
  return requestRecordsApi("/api/records/interviews", { query });
}

export async function fetchCandidateDirectory(query = {}) {
  return requestRecordsApi("/api/records/candidates", { query });
}

export async function fetchLeaderboard(query = {}) {
  return requestRecordsApi("/api/records/leaderboard", { query });
}

export async function fetchAnalyticsSummary(query = {}) {
  return requestRecordsApi("/api/records/analytics", { query });
}
