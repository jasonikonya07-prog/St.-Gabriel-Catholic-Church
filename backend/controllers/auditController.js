import ApiError from "../utils/ApiError.js";
import AuditLog, { actorTypes } from "../models/AuditLog.js";
import SecurityEvent, { securityActorTypes, securitySeverities } from "../models/SecurityEvent.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";
import { logAudit } from "../utils/securityLogger.js";

const auditActorTypes = new Set(actorTypes);
const eventActorTypes = new Set(securityActorTypes);
const severities = new Set(securitySeverities);

function cleanString(value, maxLength = 160) {
  return String(value || "").trim().slice(0, maxLength);
}

function escapeRegExp(value) {
  return cleanString(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function regex(value) {
  return new RegExp(escapeRegExp(value), "i");
}

function parseRecordId(value, label) {
  const id = cleanString(value, 120);
  if (!id) throw new ApiError(400, `${label} id is invalid.`);
  return id;
}

function paginationMeta(count, limit, page) {
  return {
    limit,
    page,
    pages: Math.max(Math.ceil(count / limit), 1),
    total: count,
  };
}

function parseAuditLog(row) {
  const data = row.toJSON ? row.toJSON() : row;

  if (!data.metadata || typeof data.metadata !== "string") return data;

  try {
    return {
      ...data,
      metadata: JSON.parse(data.metadata),
    };
  } catch {
    return data;
  }
}

function buildAuditLogFilter(query) {
  const search = cleanString(query.search || query.query);
  const action = cleanString(query.action);
  const module = cleanString(query.module);
  const email = cleanString(query.email);
  const ipAddress = cleanString(query.ip || query.ipAddress, 64);
  const actorType = cleanString(query.actorType, 40).toLowerCase();
  const filter = {};

  if (action) filter.action = regex(action);
  if (module && module !== "all") filter.module = regex(module);
  if (email) filter.actorEmail = regex(email.toLowerCase());
  if (ipAddress) filter.ipAddress = regex(ipAddress);

  if (actorType && actorType !== "all") {
    if (!auditActorTypes.has(actorType)) throw new ApiError(400, "Invalid actor type filter.");
    filter.actorType = actorType;
  }

  if (search) {
    filter.$or = [
      { action: regex(search) },
      { module: regex(search) },
      { actorEmail: regex(search.toLowerCase()) },
      { ipAddress: regex(search) },
      { description: regex(search) },
      { entity: regex(search) },
      { entityId: regex(search) },
    ];
  }

  return filter;
}

function buildSecurityEventFilter(query) {
  const search = cleanString(query.search || query.query);
  const action = cleanString(query.action || query.eventType);
  const module = cleanString(query.module);
  const email = cleanString(query.email);
  const ipAddress = cleanString(query.ip || query.ipAddress, 64);
  const severity = cleanString(query.severity, 40).toLowerCase();
  const actorType = cleanString(query.actorType, 40).toLowerCase();
  const filter = {};

  if (action) filter.eventType = regex(action);
  if (module && module !== "all") filter.module = regex(module);
  if (email) filter.email = regex(email.toLowerCase());
  if (ipAddress) filter.ipAddress = regex(ipAddress);

  if (severity && severity !== "all") {
    if (!severities.has(severity)) throw new ApiError(400, "Invalid severity filter.");
    filter.severity = severity;
  }

  if (actorType && actorType !== "all") {
    if (!eventActorTypes.has(actorType)) throw new ApiError(400, "Invalid actor type filter.");
    filter.actorType = actorType;
  }

  if (search) {
    filter.$or = [
      { eventType: regex(search) },
      { module: regex(search) },
      { email: regex(search.toLowerCase()) },
      { ipAddress: regex(search) },
      { userAgent: regex(search) },
    ];
  }

  return filter;
}

export const listAuditLogs = asyncHandler(async (request, response) => {
  const { limit, offset, page } = getPagination(request.query);
  const filter = buildAuditLogFilter(request.query);
  const [count, rows] = await Promise.all([
    AuditLog.countDocuments(filter),
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit),
  ]);
  const auditLogs = rows.map(parseAuditLog);
  const pagination = paginationMeta(count, limit, page);

  response.json({
    auditLogs,
    data: { auditLogs, pagination },
    pagination,
    success: true,
  });
});

export const listSecurityEvents = asyncHandler(async (request, response) => {
  const { limit, offset, page } = getPagination(request.query);
  const filter = buildSecurityEventFilter(request.query);
  const [count, securityEvents] = await Promise.all([
    SecurityEvent.countDocuments(filter),
    SecurityEvent.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit),
  ]);
  const pagination = paginationMeta(count, limit, page);

  response.json({
    data: { pagination, securityEvents },
    pagination,
    securityEvents,
    success: true,
  });
});

export const deleteAuditLog = asyncHandler(async (request, response) => {
  const id = parseRecordId(request.params.id, "Audit log");
  const auditLog = await AuditLog.findOneAndDelete({ id });

  if (!auditLog) throw new ApiError(404, "Audit log not found.");

  await logAudit({
    action: "audit_log.deleted",
    actorEmail: request.admin?.email,
    actorId: request.admin?.id,
    actorType: "admin",
    description: "Super admin deleted an audit log.",
    details: {
      deletedLog: {
        action: auditLog.action,
        actorEmail: auditLog.actorEmail,
        actorType: auditLog.actorType,
        id: auditLog.id,
        module: auditLog.module,
      },
    },
    entity: "audit_logs",
    entityId: id,
    module: "audit",
    request,
  });

  response.json({
    data: { id },
    deleted: true,
    message: "Audit log deleted successfully.",
    success: true,
  });
});

export const deleteSecurityEvent = asyncHandler(async (request, response) => {
  const id = parseRecordId(request.params.id, "Security event");
  const securityEvent = await SecurityEvent.findOneAndDelete({ id });

  if (!securityEvent) throw new ApiError(404, "Security event not found.");

  await logAudit({
    action: "security_event.deleted",
    actorEmail: request.admin?.email,
    actorId: request.admin?.id,
    actorType: "admin",
    description: "Super admin deleted a security event.",
    details: {
      deletedEvent: {
        email: securityEvent.email,
        eventType: securityEvent.eventType,
        id: securityEvent.id,
        severity: securityEvent.severity,
      },
    },
    entity: "security_events",
    entityId: id,
    module: "audit",
    request,
  });

  response.json({
    data: { id },
    deleted: true,
    message: "Security event deleted successfully.",
    success: true,
  });
});
