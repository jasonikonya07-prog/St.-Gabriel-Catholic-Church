import ApiError from "../utils/ApiError.js";
import { SiteSetting } from "../models/index.js";
import { verifyAccessToken } from "../utils/generateToken.js";
import { getClientIp } from "../utils/requestMeta.js";

const publicExemptPaths = new Set([
  "/health",
  "/settings/public",
]);

const adminRoutePrefixes = [
  "/admin-auth",
  "/admin-users",
  "/audit-logs",
  "/dashboard",
  "/security-events",
];

function getBearerToken(request) {
  const header = request.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" ? token : "";
}

function cleanPath(path) {
  const normalizedPath = String(path || "")
    .split("?")[0]
    .replace(/\/+$/, "")
    .replace(/^\/api(?=\/|$)/, "");

  return normalizedPath || "/";
}

function requestPath(request) {
  const mountedPath = `${request.baseUrl || ""}${request.path || ""}`;
  return cleanPath(request.originalUrl || mountedPath || request.url);
}

function isPublicExemptPath(request) {
  const normalizedPath = requestPath(request);

  if (publicExemptPaths.has(normalizedPath)) return true;
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

function isAdminControlPath(request) {
  const path = requestPath(request);
  const method = String(request.method || "GET").toUpperCase();

  if (adminRoutePrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return true;
  }

  if (path === "/settings/admin") return true;
  if (path === "/settings/maintenance" && method === "PATCH") return true;
  if (path === "/settings/auth-options" && method === "PATCH") return true;
  if (path.startsWith("/settings/buttons/") && method === "PATCH") return true;
  if (path === "/settings" && method === "PATCH") return true;

  return false;
}

function normalizeIp(ipAddress) {
  return String(ipAddress || "")
    .trim()
    .replace(/^::ffff:/, "");
}

function maintenanceBypassIps() {
  return String(process.env.MAINTENANCE_BYPASS_IPS || "")
    .split(",")
    .map(normalizeIp)
    .filter(Boolean);
}

function isMaintenanceBypassIp(request) {
  const clientIp = normalizeIp(getClientIp(request));
  if (!clientIp) return false;

  const allowedIps = maintenanceBypassIps();
  return allowedIps.includes("*") || allowedIps.includes(clientIp);
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
    if (
      request.method === "OPTIONS" ||
      isPublicExemptPath(request) ||
      isAdminControlPath(request) ||
      hasValidAdminToken(request) ||
      isMaintenanceBypassIp(request)
    ) {
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
      request: {
        clientIp: normalizeIp(getClientIp(request)) || null,
      },
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
