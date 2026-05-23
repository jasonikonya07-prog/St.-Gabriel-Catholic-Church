import ApiError from "../utils/ApiError.js";
import { Admin, SiteSetting, User } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resetFailedLogin } from "../utils/loginSecurity.js";
import { clearRefreshTokenCookie, generateTokens, setRefreshTokenCookie } from "../utils/generateTokens.js";
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
  return SiteSetting.findByPk(1);
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

function mapAdminRoleToUserRole(role) {
  return role === "editor" ? "editor" : "admin";
}

async function createUserFromAdmin(admin, request) {
  if (!admin?.isActive) return null;

  const user = await User.create({
    email: admin.email,
    fullName: admin.name,
    isActive: true,
    lastLogin: new Date(),
    password: admin.password,
    role: mapAdminRoleToUserRole(admin.role),
  });

  await logAudit({
    action: "user.synced_from_admin",
    actorEmail: user.email,
    actorId: user.id,
    actorType: "user",
    description: "Website user account was created from an existing admin login.",
    details: {
      adminId: admin.id,
      userId: user.id,
      userRole: user.role,
    },
    module: "authentication",
    request,
  });

  await logSecurityEvent({
    details: {
      adminId: admin.id,
      userId: user.id,
      userRole: user.role,
    },
    email: user.email,
    eventType: "user.synced_from_admin",
    request,
    severity: "medium",
  });

  return user;
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

  const existingUser = await User.findOne({ where: { email } });
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

  let user = await User.scope("withPassword").findOne({ where: { email } });

  if (!user) {
    const admin = await Admin.scope("withPassword").findOne({ where: { email } });

    if (admin && (await admin.comparePassword(password))) {
      user = await createUserFromAdmin(admin, request);
    }

    if (!user) {
      await logFailedUserLogin({ email, reason: "unknown_user", request });
      throw new ApiError(401, "Invalid user credentials.");
    }
  }

  if (!user.isActive) {
    await logFailedUserLogin({ email, reason: "inactive_user", request, severity: "high", user });
    throw new ApiError(403, "This account is inactive.");
  }

  const passwordMatches = await user.comparePassword(password);

  if (!passwordMatches) {
    await logFailedUserLogin({ email, reason: "invalid_password", request, user });
    throw new ApiError(401, "Invalid email or password.");
  }

  user.lastLogin = new Date();
  await user.save({ fields: ["lastLogin"] });
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
