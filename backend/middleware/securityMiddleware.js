import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import { suspiciousIpLogger } from "./suspiciousIpLogger.js";
import { sanitizeBody } from "./validateMiddleware.js";
import ApiError from "../utils/ApiError.js";
import { getClientIp, logSecurityEvent } from "../utils/securityLogger.js";

const DEFAULT_LOCAL_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];
const DEFAULT_BODY_LIMIT = "100kb";
const suspiciousPatterns = [
  { label: "path_traversal", pattern: /(\.\.\/|\.\.\\|%2e%2e)/i },
  { label: "script_probe", pattern: /(<script|%3cscript|javascript:)/i },
  { label: "sql_probe", pattern: /(union\s+select|information_schema|'\s*or\s*1\s*=\s*1|"\s*or\s*1\s*=\s*1)/i },
  { label: "sensitive_file_probe", pattern: /(\.env|\.git|wp-admin|phpmyadmin|config\.php)/i },
];

export function parseTrustProxy(value = process.env.TRUST_PROXY) {
  const normalized = String(value || "false").trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return 1;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  return value;
}

export function getAllowedOrigins() {
  const configured = process.env.CORS_ORIGINS || process.env.CLIENT_URL || DEFAULT_LOCAL_ORIGINS.join(",");

  return configured
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function getCookieSecret() {
  return process.env.COOKIE_SECRET || process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || undefined;
}

export function helmetConfig() {
  return helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hidePoweredBy: true,
  });
}

export function corsWhitelist(allowedOrigins = getAllowedOrigins()) {
  const allowedOriginSet = new Set(allowedOrigins);

  return cors({
    allowedHeaders: ["Authorization", "Content-Type", "X-Requested-With", "X-Request-Id"],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    optionsSuccessStatus: 204,
    origin(origin, callback) {
      if (!origin || allowedOriginSet.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new ApiError(403, "This origin is not allowed by CORS."));
    },
  });
}

export function suspiciousRequestLogger(request, response, next) {
  const target = String(request.originalUrl || request.url || "").slice(0, 2000);
  const match = suspiciousPatterns.find(({ pattern }) => pattern.test(target));

  if (match) {
    const ipAddress = getClientIp(request) || "unknown";
    console.warn(`Suspicious request (${match.label}) from ${ipAddress}: ${request.method} ${request.path}`);
    void logSecurityEvent({
      details: {
        method: request.method,
        path: request.path,
        reason: match.label,
      },
      eventType: "suspicious_request",
      request,
      severity: "medium",
    });
  }

  next();
}

export function bodySizeLimit(limit = process.env.REQUEST_BODY_LIMIT || DEFAULT_BODY_LIMIT) {
  return [
    express.json({ limit, strict: true }),
    express.urlencoded({ extended: false, limit, parameterLimit: 50 }),
    sanitizeBody,
  ];
}

export function configureSecurityMiddleware(app, options = {}) {
  const bodyLimit = options.bodyLimit || process.env.REQUEST_BODY_LIMIT || DEFAULT_BODY_LIMIT;
  const cookieSecret = options.cookieSecret || getCookieSecret();
  const includeBodyParsers = options.includeBodyParsers !== false;

  app.set("trust proxy", parseTrustProxy(options.trustProxy ?? process.env.TRUST_PROXY));
  app.disable("x-powered-by");
  app.use(helmetConfig());
  app.use(corsWhitelist(options.allowedOrigins || getAllowedOrigins()));
  app.use(compression());
  app.use(hpp());
  app.use(cookieSecret ? cookieParser(cookieSecret) : cookieParser());
  app.use(suspiciousIpLogger);
  app.use(suspiciousRequestLogger);

  if (includeBodyParsers) {
    app.use(bodySizeLimit(bodyLimit));
  }
}
