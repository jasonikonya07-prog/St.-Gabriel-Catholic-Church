import { Op } from "../utils/mongoQuery.js";
import { Admin, AuditLog, FailedLoginAttempt } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";

function cleanString(value) {
  return String(value || "").trim();
}

function parseMetadata(row) {
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

export const getSecurityOverview = asyncHandler(async (request, response) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [failedLogins24h, lockedAdmins, recentFailedLogins, recentAuditLogs] = await Promise.all([
    FailedLoginAttempt.count({ where: { createdAt: { [Op.gte]: since } } }),
    Admin.count({ where: { lockUntil: { [Op.gt]: new Date() } } }),
    FailedLoginAttempt.findAll({ limit: 8, order: [["createdAt", "DESC"]] }),
    AuditLog.findAll({ limit: 8, order: [["createdAt", "DESC"]] }),
  ]);

  response.json({
    data: {
      failedLogins24h,
      lockedAdmins,
      recentAuditLogs: recentAuditLogs.map(parseMetadata),
      recentFailedLogins,
    },
    failedLogins24h,
    lockedAdmins,
    recentAuditLogs: recentAuditLogs.map(parseMetadata),
    recentFailedLogins,
    success: true,
  });
});

export const listAuditLogs = asyncHandler(async (request, response) => {
  const { limit, offset, page } = getPagination(request.query);
  const action = cleanString(request.query.action);
  const actorType = cleanString(request.query.actorType);
  const where = {};

  if (action) where.action = { [Op.like]: `%${action}%` };
  if (actorType && actorType !== "all") where.actorType = actorType;

  const { count, rows } = await AuditLog.findAndCountAll({
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    where,
  });
  const pagination = {
    limit,
    page,
    pages: Math.max(Math.ceil(count / limit), 1),
    total: count,
  };

  response.json({
    auditLogs: rows.map(parseMetadata),
    data: { auditLogs: rows.map(parseMetadata), pagination },
    pagination,
    success: true,
  });
});

export const listFailedLoginAttempts = asyncHandler(async (request, response) => {
  const { limit, offset, page } = getPagination(request.query);
  const scope = cleanString(request.query.scope);
  const where = {};

  if (scope && scope !== "all") where.scope = scope;

  const { count, rows } = await FailedLoginAttempt.findAndCountAll({
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    where,
  });
  const pagination = {
    limit,
    page,
    pages: Math.max(Math.ceil(count / limit), 1),
    total: count,
  };

  response.json({
    data: { failedLoginAttempts: rows, pagination },
    failedLoginAttempts: rows,
    pagination,
    success: true,
  });
});
