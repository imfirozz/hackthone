function resolveApiBaseUrl() {
  const envValue = (process.env.PARCEL_PUBLIC_API_URL || "").trim();

  if (typeof window === "undefined") {
    return envValue || "http://localhost:3000";
  }

  const currentHost = window.location.hostname;
  const currentOrigin = window.location.origin;
  const isPublicOrigin = !["localhost", "127.0.0.1"].includes(currentHost);
  const envTargetsLocalApi = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(
    envValue,
  );

  if (envValue) {
    if (isPublicOrigin && envTargetsLocalApi) {
      return currentOrigin;
    }

    return envValue;
  }

  const isLocalFrontendDev =
    ["localhost", "127.0.0.1"].includes(currentHost) &&
    ["5177", "5173", "1234"].includes(window.location.port);

  if (isLocalFrontendDev) {
    return "http://localhost:3000";
  }

  return currentOrigin;
}

const API_BASE_URL = resolveApiBaseUrl();
const GOOGLE_CLIENT_ID =
  (process.env.PARCEL_PUBLIC_GOOGLE_CLIENT_ID || "").trim();

const AUTH_STORAGE_KEY = "aix_auth_session";
export const AUTH_EXPIRED_EVENT = "aix:auth-expired";
export const AUTH_SESSION_UPDATED_EVENT = "aix:auth-session-updated";

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

async function requestJson(pathname, options = {}) {
  const { method = "GET", body, token } = options;
  const headers = {
    Accept: "application/json",
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(buildUrl(pathname), {
    method,
    headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    if (response.status === 401 && token) {
      expireAuthSession();
      throw new Error("Session expired. Please sign in again.");
    }

    throw new Error(payload?.message || "Request failed");
  }

  return payload;
}

function splitFullName(fullName = "") {
  const nameParts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ");

  return { firstName, lastName };
}

export function storeAuthSession(session) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(AUTH_SESSION_UPDATED_EVENT));
}

export function getStoredAuthSession() {
  try {
    const rawValue = localStorage.getItem(AUTH_STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_SESSION_UPDATED_EVENT));
}

export function expireAuthSession() {
  clearAuthSession();
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}

function buildDisplayName(user = {}) {
  const explicitName =
    typeof user.name === "string" ? user.name.trim() : "";
  const nameFromParts = [user.firstName, user.lastName]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean)
    .join(" ")
    .trim();
  const emailName =
    typeof user.email === "string" && user.email.includes("@")
      ? user.email.split("@")[0].trim()
      : "";

  return explicitName || nameFromParts || emailName || "User";
}

function normalizePreferences(preferences = {}) {
  return {
    defaultRoleFilter:
      typeof preferences.defaultRoleFilter === "string" &&
      preferences.defaultRoleFilter.trim()
        ? preferences.defaultRoleFilter.trim()
        : "All Roles",
    preferredInterviewMode:
      typeof preferences.preferredInterviewMode === "string" &&
      ["text", "hybrid", "voice"].includes(
        preferences.preferredInterviewMode.trim().toLowerCase(),
      )
        ? preferences.preferredInterviewMode.trim().toLowerCase()
        : "hybrid",
    emailReminders: Boolean(preferences.emailReminders),
    weeklyDigest: Boolean(preferences.weeklyDigest),
    productTips: Boolean(preferences.productTips),
  };
}

function buildInitials(displayName = "") {
  const parts = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  const compact = parts[0] || "U";
  return compact.slice(0, 2).toUpperCase();
}

function formatRoleLabel(role = "user") {
  return role
    .toString()
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getAuthIdentity(session = getStoredAuthSession()) {
  if (!session || (!session.user && !session.token)) {
    return null;
  }

  const user = session.user || {};
  const displayName = buildDisplayName(user);

  return {
    displayName,
    initials: buildInitials(displayName),
    roleLabel: formatRoleLabel(session.role || user.role || "user"),
    email: typeof user.email === "string" ? user.email.trim() : "",
  };
}

export async function fetchCurrentUser(token) {
  const response = await requestJson("/me", {
    token,
  });

  return response.user;
}

function updateStoredSessionUser(user) {
  const existingSession = getStoredAuthSession();

  if (!existingSession?.token) {
    return null;
  }

  const nextSession = {
    ...existingSession,
    role: existingSession.role || user?.role || "user",
    user,
  };

  storeAuthSession(nextSession);
  return nextSession;
}

async function createSession(authResponse) {
  const token = authResponse?.token || "";

  if (!token) {
    throw new Error("Authentication token missing from server response.");
  }

  const user = await fetchCurrentUser(token);
  const session = {
    token,
    role: authResponse.role || user?.role || "user",
    user,
  };

  storeAuthSession(session);
  return session;
}

export async function loginUser(credentials) {
  const authResponse = await requestJson("/login", {
    method: "POST",
    body: credentials,
  });

  return createSession(authResponse);
}

export async function loginWithGoogle(credential) {
  const authResponse = await requestJson("/login/google", {
    method: "POST",
    body: { credential },
  });

  return createSession(authResponse);
}

export async function registerUser(registrationForm) {
  const { firstName, lastName } = splitFullName(registrationForm.fullName);
  const payload = {
    firstName,
    email: registrationForm.email.trim(),
    password: registrationForm.password,
  };

  if (lastName) {
    payload.lastName = lastName;
  }

  const authResponse = await requestJson("/register", {
    method: "POST",
    body: payload,
  });

  return createSession(authResponse);
}

export async function requestPasswordReset(email) {
  return requestJson("/forgot-password", {
    method: "POST",
    body: {
      email: typeof email === "string" ? email.trim() : "",
    },
  });
}

export async function resetPassword({ token, password }) {
  return requestJson("/reset-password", {
    method: "POST",
    body: {
      token: typeof token === "string" ? token.trim() : "",
      password,
    },
  });
}

export async function logoutUser() {
  const session = getStoredAuthSession();
  try {
    await requestJson("/logout", {
      method: "POST",
      token: session?.token,
    });
  } finally {
    clearAuthSession();
  }
}

export async function updateCurrentUserProfile(payload) {
  const session = getStoredAuthSession();

  if (!session?.token) {
    throw new Error("You need to sign in again.");
  }

  const response = await requestJson("/me", {
    method: "PUT",
    token: session.token,
    body: {
      firstName: typeof payload.firstName === "string" ? payload.firstName.trim() : "",
      lastName: typeof payload.lastName === "string" ? payload.lastName.trim() : "",
      avatarUrl: typeof payload.avatarUrl === "string" ? payload.avatarUrl.trim() : "",
      preferences: normalizePreferences(payload.preferences || {}),
    },
  });

  updateStoredSessionUser(response.user);
  return response.user;
}

export function getDefaultUserPreferences(user = {}) {
  return normalizePreferences(user.preferences || {});
}

export { API_BASE_URL, GOOGLE_CLIENT_ID };
