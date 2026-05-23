import { AuditLog, SecurityEvent } from "../models/index.js";

const sensitiveKeys = new Set([
  "accessToken",
  "authorization",
  "cookie",
  "currentPassword",
  "newPassword",
  "password",
  "refreshToken",
  "token",
]);

function isSensitiveKey(key) {
  return sensitiveKeys.has(String(key || "").toLowerCase());
}

function sanitizeDetails(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeDetails);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !isSensitiveKey(key))
        .map(([key, item]) => [key, sanitizeDetails(item)]),
    );
  }

  if (typeof value === "string") {
    return value.slice(0, 500);
  }

  return value;
}

function stringifyDetails(details) {
  if (!details || typeof details !== "object") return null;

  try {
    return JSON.stringify(sanitizeDetails(details));
  } catch {
    return null;
  }
}

export function getClientIp(request) {
  const forwardedFor = String(request?.headers?.["x-forwarded-for"] || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)[0];

  return forwardedFor || request?.ip || request?.socket?.remoteAddress || "";
}

export function getUserAgent(request) {
  return String(request?.headers?.["user-agent"] || "").slice(0, 500);
}

export async function logSecurityEvent({ details = {}, email = null, eventType, request = null, severity = "low" }) {
  if (!eventType) return;

  try {
    await SecurityEvent.create({
      details: sanitizeDetails(details),
      email: email ? String(email).trim().toLowerCase() : null,
      eventType,
      ipAddress: getClientIp(request) || null,
      severity,
      userAgent: getUserAgent(request) || null,
    });
  } catch (error) {
    console.error("Security event write failed:", error.message);
  }
}

export async function logAudit({
  action,
  actorEmail = null,
  actorId = null,
  actorType = "system",
  description = null,
  details = null,
  entity = null,
  entityId = null,
  module = "system",
  request = null,
}) {
  if (!action) return;

  try {
    await AuditLog.create({
      action,
      actorEmail,
      actorId: actorId ? String(actorId) : null,
      actorType,
      description,
      entity,
      entityId: entityId ? String(entityId) : null,
      ipAddress: getClientIp(request) || null,
      metadata: stringifyDetails(details),
      module,
      userAgent: getUserAgent(request) || null,
    });
  } catch (error) {
    console.error("Audit log write failed:", error.message);
  }
}
