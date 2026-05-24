import ApiError from "../utils/ApiError.js";
import { SiteSetting, User } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  checkAccountLocked,
  logFailedLoginAttempt,
  maxFailedLoginAttempts,
  recordFailedLogin,
  resetFailedLogin,
  throwLockedAccount,
} from "../utils/loginSecurity.js";
import { clearRefreshTokenCookie, generateTokens, setRefreshTokenCookie } from "../utils/generateToken.js";
import { logAudit, logSecurityEvent } from "../utils/securityLogger.js";

function cleanString(value) {
  return String(value || "").trim();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  const value = String(password || "");
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return "Password must include letters and numbers.";
  return "";
}

async function readSiteSetting() {
  return SiteSetting.findOne({ id: "1" });
}

async function ensureUserLoginAllowed() {
  const setting = await readSiteSetting();
  if (setting && !setting.allowUserLogin) {
    throw new ApiError(403, "User login is temporarily disabled.");
  }
}

async function ensureRegistrationAllowed() {
  const setting = await readSiteSetting();
  if (setting && !setting.allowRegistration) {
    throw new ApiError(403, "Account registration is temporarily disabled.");
  }
}

async function logFailedUserLogin({ email, reason, request, severity = "medium", user = null }) {
  await logFailedLoginAttempt({ email, reason, request, scope: "user" });

  await logAudit({
    action: "user.login_failed",
    actorEmail: email,
    actorId: user?.id || null,
    actorType: "user",
    description: `User login failed: ${reason}`,
    details: {
      reason,
      userId: user?.id || null,
    },
    module: "authentication",
    request,
  });

  await logSecurityEvent({
    details: {
      reason,
      userId: user?.id || null,
    },
    email,
    eventType: "user.login_failed",
    request,
    severity,
  });
}

async function logUserAccountLocked(user, request) {
  const details = {
    failedLoginAttempts: user.failedLoginAttempts,
    lockUntil: user.lockUntil,
    maxFailedLoginAttempts,
    userId: user.id,
  };

  await logAudit({
    action: "user.account_locked",
    actorEmail: user.email,
    actorId: user.id,
    actorType: "user",
    description: "Website user account locked after too many failed login attempts.",
    details,
    module: "authentication",
    request,
  });

  await logSecurityEvent({
    details,
    email: user.email,
    eventType: "user.account_locked",
    request,
    severity: "high",
  });
}

export const register = asyncHandler(async (request, response) => {
  await ensureRegistrationAllowed();

  const fullName = cleanString(request.body.fullName || request.body.name);
  const email = cleanString(request.body.email).toLowerCase();
  const phone = cleanString(request.body.phone) || null;
  const password = String(request.body.password || "");
  const passwordError = validatePassword(password);

  if (!fullName) throw new ApiError(400, "Full name is required.");
  if (!email || !validateEmail(email)) throw new ApiError(400, "Please enter a valid email address.");
  if (passwordError) throw new ApiError(400, passwordError);

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new ApiError(409, "An account with this email already exists.");

  const user = await User.create({ email, fullName, lastLogin: new Date(), password, phone });
  const { accessToken, refreshToken } = generateTokens(user, "user");
  setRefreshTokenCookie(response, refreshToken, "user");

  const details = { userId: user.id };
  await logAudit({
    action: "user.register",
    actorEmail: user.email,
    actorId: user.id,
    actorType: "user",
    description: "Website user account registered.",
    details,
    module: "authentication",
    request,
  });
  await logSecurityEvent({
    details,
    email: user.email,
    eventType: "user.register",
    request,
    severity: "low",
  });

  response.status(201).json({
    accessToken,
    message: "Account created successfully.",
    success: true,
    token: accessToken,
    user: user.toJSON(),
  });
});

export const login = asyncHandler(async (request, response) => {
  await ensureUserLoginAllowed();

  const email = cleanString(request.body.email).toLowerCase();
  const password = String(request.body.password || "");

  if (!email || !password) throw new ApiError(400, "Email and password are required.");
  if (!validateEmail(email)) throw new ApiError(400, "Please enter a valid email address.");

  const user = await User.findOne({ email });
  if (!user) {
    await logFailedUserLogin({ email, reason: "unknown_user", request });
    throw new ApiError(401, "Invalid user credentials.");
  }

  const lockState = await checkAccountLocked(user);
  if (lockState.locked) {
    await logFailedUserLogin({ email, reason: "user_locked", request, severity: "high", user });
    throwLockedAccount(lockState);
  }

  if (!user.isActive) {
    await logFailedUserLogin({ email, reason: "inactive_user", request, severity: "high", user });
    throw new ApiError(403, "This account is inactive.");
  }

  const passwordMatches = await user.comparePassword(password);

  if (!passwordMatches) {
    const failedLogin = await recordFailedLogin(user);
    await logFailedUserLogin({
      email,
      reason: failedLogin.locked ? "invalid_password_account_locked" : "invalid_password",
      request,
      severity: failedLogin.locked ? "high" : "medium",
      user,
    });

    if (failedLogin.locked) {
      await logUserAccountLocked(user, request);
      throw new ApiError(423, failedLogin.message);
    }

    throw new ApiError(401, failedLogin.message);
  }

  user.lastLogin = new Date();
  await user.save();
  await resetFailedLogin(user);

  const { accessToken, refreshToken } = generateTokens(user, "user");
  setRefreshTokenCookie(response, refreshToken, "user");

  const details = { userId: user.id };
  await logAudit({
    action: "user.login_success",
    actorEmail: user.email,
    actorId: user.id,
    actorType: "user",
    description: "Website user logged in successfully.",
    details,
    module: "authentication",
    request,
  });
  await logSecurityEvent({
    details,
    email: user.email,
    eventType: "user.login_success",
    request,
    severity: "low",
  });

  response.json({
    accessToken,
    message: "Logged in successfully.",
    success: true,
    token: accessToken,
    user: user.toJSON(),
  });
});

export const me = asyncHandler(async (request, response) => {
  response.json({
    success: true,
    user: request.user.toJSON(),
  });
});

export const logout = asyncHandler(async (request, response) => {
  clearRefreshTokenCookie(response, "user");

  await logAudit({
    action: "user.logout",
    actorEmail: request.user?.email,
    actorId: request.user?.id,
    actorType: "user",
    description: "Website user logged out.",
    module: "authentication",
    request,
  });

  response.json({ message: "Logged out successfully.", success: true });
});

export const registerUser = register;
export const loginUser = login;
export const getUserProfile = me;
export const logoutUser = logout;
