import { Op } from "sequelize";
import ApiError from "../utils/ApiError.js";
import { AuditLog, SecurityEvent } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";
import { logAudit } from "../utils/securityLogger.js";

const actorTypes = new Set(["admin", "user", "system", "public"]);
const severities = new Set(["low", "medium", "high", "critical"]);

function cleanString(value, maxLength = 160) {
  return String(value || "").trim().slice(0, maxLength);
}

function parseNumericId(value, label) {
  const id = cleanString(value, 30);
  if (!/^\d+$/.test(id)) throw new ApiError(400, `${label} id is invalid.`);
  return id;
}

function like(value) {
  return { [Op.like]: `%${cleanString(value)}%` };
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

  if (!data.metadata) return data;

  try {
    return {
      ...data,
      metadata: JSON.parse(data.metadata),
    };
  } catch {
    return data;
  }
}

function buildAuditLogWhere(query) {
  const search = cleanString(query.search || query.query);
  const action = cleanString(query.action);
  const module = cleanString(query.module);
  const email = cleanString(query.email);
  const ipAddress = cleanString(query.ip || query.ipAddress, 64);
  const actorType = cleanString(query.actorType, 40).toLowerCase();
  const where = {};

  if (action) where.action = like(action);
  if (module) where.module = like(module);
  if (email) where.actorEmail = like(email.toLowerCase());
  if (ipAddress) where.ipAddress = like(ipAddress);

  if (actorType && actorType !== "all") {
    if (!actorTypes.has(actorType)) throw new ApiError(400, "Invalid actor type filter.");
    where.actorType = actorType;
  }

  if (search) {
    where[Op.or] = [
      { action: like(search) },
      { module: like(search) },
      { actorEmail: like(search.toLowerCase()) },
      { ipAddress: like(search) },
      { description: like(search) },
      { entity: like(search) },
      { entityId: like(search) },
    ];
  }

  return where;
}

function buildSecurityEventWhere(query) {
  const search = cleanString(query.search || query.query);
  const eventType = cleanString(query.eventType || query.action);
  const email = cleanString(query.email);
  const ipAddress = cleanString(query.ip || query.ipAddress, 64);
  const severity = cleanString(query.severity, 40).toLowerCase();
  const where = {};

  if (eventType) where.eventType = like(eventType);
  if (email) where.email = like(email.toLowerCase());
  if (ipAddress) where.ipAddress = like(ipAddress);

  if (severity && severity !== "all") {
    if (!severities.has(severity)) throw new ApiError(400, "Invalid severity filter.");
    where.severity = severity;
  }

  if (search) {
    where[Op.or] = [
      { eventType: like(search) },
      { email: like(search.toLowerCase()) },
      { ipAddress: like(search) },
      { userAgent: like(search) },
    ];
  }

  return where;
}

export const listAuditLogs = asyncHandler(async (request, response) => {
  const { limit, offset, page } = getPagination(request.query);
  const where = buildAuditLogWhere(request.query);
  const { count, rows } = await AuditLog.findAndCountAll({
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    where,
  });
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
  const where = buildSecurityEventWhere(request.query);
  const { count, rows } = await SecurityEvent.findAndCountAll({
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    where,
  });
  const pagination = paginationMeta(count, limit, page);

  response.json({
    data: { pagination, securityEvents: rows },
    pagination,
    securityEvents: rows,
    success: true,
  });
});

export const deleteAuditLog = asyncHandler(async (request, response) => {
  const id = parseNumericId(request.params.id, "Audit log");
  const auditLog = await AuditLog.findByPk(id);

  if (!auditLog) throw new ApiError(404, "Audit log not found.");

  const deletedLog = {
    action: auditLog.action,
    actorEmail: auditLog.actorEmail,
    actorType: auditLog.actorType,
    id: auditLog.id,
    module: auditLog.module,
  };

  await auditLog.destroy();
  await logAudit({
    action: "audit_log.deleted",
    actorEmail: request.admin?.email,
    actorId: request.admin?.id,
    actorType: "admin",
    description: "Super admin deleted an audit log.",
    details: { deletedLog },
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
  const id = parseNumericId(request.params.id, "Security event");
  const securityEvent = await SecurityEvent.findByPk(id);

  if (!securityEvent) throw new ApiError(404, "Security event not found.");

  const deletedEvent = {
    email: securityEvent.email,
    eventType: securityEvent.eventType,
    id: securityEvent.id,
    severity: securityEvent.severity,
  };

  await securityEvent.destroy();
  await logAudit({
    action: "security_event.deleted",
    actorEmail: request.admin?.email,
    actorId: request.admin?.id,
    actorType: "admin",
    description: "Super admin deleted a security event.",
    details: { deletedEvent },
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
