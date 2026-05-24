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
].map((key) => key.toLowerCase()));

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

function cleanString(value, maxLength = 160) {
  return String(value || "").trim().slice(0, maxLength);
}

function inferActorType({ actorType = "", email = "", eventType = "", request = null } = {}) {
  const explicit = cleanString(actorType, 40).toLowerCase();
  if (["admin", "user", "system", "public"].includes(explicit)) return explicit;

  if (request?.admin) return "admin";
  if (request?.user) return "user";

  const type = cleanString(eventType, 120).toLowerCase();
  if (type.startsWith("admin.")) return "admin";
  if (type.startsWith("user.")) return "user";

  return email ? "public" : "system";
}

function inferActorId({ actorId = null, actorType = "", request = null } = {}) {
  if (actorId) return String(actorId);
  if (actorType === "admin" && request?.admin?.id) return String(request.admin.id);
  if (actorType === "user" && request?.user?.id) return String(request.user.id);
  return null;
}

function inferModule(module = "", eventType = "") {
  const explicit = cleanString(module, 80);
  if (explicit) return explicit;

  const prefix = cleanString(eventType, 120).split(".")[0];
  const modules = {
    admin: "authentication",
    auth: "authentication",
    button: "settings",
    maintenance: "settings",
    settings: "settings",
    user: "authentication",
  };

  return modules[prefix] || "security";
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

export async function logSecurityEvent({
  actorId = null,
  actorType = "",
  details = {},
  email = null,
  eventType,
  module = "",
  request = null,
  severity = "low",
}) {
  if (!eventType) return;

  try {
    const normalizedEmail = email ? cleanString(email, 160).toLowerCase() : null;
    const normalizedActorType = inferActorType({ actorType, email: normalizedEmail, eventType, request });

    await SecurityEvent.create({
      actorId: inferActorId({ actorId, actorType: normalizedActorType, request }),
      actorType: normalizedActorType,
      details: sanitizeDetails(details),
      email: normalizedEmail,
      eventType,
      ipAddress: getClientIp(request) || null,
      module: inferModule(module, eventType),
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
    const normalizedActorEmail = actorEmail ? cleanString(actorEmail, 160).toLowerCase() : null;

    await AuditLog.create({
      action,
      actorEmail: normalizedActorEmail,
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
