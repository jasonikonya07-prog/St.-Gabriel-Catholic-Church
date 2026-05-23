import jwt from "jsonwebtoken";

const refreshCookieNames = {
  admin: "st_gabriel_admin_refresh",
  user: "st_gabriel_user_refresh",
};

function getRequiredSecret(primaryName, fallbackNames = []) {
  const names = [primaryName, ...fallbackNames];
  const foundName = names.find((name) => String(process.env[name] || "").trim());
  const secret = foundName ? String(process.env[foundName]).trim() : "";

  if (!secret) {
    throw new Error(`${primaryName} is required.`);
  }

  return secret;
}

function parseDurationToMs(value, fallbackMs) {
  const text = String(value || "").trim();
  if (!text) return fallbackMs;

  const match = text.match(/^(\d+)(ms|s|m|h|d)?$/i);
  if (!match) return fallbackMs;

  const amount = Number(match[1]);
  const unit = (match[2] || "ms").toLowerCase();
  const multipliers = {
    d: 24 * 60 * 60 * 1000,
    h: 60 * 60 * 1000,
    m: 60 * 1000,
    ms: 1,
    s: 1000,
  };

  return amount * (multipliers[unit] || 1);
}

function getAccessSecret() {
  return getRequiredSecret("JWT_ACCESS_SECRET", ["JWT_SECRET"]);
}

function getRefreshSecret() {
  return getRequiredSecret("JWT_REFRESH_SECRET", ["JWT_ACCESS_SECRET", "JWT_SECRET"]);
}

function buildPayload(account, accountType) {
  return {
    email: account.email,
    id: account.id,
    role: account.role,
    sub: String(account.id),
    tokenType: accountType,
  };
}

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  const sameSite = String(process.env.REFRESH_COOKIE_SAMESITE || "lax").toLowerCase();

  return {
    httpOnly: true,
    maxAge: parseDurationToMs(process.env.JWT_REFRESH_EXPIRES_IN || process.env.JWT_EXPIRES_IN || "7d", 7 * 24 * 60 * 60 * 1000),
    path: "/api",
    sameSite,
    secure: process.env.REFRESH_COOKIE_SECURE ? process.env.REFRESH_COOKIE_SECURE === "true" : isProduction,
    signed: false,
  };
}

export function signAccessToken(account, accountType) {
  return jwt.sign(
    {
      ...buildPayload(account, accountType),
      tokenUse: "access",
    },
    getAccessSecret(),
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    },
  );
}

export function signRefreshToken(account, accountType) {
  return jwt.sign(
    {
      ...buildPayload(account, accountType),
      tokenUse: "refresh",
    },
    getRefreshSecret(),
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    },
  );
}

export function generateTokens(account, accountType) {
  return {
    accessToken: signAccessToken(account, accountType),
    refreshToken: signRefreshToken(account, accountType),
  };
}

export function verifyAccessToken(token) {
  return jwt.verify(token, getAccessSecret());
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, getRefreshSecret());
}

export function setRefreshTokenCookie(response, refreshToken, accountType) {
  response.cookie(refreshCookieNames[accountType], refreshToken, getCookieOptions());
}

export function clearRefreshTokenCookie(response, accountType) {
  response.clearCookie(refreshCookieNames[accountType], {
    ...getCookieOptions(),
    maxAge: undefined,
  });
}

export { refreshCookieNames };
