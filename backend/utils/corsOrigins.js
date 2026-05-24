const DEFAULT_LOCAL_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];
const VERCEL_HOST_ENV_KEYS = ["VERCEL_URL", "VERCEL_BRANCH_URL", "VERCEL_PROJECT_PRODUCTION_URL"];
const VERCEL_FRONTEND_SERVICE_URL_KEYS = ["FRONTEND_URL", "WEB_URL"];

export function normalizeOrigin(origin) {
  const trimmed = String(origin || "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";

  try {
    return new URL(trimmed).origin;
  } catch {
    try {
      return new URL(`https://${trimmed}`).origin;
    } catch {
      return trimmed;
    }
  }
}

function parseOrigins(value) {
  return String(value || "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);
}

function getVercelDeploymentOrigins(env = process.env) {
  return [...VERCEL_HOST_ENV_KEYS, ...VERCEL_FRONTEND_SERVICE_URL_KEYS].flatMap((key) => parseOrigins(env[key]));
}

function isWildcardOriginAllowed(origin, allowedOrigins) {
  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) return false;

  let hostname = "";
  try {
    hostname = new URL(normalizedOrigin).hostname;
  } catch {
    return false;
  }

  return allowedOrigins.some((allowedOrigin) => {
    if (!allowedOrigin.includes("*")) return false;

    const allowedHostname = allowedOrigin.replace(/^https?:\/\//, "");
    if (!allowedHostname.startsWith("*.")) return false;

    const suffix = allowedHostname.slice(1);
    return hostname.endsWith(suffix) && hostname.length > suffix.length;
  });
}

export function getAllowedOrigins(env = process.env) {
  const origins = [
    ...parseOrigins(env.CLIENT_URL),
    ...parseOrigins(env.CORS_ORIGINS),
    ...getVercelDeploymentOrigins(env),
  ];

  if (env.NODE_ENV !== "production") {
    origins.push(...DEFAULT_LOCAL_ORIGINS);
  }

  return [...new Set(origins)];
}

export function isOriginAllowed(origin, allowedOrigins = getAllowedOrigins()) {
  if (!origin) return true;

  const normalizedOrigin = normalizeOrigin(origin);
  return allowedOrigins.includes(normalizedOrigin) || isWildcardOriginAllowed(normalizedOrigin, allowedOrigins);
}
