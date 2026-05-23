import { Op } from "sequelize";
import ApiError from "../utils/ApiError.js";
import { PrayerRequest } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";
import { logAudit } from "../utils/securityLogger.js";
import { sendPrayerRequestNotification } from "../utils/sendEmail.js";

const prayerCategories = ["Healing", "Family", "Thanksgiving", "Guidance", "Loss", "Private Request", "Other"];
const prayerStatuses = ["pending", "prayed", "archived"];

function cleanString(value) {
  return String(value || "").trim();
}

function normalizeBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return ["true", "1", "yes", "on"].includes(String(value).toLowerCase());
}

function serializePrayer(prayer) {
  const data = prayer.toJSON ? prayer.toJSON() : prayer;

  return {
    ...data,
    privateBadge: data.isPrivate ? "Private" : null,
  };
}

export const createPrayerRequest = asyncHandler(async (request, response) => {
  const fullName = cleanString(request.body.fullName || request.body.name);
  const contact = cleanString(request.body.contact);
  const category = cleanString(request.body.category) || "Private Request";
  const message = cleanString(request.body.message);
  const isPrivate = normalizeBoolean(request.body.isPrivate, true);

  if (!fullName || !contact || !message) {
    throw new ApiError(400, "Full name, contact, and prayer message are required.");
  }

  if (!prayerCategories.includes(category)) {
    throw new ApiError(400, "Invalid prayer category.");
  }

  if (message.length < 10 || message.length > 2000) {
    throw new ApiError(400, "Prayer message must be between 10 and 2000 characters.");
  }

  const prayer = await PrayerRequest.create({
    category,
    contact,
    fullName,
    isPrivate,
    message,
    userId: request.user?.id || null,
  });

  sendPrayerRequestNotification(prayer).catch((error) => {
    console.error("Prayer email notification failed:", error.message);
  });

  response.status(201).json({
    data: { prayer: serializePrayer(prayer) },
    message: "Prayer request submitted successfully.",
    prayer: serializePrayer(prayer),
    success: true,
  });
});

export const listPrayerRequests = asyncHandler(async (request, response) => {
  const { limit, offset, page } = getPagination(request.query);
  const search = cleanString(request.query.search || request.query.query);
  const status = cleanString(request.query.status);
  const category = cleanString(request.query.category);
  const where = {};

  if (status && status !== "all") {
    if (!prayerStatuses.includes(status)) {
      throw new ApiError(400, "Invalid prayer status.");
    }

    where.status = status;
  }

  if (category && category !== "all") {
    if (!prayerCategories.includes(category)) {
      throw new ApiError(400, "Invalid prayer category.");
    }

    where.category = category;
  }

  if (request.query.isPrivate !== undefined || request.query.private !== undefined) {
    where.isPrivate = normalizeBoolean(request.query.isPrivate ?? request.query.private);
  }

  if (search) {
    where[Op.or] = [
      { fullName: { [Op.like]: `%${search}%` } },
      { contact: { [Op.like]: `%${search}%` } },
      { message: { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await PrayerRequest.findAndCountAll({
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    where,
  });
  const prayers = rows.map(serializePrayer);
  const pagination = {
    limit,
    page,
    pages: Math.max(Math.ceil(count / limit), 1),
    total: count,
  };

  response.json({
    data: { pagination, prayers },
    pagination,
    prayers,
    success: true,
  });
});

export const getPrayerRequest = asyncHandler(async (request, response) => {
  const prayer = await PrayerRequest.findByPk(request.params.id);
  if (!prayer) throw new ApiError(404, "Prayer request not found.");

  response.json({
    data: { prayer: serializePrayer(prayer) },
    prayer: serializePrayer(prayer),
    success: true,
  });
});

export const updatePrayerStatus = asyncHandler(async (request, response) => {
  const prayer = await PrayerRequest.findByPk(request.params.id);
  if (!prayer) throw new ApiError(404, "Prayer request not found.");

  const previousStatus = prayer.status;
  const status = cleanString(request.body.status || prayer.status);

  if (!prayerStatuses.includes(status)) {
    throw new ApiError(400, "Invalid prayer status.");
  }

  prayer.status = status;
  prayer.adminNotes = request.body.adminNotes === undefined ? prayer.adminNotes : cleanString(request.body.adminNotes);
  await prayer.save();

  await logAudit({
    action: "prayer_request.status_updated",
    actorEmail: request.admin?.email,
    actorId: request.admin?.id,
    actorType: "admin",
    description: "Admin updated a prayer request status.",
    details: {
      category: prayer.category,
      isPrivate: prayer.isPrivate,
      newStatus: prayer.status,
      prayerRequestId: prayer.id,
      previousStatus,
    },
    entity: "prayer_request",
    entityId: prayer.id,
    module: "prayers",
    request,
  });

  response.json({
    data: { prayer: serializePrayer(prayer) },
    message: "Prayer request updated successfully.",
    prayer: serializePrayer(prayer),
    success: true,
  });
});

export const deletePrayerRequest = asyncHandler(async (request, response) => {
  const deleted = await PrayerRequest.destroy({ where: { id: request.params.id } });
  if (!deleted) throw new ApiError(404, "Prayer request not found.");

  response.json({
    data: { id: request.params.id },
    deleted: true,
    message: "Prayer request deleted successfully.",
    success: true,
  });
});
