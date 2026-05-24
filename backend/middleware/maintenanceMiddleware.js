import ApiError from "../utils/ApiError.js";
import { SiteSetting } from "../models/index.js";
import { verifyAccessToken } from "../utils/generateToken.js";

const exemptPaths = new Set([
  "/admin-auth/login",
  "/admin-auth/me",
  "/admin-auth/logout",
  "/api/admin-auth/login",
  "/api/admin-auth/me",
  "/api/admin-auth/logout",
  "/api/health",
  "/api/settings/public",
  "/health",
  "/settings/public",
]);

function getBearerToken(request) {
  const header = request.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" ? token : "";
}

function isExemptPath(path) {
  const normalizedPath = String(path || "").replace(/^\/api(?=\/|$)/, "") || "/";

  if (exemptPaths.has(path) || exemptPaths.has(normalizedPath)) return true;
  if (normalizedPath.startsWith("/admin-auth/")) return true;
  if (normalizedPath.startsWith("/settings/public/")) return true;
  return false;
}

function hasValidAdminToken(request) {
  const token = getBearerToken(request);
  if (!token) return false;

  try {
    const payload = verifyAccessToken(token);
    return payload.tokenType === "admin";
  } catch {
    return false;
  }
}

async function getMaintenanceSettings() {
  const setting = await SiteSetting.findOne({ id: "1" });

  if (!setting) {
    return {
      maintenanceExpectedBack: null,
      maintenanceMessage: "We are currently improving our website. Please check back soon.",
      maintenanceMode: false,
      maintenanceTitle: "Website Under Maintenance",
    };
  }

  return {
    maintenanceExpectedBack: setting.maintenanceExpectedBack,
    maintenanceMessage: setting.maintenanceMessage,
    maintenanceMode: Boolean(setting.maintenanceMode),
    maintenanceTitle: setting.maintenanceTitle,
  };
}

export async function maintenanceMiddleware(request, response, next) {
  try {
    if (request.method === "OPTIONS" || isExemptPath(request.originalUrl || request.path) || hasValidAdminToken(request)) {
      next();
      return;
    }

    const maintenance = await getMaintenanceSettings();

    if (!maintenance.maintenanceMode) {
      next();
      return;
    }

    response.status(503).json({
      data: { maintenance },
      maintenance,
      message: maintenance.maintenanceMessage,
      status: "maintenance",
      success: false,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
      return;
    }

    console.error("Maintenance settings could not be loaded. Allowing the request to continue.", error);
    next();
  }
}

export const maintenanceModeGuard = maintenanceMiddleware;
