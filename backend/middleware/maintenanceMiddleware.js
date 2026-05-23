import ApiError from "../utils/ApiError.js";
import { SiteSetting } from "../models/index.js";
import { verifyAccessToken } from "../utils/generateTokens.js";

const exemptPaths = new Set(["/api/admin-auth/login", "/api/admin-auth/me", "/api/settings/public", "/api/health"]);

function getBearerToken(request) {
  const header = request.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" ? token : "";
}

function isExemptPath(path) {
  if (exemptPaths.has(path)) return true;
  if (path.startsWith("/api/settings/public/")) return true;
  return false;
}

function hasValidAdminToken(request) {
  const token = getBearerToken(request);
  if (!token) return false;

  try {
    const payload = verifyAccessToken(token);
    return !payload.tokenType || payload.tokenType === "admin";
  } catch {
    return false;
  }
}

async function getMaintenanceSettings() {
  const setting = await SiteSetting.findByPk(1);

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
    if (request.method === "OPTIONS" || isExemptPath(request.path) || hasValidAdminToken(request)) {
      next();
      return;
    }

    const maintenance = await getMaintenanceSettings();

    if (!maintenance.maintenanceMode) {
      next();
      return;
    }

    response.status(503).json({
      maintenance,
      message: maintenance.maintenanceMessage,
      status: "maintenance",
      success: false,
    });
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(503, "Website maintenance mode is active. Please try again later."));
  }
}

export const maintenanceModeGuard = maintenanceMiddleware;
