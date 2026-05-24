import { Op } from "../utils/mongoQuery.js";
import ApiError from "../utils/ApiError.js";
import { Admin, User } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";
import { logAudit, logSecurityEvent } from "../utils/securityLogger.js";

const userRoles = new Set(["user", "admin", "editor"]);

function cleanString(value, maxLength = 180) {
  return String(value || "").trim().slice(0, maxLength);
}

function normalizeRole(value) {
  return cleanString(value, 40).toLowerCase().replace(/[-\s]+/g, "_");
}

function normalizeBoolean(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return ["true", "1", "yes", "on", "active", "enabled"].includes(String(value).toLowerCase());
}

function buildUserWhere(query) {
  const search = cleanString(query.search || query.query);
  const role = normalizeRole(query.role);
  const status = cleanString(query.status).toLowerCase();
  const where = {};

  if (role && role !== "all") {
    if (!userRoles.has(role)) throw new ApiError(400, "Invalid user role filter.");
    where.role = role;
  }

  if (status && status !== "all") {
    if (!["active", "inactive"].includes(status)) throw new ApiError(400, "Invalid user status filter.");
    where.isActive = status === "active";
  }

  if (search) {
    where[Op.or] = [
      { fullName: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search.toLowerCase()}%` } },
      { phone: { [Op.like]: `%${search}%` } },
    ];
  }

  return where;
}

function paginationMeta(count, limit, page) {
  return {
    limit,
    page,
    pages: Math.max(Math.ceil(count / limit), 1),
    total: count,
  };
}

function serializeUser(user, adminByEmail = new Map()) {
  const data = user.toJSON ? user.toJSON() : user;
  const admin = adminByEmail.get(String(data.email || "").toLowerCase());

  return {
    ...data,
    adminAccess: admin
      ? {
          isActive: Boolean(admin.isActive),
          lastLogin: admin.lastLogin,
          role: admin.role,
        }
      : null,
  };
}

async function syncAdminAccessForUser(user, role, request) {
  const existingAdmin = await Admin.scope("withPassword").findOne({
    where: { email: user.email },
  });

  if (existingAdmin?.id === request.admin?.id && (role === "user" || user.isActive === false)) {
    throw new ApiError(400, "You cannot revoke your own admin access from this page.");
  }

  if (role === "admin" || role === "editor") {
    if (existingAdmin) {
      if (existingAdmin.role === "super_admin" && request.admin?.role !== "super_admin") {
        throw new ApiError(403, "Only a super admin can modify this administrator.");
      }

      existingAdmin.set({
        isActive: Boolean(user.isActive),
        name: user.fullName,
        password: user.password,
        role: existingAdmin.role === "super_admin" ? "super_admin" : role,
      });
      await existingAdmin.save({ fields: ["isActive", "name", "password", "role"] });
      return existingAdmin;
    }

    return Admin.create({
      email: user.email,
      isActive: Boolean(user.isActive),
      name: user.fullName,
      password: user.password,
      role,
    });
  }

  if (existingAdmin && existingAdmin.role !== "super_admin") {
    existingAdmin.isActive = false;
    await existingAdmin.save({ fields: ["isActive"] });
    return existingAdmin;
  }

  return existingAdmin || null;
}

export const listUsers = asyncHandler(async (request, response) => {
  const { limit, offset, page } = getPagination(request.query);
  const where = buildUserWhere(request.query);
  const { count, rows } = await User.findAndCountAll({
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    where,
  });
  const emails = rows.map((user) => user.email).filter(Boolean);
  const admins = emails.length
    ? await Admin.findAll({
        attributes: ["email", "isActive", "lastLogin", "role"],
        where: { email: emails },
      })
    : [];
  const adminByEmail = new Map(admins.map((admin) => [String(admin.email || "").toLowerCase(), admin]));
  const users = rows.map((user) => serializeUser(user, adminByEmail));
  const pagination = paginationMeta(count, limit, page);

  response.json({
    data: { pagination, users },
    pagination,
    success: true,
    users,
  });
});

export const updateUser = asyncHandler(async (request, response) => {
  const userId = cleanString(request.params.id, 80);
  const patch = {};

  if (Object.prototype.hasOwnProperty.call(request.body, "role")) {
    const role = normalizeRole(request.body.role);
    if (!userRoles.has(role)) throw new ApiError(400, "Invalid user role.");
    patch.role = role;
  }

  if (Object.prototype.hasOwnProperty.call(request.body, "isActive")) {
    patch.isActive = normalizeBoolean(request.body.isActive, true);
  }

  if (Object.prototype.hasOwnProperty.call(request.body, "emailVerified")) {
    patch.emailVerified = normalizeBoolean(request.body.emailVerified, false);
  }

  if (!Object.keys(patch).length) {
    throw new ApiError(400, "No user updates were provided.");
  }

  const user = await User.scope("withPassword").findByPk(userId);

  if (!user) throw new ApiError(404, "User not found.");

  const previous = {
    emailVerified: user.emailVerified,
    isActive: user.isActive,
    role: user.role,
  };

  user.set(patch);
  await user.save({ fields: Object.keys(patch) });

  const adminAccess = await syncAdminAccessForUser(user, user.role, request);
  const result = {
    adminAccess,
    previous,
    user,
  };

  const adminByEmail = new Map();
  if (result.adminAccess) {
    adminByEmail.set(String(result.user.email || "").toLowerCase(), result.adminAccess);
  }
  const serializedUser = serializeUser(result.user, adminByEmail);

  await logAudit({
    action: "user.updated",
    actorEmail: request.admin?.email,
    actorId: request.admin?.id,
    actorType: "admin",
    description: "Admin updated a website user account.",
    details: {
      current: {
        emailVerified: result.user.emailVerified,
        isActive: result.user.isActive,
        role: result.user.role,
      },
      previous: result.previous,
      userEmail: result.user.email,
      userId: result.user.id,
    },
    entity: "user",
    entityId: result.user.id,
    module: "users",
    request,
  });

  if (result.previous.role !== result.user.role) {
    await logSecurityEvent({
      details: {
        currentRole: result.user.role,
        previousRole: result.previous.role,
        userId: result.user.id,
      },
      email: result.user.email,
      eventType: "user.role_changed",
      request,
      severity: result.user.role === "user" ? "medium" : "high",
    });
  }

  response.json({
    data: { user: serializedUser },
    message:
      result.user.role === "admin" || result.user.role === "editor"
        ? "User updated and admin access synced. They can use the admin login with the same email and password."
        : "User updated successfully.",
    success: true,
    user: serializedUser,
  });
});
