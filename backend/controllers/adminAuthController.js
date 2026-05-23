import ApiError from "../utils/ApiError.js";
import { Admin, User } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { checkAccountLocked, maxFailedLoginAttempts, recordFailedLogin, resetFailedLogin, throwLockedAccount } from "../utils/loginSecurity.js";
import { clearRefreshTokenCookie, generateTokens, setRefreshTokenCookie } from "../utils/generateTokens.js";
import { logAudit, logSecurityEvent } from "../utils/securityLogger.js";

function cleanString(value) {
  return String(value || "").trim();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function logFailedAdminLogin({ admin = null, email, reason, request, severity = "medium" }) {
  await logAudit({
    action: "admin.login_failed",
    actorEmail: email,
    actorId: admin?.id || null,
    actorType: "admin",
    description: `Admin login failed: ${reason}`,
    details: {
      adminId: admin?.id || null,
      reason,
    },
    module: "authentication",
    request,
  });

  await logSecurityEvent({
    details: {
      adminId: admin?.id || null,
      reason,
    },
    email,
    eventType: "admin.login_failed",
    request,
    severity,
  });
}

async function logAdminAccountLocked(admin, request) {
  const details = {
    adminId: admin.id,
    failedLoginAttempts: admin.failedLoginAttempts,
    lockUntil: admin.lockUntil,
    maxFailedLoginAttempts,
  };

  await logAudit({
    action: "admin.account_locked",
    actorEmail: admin.email,
    actorId: admin.id,
    actorType: "admin",
    description: "Admin account locked after too many failed login attempts.",
    details,
    module: "authentication",
    request,
  });

  await logSecurityEvent({
    details,
    email: admin.email,
    eventType: "admin.account_locked",
    request,
    severity: "high",
  });
}

export const login = asyncHandler(async (request, response) => {
  const email = cleanString(request.body.email).toLowerCase();
  const password = String(request.body.password || "");

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required.");
  }

  if (!validateEmail(email)) {
    throw new ApiError(400, "Please enter a valid email address.");
  }

  const admin = await Admin.scope("withPassword").findOne({ where: { email } });

  if (!admin) {
    await logFailedAdminLogin({ email, reason: "unknown_admin", request });
    throw new ApiError(401, "Invalid admin credentials.");
  }

  const lockState = await checkAccountLocked(admin);
  if (lockState.locked) {
    await logFailedAdminLogin({ admin, email, reason: "admin_locked", request, severity: "high" });
    throwLockedAccount(lockState);
  }

  if (!admin.isActive) {
    await logFailedAdminLogin({ admin, email, reason: "inactive_admin", request, severity: "high" });
    throw new ApiError(403, "This admin account is inactive.");
  }

  const passwordMatches = await admin.comparePassword(password);

  if (!passwordMatches) {
    const failedLogin = await recordFailedLogin(admin);
    await logFailedAdminLogin({
      admin,
      email,
      reason: failedLogin.locked ? "invalid_password_account_locked" : "invalid_password",
      request,
      severity: failedLogin.locked ? "high" : "medium",
    });

    if (failedLogin.locked) {
      await logAdminAccountLocked(admin, request);
      throw new ApiError(423, failedLogin.message);
    }

    throw new ApiError(401, failedLogin.message);
  }

  const loginAt = new Date();
  admin.lastLogin = loginAt;
  await admin.save({ fields: ["lastLogin"] });
  await resetFailedLogin(admin);

  const matchingWebsiteUser = await User.scope("withPassword").findOne({ where: { email: admin.email } });
  if (matchingWebsiteUser) {
    matchingWebsiteUser.fullName = admin.name || matchingWebsiteUser.fullName;
    matchingWebsiteUser.isActive = Boolean(admin.isActive);
    matchingWebsiteUser.lastLogin = loginAt;
    matchingWebsiteUser.password = admin.password;

    if (admin.role === "admin" || admin.role === "editor" || admin.role === "super_admin") {
      matchingWebsiteUser.role = admin.role === "editor" ? "editor" : "admin";
    }

    await matchingWebsiteUser.save({ fields: ["fullName", "isActive", "lastLogin", "password", "role"] });
  } else {
    await User.create({
      email: admin.email,
      fullName: admin.name || "Parish Administrator",
      isActive: Boolean(admin.isActive),
      lastLogin: loginAt,
      password: admin.password,
      role: admin.role === "editor" ? "editor" : "admin",
    });
  }

  const { accessToken, refreshToken } = generateTokens(admin, "admin");
  setRefreshTokenCookie(response, refreshToken, "admin");

  const details = { adminId: admin.id, role: admin.role };
  await logAudit({
    action: "admin.login_success",
    actorEmail: admin.email,
    actorId: admin.id,
    actorType: "admin",
    description: "Admin logged in successfully.",
    details,
    module: "authentication",
    request,
  });
  await logSecurityEvent({
    details,
    email: admin.email,
    eventType: "admin.login_success",
    request,
    severity: "low",
  });

  response.json({
    accessToken,
    admin: admin.toJSON(),
    message: "Admin logged in successfully.",
    success: true,
    token: accessToken,
  });
});

export const me = asyncHandler(async (request, response) => {
  response.json({
    admin: request.admin.toJSON(),
    success: true,
  });
});

export const logout = asyncHandler(async (request, response) => {
  clearRefreshTokenCookie(response, "admin");

  await logAudit({
    action: "admin.logout",
    actorEmail: request.admin?.email,
    actorId: request.admin?.id,
    actorType: "admin",
    description: "Admin logged out.",
    module: "authentication",
    request,
  });

  response.json({ message: "Admin logged out successfully.", success: true });
});

export const loginAdmin = login;
export const logoutAdmin = logout;
export const getAdminMe = me;
