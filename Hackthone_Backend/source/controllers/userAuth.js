const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const { OAuth2Client } = require("google-auth-library");

const User = require("../Models/User");
const validate = require("../utils/validator");
const redisClient = require("../config/redis");

const AUTH_TOKEN_TTL_SECONDS = 3600;
const PASSWORD_RESET_TTL_MINUTES = Math.max(
  5,
  Number(process.env.PASSWORD_RESET_TTL_MINUTES) || 15,
);
const FRONTEND_ORIGINS = (
  process.env.FRONTEND_URL || "http://localhost:5177,http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const GOOGLE_CLIENT_ID = normalizeField(process.env.GOOGLE_CLIENT_ID);
const googleClient =
  GOOGLE_CLIENT_ID && !/^your_/i.test(GOOGLE_CLIENT_ID)
    ? new OAuth2Client(GOOGLE_CLIENT_ID)
    : null;

function normalizeField(value) {
  return typeof value === "string" ? value.trim() : "";
}

function buildAuthToken(user) {
  const resolvedRole = user.role || "user";

  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
      role: resolvedRole,
    },
    process.env.JWT_KEY,
    { expiresIn: AUTH_TOKEN_TTL_SECONDS },
  );
}

function setAuthCookie(res, token) {
  res.cookie("token", token, { maxAge: AUTH_TOKEN_TTL_SECONDS * 1000 });
}

function sendAuthResponse(res, user, message, statusCode = 200) {
  const resolvedRole = user.role || "user";
  const token = buildAuthToken(user);

  setAuthCookie(res, token);

  return res.status(statusCode).json({
    message,
    token,
    role: resolvedRole,
  });
}

function createAuthPayload(user, message) {
  const resolvedRole = user.role || "user";
  const token = buildAuthToken(user);

  return {
    message,
    token,
    role: resolvedRole,
  };
}

function getPrimaryFrontendUrl() {
  return FRONTEND_ORIGINS[0] || "http://localhost:5177";
}

function resolveFrontendBaseUrl(req) {
  const explicitOrigin = normalizeField(req?.headers?.origin);

  if (explicitOrigin) {
    return explicitOrigin.replace(/\/$/, "");
  }

  const forwardedProto = normalizeField(req?.headers?.["x-forwarded-proto"]);
  const forwardedHost = normalizeField(req?.headers?.["x-forwarded-host"]);
  const host = forwardedHost || normalizeField(req?.headers?.host);

  if (host) {
    const protocol = forwardedProto || "https";
    return `${protocol}://${host}`.replace(/\/$/, "");
  }

  return getPrimaryFrontendUrl().replace(/\/$/, "");
}

function buildFrontendHashUrl(req, pathWithQuery = "/login") {
  const frontendBase = resolveFrontendBaseUrl(req);
  const normalizedPath = pathWithQuery.startsWith("/")
    ? pathWithQuery
    : `/${pathWithQuery}`;

  return `${frontendBase}/#${normalizedPath}`;
}

function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getResetTokenKey(tokenHash) {
  return `password-reset:${tokenHash}`;
}

function getResetTokenIndexKey(userId) {
  return `password-reset-user:${userId}`;
}

async function createPasswordResetSession(user, req) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(rawToken);
  const tokenKey = getResetTokenKey(tokenHash);
  const userIndexKey = getResetTokenIndexKey(user._id.toString());
  const previousTokenHash = await redisClient.get(userIndexKey);

  if (previousTokenHash) {
    await redisClient.del(getResetTokenKey(previousTokenHash));
  }

  await redisClient.setEx(
    tokenKey,
    PASSWORD_RESET_TTL_MINUTES * 60,
    JSON.stringify({ userId: user._id.toString() }),
  );
  await redisClient.setEx(
    userIndexKey,
    PASSWORD_RESET_TTL_MINUTES * 60,
    tokenHash,
  );

  return {
    resetToken: rawToken,
    resetUrl: `${resolveFrontendBaseUrl(req)}/#/verification?token=${encodeURIComponent(rawToken)}`,
    expiresInMinutes: PASSWORD_RESET_TTL_MINUTES,
  };
}

async function verifyGoogleCredential(credential) {
  if (!googleClient) {
    throw new Error("Google sign-in is not configured on the server.");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();

  if (!payload || !payload.sub || !payload.email) {
    throw new Error("Invalid Google account payload.");
  }

  if (!payload.email_verified) {
    throw new Error("Google account email is not verified.");
  }

  return payload;
}

function buildGoogleUserProfile(payload) {
  const email = normalizeField(payload.email).toLowerCase();
  const fallbackName = email.includes("@") ? email.split("@")[0] : "Google User";
  const firstName =
    normalizeField(payload.given_name) ||
    normalizeField(payload.name) ||
    fallbackName;
  const lastName = normalizeField(payload.family_name);

  return {
    googleId: payload.sub,
    firstName,
    lastName,
    email,
    authProvider: "google",
    avatarUrl: normalizeField(payload.picture),
    role: "user",
  };
}

function sanitizeUserPreferences(input = {}) {
  const rawPreferences =
    input && typeof input === "object" ? input : {};
  const preferredInterviewMode = normalizeField(
    rawPreferences.preferredInterviewMode,
  ).toLowerCase();
  const allowedModes = ["text", "hybrid", "voice"];

  return {
    defaultRoleFilter:
      normalizeField(rawPreferences.defaultRoleFilter) || "All Roles",
    preferredInterviewMode: allowedModes.includes(preferredInterviewMode)
      ? preferredInterviewMode
      : "hybrid",
    emailReminders: Boolean(rawPreferences.emailReminders),
    weeklyDigest: Boolean(rawPreferences.weeklyDigest),
    productTips: Boolean(rawPreferences.productTips),
  };
}

function buildUserResponse(user) {
  return {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role || "user",
    avatarUrl: user.avatarUrl || "",
    authProvider: user.authProvider || "local",
    preferences: sanitizeUserPreferences(user.preferences || {}),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function resolveGoogleUserFromCredential(credential) {
  const payload = await verifyGoogleCredential(credential);
  const profile = buildGoogleUserProfile(payload);

  let user = await User.findOne({
    $or: [{ googleId: profile.googleId }, { email: profile.email }],
  });

  if (!user) {
    user = await User.create(profile);
    return user;
  }

  let shouldSave = false;

  if (!user.googleId) {
    user.googleId = profile.googleId;
    shouldSave = true;
  }

  if (!user.firstName && profile.firstName) {
    user.firstName = profile.firstName;
    shouldSave = true;
  }

  if (!user.lastName && profile.lastName) {
    user.lastName = profile.lastName;
    shouldSave = true;
  }

  if (profile.avatarUrl && user.avatarUrl !== profile.avatarUrl) {
    user.avatarUrl = profile.avatarUrl;
    shouldSave = true;
  }

  if (!user.authProvider || user.authProvider === "local") {
    user.authProvider = user.password ? "local" : "google";
    shouldSave = true;
  }

  if (shouldSave) {
    await user.save();
  }

  return user;
}

const register = async (req, res) => {
  try {
    req.body = {
      ...req.body,
      firstName: normalizeField(req.body?.firstName),
      lastName: normalizeField(req.body?.lastName),
      email: normalizeField(req.body?.email).toLowerCase(),
      password: normalizeField(req.body?.password),
    };

    validate(req.body);

    req.body.password = await bcrypt.hash(req.body.password, 10);
    req.body.role = "user";
    req.body.authProvider = "local";

    const user = await User.create(req.body);

    return sendAuthResponse(res, user, "User registered successfully", 201);
  } catch (err) {
    return res.status(400).json({
      message: err.message || "Registration failed",
    });
  }
};

const login = async (req, res) => {
  try {
    const email = normalizeField(req.body?.email).toLowerCase();
    const password = normalizeField(req.body?.password);

    if (!email) {
      return res.status(400).json({
        message: "email is required.",
      });
    }

    if (!password) {
      return res.status(400).json({
        message: "password is required.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    if (!user.password) {
      throw new Error("Use Google sign-in for this account.");
    }

    const verifyUser = await bcrypt.compare(password, user.password);

    if (!verifyUser) {
      throw new Error("Invalid credentials");
    }

    return sendAuthResponse(res, user, "Logged in successfully");
  } catch (err) {
    return res.status(401).json({
      message: err.message || "login error",
    });
  }
};

const googleLogin = async (req, res) => {
  try {
    const credential = normalizeField(req.body?.credential);

    if (!credential) {
      return res.status(400).json({
        message: "Google credential is required.",
      });
    }

    const user = await resolveGoogleUserFromCredential(credential);
    return sendAuthResponse(res, user, "Google sign-in successful");
  } catch (err) {
    return res.status(401).json({
      message: err.message || "Google sign-in failed",
    });
  }
};

const googleRedirectLogin = async (req, res) => {
  try {
    const credential = normalizeField(req.body?.credential);

    if (!credential) {
      const redirectUrl = buildFrontendHashUrl(
        req,
        `/login?googleError=${encodeURIComponent("Google credential is required.")}`,
      );
      return res.redirect(302, redirectUrl);
    }

    const user = await resolveGoogleUserFromCredential(credential);
    const authPayload = createAuthPayload(user, "Google sign-in successful");

    setAuthCookie(res, authPayload.token);

    const redirectUrl = buildFrontendHashUrl(
      req,
      `/login?googleToken=${encodeURIComponent(authPayload.token)}`,
    );
    return res.redirect(302, redirectUrl);
  } catch (err) {
    const redirectUrl = buildFrontendHashUrl(
      req,
      `/login?googleError=${encodeURIComponent(err.message || "Google sign-in failed")}`,
    );
    return res.redirect(302, redirectUrl);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const email = normalizeField(req.body?.email).toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: "email is required.",
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        message: "invalid email",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        message:
          "If an account exists for this email, a password reset link has been generated.",
      });
    }

    const resetSession = await createPasswordResetSession(user, req);
    const responseBody = {
      message: "Password reset link generated successfully.",
      expiresInMinutes: resetSession.expiresInMinutes,
    };

    if (process.env.NODE_ENV !== "production") {
      responseBody.resetToken = resetSession.resetToken;
      responseBody.resetUrl = resetSession.resetUrl;
    }

    return res.status(200).json(responseBody);
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Unable to start password reset.",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const token = normalizeField(req.body?.token);
    const password = normalizeField(req.body?.password);

    if (!token) {
      return res.status(400).json({
        message: "reset token is required.",
      });
    }

    if (!password) {
      return res.status(400).json({
        message: "password is required.",
      });
    }

    if (!validator.isStrongPassword(password)) {
      return res.status(400).json({
        message: "week password",
      });
    }

    const tokenHash = hashResetToken(token);
    const tokenKey = getResetTokenKey(tokenHash);
    const resetPayload = await redisClient.get(tokenKey);

    if (!resetPayload) {
      return res.status(400).json({
        message: "Reset token is invalid or expired.",
      });
    }

    const parsedPayload = JSON.parse(resetPayload);
    const user = await User.findById(parsedPayload.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    user.password = await bcrypt.hash(password, 10);

    if (!user.authProvider || !user.googleId) {
      user.authProvider = "local";
    }

    await user.save();
    await redisClient.del(tokenKey);
    await redisClient.del(getResetTokenIndexKey(user._id.toString()));

    return res.status(200).json({
      message: "Password reset successful.",
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Password reset failed.",
    });
  }
};

const adminLogin = async (req, res) => {
  try {
    const email = normalizeField(req.body?.email).toLowerCase();
    const password = normalizeField(req.body?.password);

    if (!email) {
      return res.status(400).json({
        message: "email is required.",
      });
    }

    if (!password) {
      return res.status(400).json({
        message: "password is required.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    if (!user.password) {
      throw new Error("Use Google sign-in for this account.");
    }

    const verifyUser = await bcrypt.compare(password, user.password);

    if (!verifyUser) {
      throw new Error("Invalid credentials");
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        message: "admin access required",
      });
    }

    return sendAuthResponse(res, user, "Admin logged in successfully");
  } catch (err) {
    return res.status(401).json({
      message: err.message || "login error",
    });
  }
};

const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      const cookies = req.cookies || {};
      token = cookies.token;
    }

    if (!token) {
      return res.status(400).json({
        message: "token missing",
      });
    }

    const payload = jwt.decode(token);

    if (!payload || !payload.exp) {
      return res.status(400).json({
        message: "invalid token",
      });
    }

    await redisClient.set(`token:${token}`, "blocked");
    await redisClient.expireAt(`token:${token}`, payload.exp);

    res.cookie("token", "", { expires: new Date(0), httpOnly: true });
    return res.status(200).json({
      message: "logout successful",
    });
  } catch (err) {
    return res.status(401).json({
      message: err.message || "logout error",
    });
  }
};

const adminRegister = async (req, res) => {
  try {
    req.body = {
      ...req.body,
      firstName: normalizeField(req.body?.firstName),
      lastName: normalizeField(req.body?.lastName),
      email: normalizeField(req.body?.email).toLowerCase(),
      password: normalizeField(req.body?.password),
    };

    validate(req.body);

    req.body.password = await bcrypt.hash(req.body.password, 10);
    req.body.role = "admin";
    req.body.authProvider = "local";

    const user = await User.create(req.body);

    return sendAuthResponse(res, user, "Admin registered successfully", 201);
  } catch (err) {
    return res.status(400).json({
      message: err.message || "Registration failed",
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = req.result;

    return res.status(200).json({
      message: "user profile fetched successfully",
      user: buildUserResponse(user),
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "error fetching user profile",
    });
  }
};

const updateMe = async (req, res) => {
  try {
    const user = req.result;
    const firstName = normalizeField(req.body?.firstName);
    const lastName = normalizeField(req.body?.lastName);
    const avatarUrl = normalizeField(req.body?.avatarUrl);
    const hasPreferencesField = Object.prototype.hasOwnProperty.call(
      req.body || {},
      "preferences",
    );

    if (!firstName) {
      return res.status(400).json({
        message: "firstName is required.",
      });
    }

    if (firstName.length < 2) {
      return res.status(400).json({
        message: "firstName must be at least 2 characters long.",
      });
    }

    if (lastName && lastName.length < 2) {
      return res.status(400).json({
        message: "lastName must be at least 2 characters long.",
      });
    }

    if (avatarUrl && !validator.isURL(avatarUrl, { require_protocol: true })) {
      return res.status(400).json({
        message: "avatarUrl must be a valid absolute URL.",
      });
    }

    user.firstName = firstName;
    user.lastName = lastName;
    user.avatarUrl = avatarUrl;

    if (hasPreferencesField) {
      user.preferences = sanitizeUserPreferences(req.body.preferences);
    }

    await user.save();

    return res.status(200).json({
      message: "user settings updated successfully",
      user: buildUserResponse(user),
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "error updating user profile",
    });
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  googleRedirectLogin,
  forgotPassword,
  resetPassword,
  adminLogin,
  logout,
  adminRegister,
  getMe,
  updateMe,
};
