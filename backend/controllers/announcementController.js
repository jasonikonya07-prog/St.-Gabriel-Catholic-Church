import { Op } from "../utils/mongoQuery.js";
import slugify from "slugify";
import ApiError from "../utils/ApiError.js";
import { Announcement } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";
import { logAudit } from "../utils/securityLogger.js";

const announcementCategories = ["Important", "Mass Update", "Youth", "Charity", "Parish News"];

function cleanString(value) {
  return String(value || "").trim();
}

function normalizeBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return ["true", "1", "yes", "published", "on"].includes(String(value).toLowerCase());
}

function normalizeAnnouncementPayload(body) {
  return {
    category: cleanString(body.category) || "Parish News",
    content: cleanString(body.content || body.fullContent),
    imageUrl: cleanString(body.imageUrl) || null,
    isPublished: normalizeBoolean(body.isPublished ?? body.published, false),
    summary: cleanString(body.summary),
    title: cleanString(body.title),
  };
}

function validateAnnouncementPayload(payload, { partial = false } = {}) {
  if (!partial || payload.title !== "") {
    if (!payload.title) throw new ApiError(400, "Announcement title is required.");
  }

  if (!partial || payload.summary !== "") {
    if (!payload.summary) throw new ApiError(400, "Announcement summary is required.");
  }

  if (!partial || payload.content !== "") {
    if (!payload.content) throw new ApiError(400, "Announcement content is required.");
  }

  if (payload.category && !announcementCategories.includes(payload.category)) {
    throw new ApiError(400, "Invalid announcement category.");
  }
}

function buildSlugBase(title) {
  return slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  });
}

async function makeUniqueSlug(title, ignoreId = null) {
  const base = buildSlugBase(title) || `announcement-${Date.now()}`;
  let slug = base;
  let counter = 2;

  while (
    await Announcement.findOne({
      where: ignoreId ? { id: { [Op.ne]: ignoreId }, slug } : { slug },
    })
  ) {
    slug = `${base}-${counter}`;
    counter += 1;
  }

  return slug;
}

async function logAnnouncementAudit(request, { action, announcement, description, details = {} }) {
  await logAudit({
    action,
    actorEmail: request.admin?.email,
    actorId: request.admin?.id,
    actorType: "admin",
    description,
    details: {
      announcementId: announcement?.id,
      isPublished: announcement?.isPublished,
      title: announcement?.title,
      ...details,
    },
    entity: "announcement",
    entityId: announcement?.id,
    module: "announcements",
    request,
  });
}

function buildListWhere(request, { publishedOnly = false } = {}) {
  const search = cleanString(request.query.search || request.query.query);
  const category = cleanString(request.query.category);
  const where = {};

  if (publishedOnly) where.isPublished = true;

  if (category && category !== "all") {
    if (!announcementCategories.includes(category)) {
      throw new ApiError(400, "Invalid announcement category.");
    }

    where.category = category;
  }

  if (search) {
    where.title = { [Op.like]: `%${search}%` };
  }

  return where;
}

async function findAnnouncements(request, { publishedOnly = false } = {}) {
  const { limit, offset, page } = getPagination(request.query);
  const where = buildListWhere(request, { publishedOnly });
  const { count, rows } = await Announcement.findAndCountAll({
    limit,
    offset,
    order: [
      ["publishedAt", "DESC"],
      ["createdAt", "DESC"],
    ],
    where,
  });
  const pagination = {
    limit,
    page,
    pages: Math.max(Math.ceil(count / limit), 1),
    total: count,
  };

  return { announcements: rows, pagination };
}

export const listAnnouncements = asyncHandler(async (request, response) => {
  const { announcements, pagination } = await findAnnouncements(request, { publishedOnly: true });

  response.json({
    announcements,
    data: { announcements, pagination },
    pagination,
    success: true,
  });
});

export const getAnnouncementBySlug = asyncHandler(async (request, response) => {
  const announcement = await Announcement.findOne({
    where: {
      isPublished: true,
      slug: request.params.slug,
    },
  });

  if (!announcement) throw new ApiError(404, "Published announcement not found.");

  response.json({
    announcement,
    data: { announcement },
    success: true,
  });
});

export const listAllAnnouncements = asyncHandler(async (request, response) => {
  const { announcements, pagination } = await findAnnouncements(request);

  response.json({
    announcements,
    data: { announcements, pagination },
    pagination,
    success: true,
  });
});

export const createAnnouncement = asyncHandler(async (request, response) => {
  const payload = normalizeAnnouncementPayload(request.body);
  validateAnnouncementPayload(payload);

  const announcement = await Announcement.create({
    ...payload,
    createdBy: request.admin?.id || null,
    publishedAt: payload.isPublished ? new Date() : null,
    slug: await makeUniqueSlug(payload.title),
  });

  await logAnnouncementAudit(request, {
    action: "announcement.created",
    announcement,
    description: "Admin created an announcement.",
  });

  response.status(201).json({
    announcement,
    data: { announcement },
    message: "Announcement created successfully.",
    success: true,
  });
});

export const updateAnnouncement = asyncHandler(async (request, response) => {
  const announcement = await Announcement.findByPk(request.params.id);
  if (!announcement) throw new ApiError(404, "Announcement not found.");

  const next = {
    category: request.body.category === undefined ? announcement.category : cleanString(request.body.category),
    content:
      request.body.content === undefined && request.body.fullContent === undefined
        ? announcement.content
        : cleanString(request.body.content || request.body.fullContent),
    imageUrl: request.body.imageUrl === undefined ? announcement.imageUrl : cleanString(request.body.imageUrl) || null,
    isPublished:
      request.body.isPublished === undefined && request.body.published === undefined
        ? announcement.isPublished
        : normalizeBoolean(request.body.isPublished ?? request.body.published, announcement.isPublished),
    summary: request.body.summary === undefined ? announcement.summary : cleanString(request.body.summary),
    title: request.body.title === undefined ? announcement.title : cleanString(request.body.title),
  };

  validateAnnouncementPayload(next);

  if (next.title !== announcement.title) {
    next.slug = await makeUniqueSlug(next.title, announcement.id);
  }

  if (next.isPublished && !announcement.publishedAt) {
    next.publishedAt = new Date();
  }

  if (!next.isPublished) {
    next.publishedAt = null;
  }

  await announcement.update(next);

  await logAnnouncementAudit(request, {
    action: "announcement.updated",
    announcement,
    description: "Admin updated an announcement.",
  });

  response.json({
    announcement,
    data: { announcement },
    message: "Announcement updated successfully.",
    success: true,
  });
});

export const publishAnnouncement = asyncHandler(async (request, response) => {
  const announcement = await Announcement.findByPk(request.params.id);
  if (!announcement) throw new ApiError(404, "Announcement not found.");

  const isPublished = normalizeBoolean(request.body.isPublished ?? request.body.published, !announcement.isPublished);

  await announcement.update({
    isPublished,
    publishedAt: isPublished ? announcement.publishedAt || new Date() : null,
  });

  await logAnnouncementAudit(request, {
    action: "announcement.updated",
    announcement,
    description: isPublished ? "Admin published an announcement." : "Admin unpublished an announcement.",
    details: { publishAction: isPublished ? "published" : "unpublished" },
  });

  response.json({
    announcement,
    data: { announcement },
    message: isPublished ? "Announcement published successfully." : "Announcement unpublished successfully.",
    success: true,
  });
});

export const deleteAnnouncement = asyncHandler(async (request, response) => {
  const announcement = await Announcement.findByPk(request.params.id);
  if (!announcement) throw new ApiError(404, "Announcement not found.");

  await announcement.destroy();
  await logAnnouncementAudit(request, {
    action: "announcement.deleted",
    announcement,
    description: "Admin deleted an announcement.",
  });

  response.json({
    data: { id: request.params.id },
    deleted: true,
    message: "Announcement deleted successfully.",
    success: true,
  });
});
