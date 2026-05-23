import ApiError from "../utils/ApiError.js";
import { Admin, User } from "../models/index.js";
import { verifyAccessToken } from "../utils/generateTokens.js";

function getBearerToken(request) {
  const header = request.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return "";
  }

  return token;
}

function normalizeRole(role) {
  return String(role || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function loadUserFromPayload(payload) {
  if (payload.tokenUse && payload.tokenUse !== "access") {
    throw new ApiError(401, "Invalid access token.");
  }

  if (payload.tokenType !== "user") {
    throw new ApiError(401, "Invalid user token.");
  }

  const user = await User.findByPk(payload.id || payload.sub);

  if (!user) {
    throw new ApiError(401, "User session is no longer valid.");
  }

  if (!user.isActive) {
    throw new ApiError(403, "This user account is inactive.");
  }

  return user;
}

async function loadAdminFromPayload(payload) {
  if (payload.tokenUse && payload.tokenUse !== "access") {
    throw new ApiError(401, "Invalid access token.");
  }

  if (payload.tokenType && payload.tokenType !== "admin") {
    throw new ApiError(401, "Invalid admin token.");
  }

  const admin = await Admin.findByPk(payload.id || payload.sub);

  if (!admin) {
    throw new ApiError(401, "Admin session is no longer valid.");
  }

  if (!admin.isActive) {
    throw new ApiError(403, "This admin account is inactive.");
  }

  return admin;
}

export async function protectUser(request, response, next) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      throw new ApiError(401, "User authentication token is required.");
    }

    const payload = verifyAccessToken(token);
    const user = await loadUserFromPayload(payload);

    request.auth = payload;
    request.user = user;
    next();
  } catch (error) {
    if (error.statusCode) {
      next(error);
      return;
    }

    next(new ApiError(401, "Invalid or expired user token."));
  }
}

export async function protectAdmin(request, response, next) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      throw new ApiError(401, "Admin authentication token is required.");
    }

    const payload = verifyAccessToken(token);
    const admin = await loadAdminFromPayload(payload);

    request.admin = admin;
    request.auth = payload;
    next();
  } catch (error) {
    if (error.statusCode) {
      next(error);
      return;
    }

    next(new ApiError(401, "Invalid or expired admin token."));
  }
}

export async function optionalAuth(request, response, next) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      next();
      return;
    }

    const payload = verifyAccessToken(token);
    request.auth = payload;

    if (payload.tokenType === "user") {
      request.user = await loadUserFromPayload(payload);
    } else if (!payload.tokenType || payload.tokenType === "admin") {
      request.admin = await loadAdminFromPayload(payload);
    }

    next();
  } catch (error) {
    if (error.statusCode) {
      next(error);
      return;
    }

    next(new ApiError(401, "Invalid or expired authentication token."));
  }
}

export function requireRole(...roles) {
  return (request, response, next) => {
    const adminRole = normalizeRole(request.admin?.role);
    const allowedRoles = roles.map(normalizeRole);

    if (!allowedRoles.length || allowedRoles.includes(adminRole)) {
      next();
      return;
    }

    next(new ApiError(403, "You do not have permission to perform this action."));
  };
}

export const authenticate = protectAdmin;
export const authorize = requireRole;
