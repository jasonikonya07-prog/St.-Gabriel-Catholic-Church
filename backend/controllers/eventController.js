import { Op } from "sequelize";
import slugify from "slugify";
import ApiError from "../utils/ApiError.js";
import { Event } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";
import { logAudit } from "../utils/securityLogger.js";

const eventCategories = ["Mass", "Youth", "Charity", "Bible Study", "Parish", "Special"];

function cleanString(value) {
  return String(value || "").trim();
}

function normalizeBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return ["true", "1", "yes", "published", "featured", "on"].includes(String(value).toLowerCase());
}

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeEventPayload(body) {
  return {
    category: cleanString(body.category) || "Parish",
    description: cleanString(body.description),
    endTime: cleanString(body.endTime) || null,
    eventDate: cleanString(body.eventDate || body.date),
    imageUrl: cleanString(body.imageUrl) || null,
    isFeatured: normalizeBoolean(body.isFeatured ?? body.featured, false),
    isPublished: normalizeBoolean(body.isPublished ?? body.published, false),
    location: cleanString(body.location),
    startTime: cleanString(body.startTime),
    title: cleanString(body.title),
  };
}

function validateEventPayload(payload) {
  if (!payload.title) throw new ApiError(400, "Event title is required.");
  if (!payload.description) throw new ApiError(400, "Event description is required.");
  if (!payload.eventDate) throw new ApiError(400, "Event date is required.");
  if (!payload.startTime) throw new ApiError(400, "Event start time is required.");
  if (!payload.location) throw new ApiError(400, "Event location is required.");
  if (!eventCategories.includes(payload.category)) throw new ApiError(400, "Invalid event category.");
}

function buildSlugBase(title) {
  return slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  });
}

async function makeUniqueSlug(title, ignoreId = null) {
  const base = buildSlugBase(title) || `event-${Date.now()}`;
  let slug = base;
  let counter = 2;

  while (
    await Event.findOne({
      where: ignoreId ? { id: { [Op.ne]: ignoreId }, slug } : { slug },
    })
  ) {
    slug = `${base}-${counter}`;
    counter += 1;
  }

  return slug;
}

async function logEventAudit(request, { action, description, details = {}, event }) {
  await logAudit({
    action,
    actorEmail: request.admin?.email,
    actorId: request.admin?.id,
    actorType: "admin",
    description,
    details: {
      eventDate: event?.eventDate,
      eventId: event?.id,
      isPublished: event?.isPublished,
      title: event?.title,
      ...details,
    },
    entity: "event",
    entityId: event?.id,
    module: "events",
    request,
  });
}

function buildListWhere(request, { publishedUpcomingOnly = false } = {}) {
  const category = cleanString(request.query.category);
  const search = cleanString(request.query.search || request.query.query);
  const where = {};

  if (publishedUpcomingOnly) {
    where.isPublished = true;
    where.eventDate = { [Op.gte]: todayDateOnly() };
  }

  if (category && category !== "all") {
    if (!eventCategories.includes(category)) {
      throw new ApiError(400, "Invalid event category.");
    }

    where.category = category;
  }

  if (search) {
    where[Op.or] = [{ title: { [Op.like]: `%${search}%` } }, { location: { [Op.like]: `%${search}%` } }];
  }

  return where;
}

async function findEvents(request, { publishedUpcomingOnly = false } = {}) {
  const { limit, offset, page } = getPagination(request.query);
  const where = buildListWhere(request, { publishedUpcomingOnly });
  const { count, rows } = await Event.findAndCountAll({
    limit,
    offset,
    order: [
      ["eventDate", "ASC"],
      ["startTime", "ASC"],
    ],
    where,
  });
  const pagination = {
    limit,
    page,
    pages: Math.max(Math.ceil(count / limit), 1),
    total: count,
  };

  return { events: rows, pagination };
}

export const listEvents = asyncHandler(async (request, response) => {
  const { events, pagination } = await findEvents(request, { publishedUpcomingOnly: true });

  response.json({
    data: { events, pagination },
    events,
    pagination,
    success: true,
  });
});

export const getEventBySlug = asyncHandler(async (request, response) => {
  const event = await Event.findOne({
    where: {
      isPublished: true,
      slug: request.params.slug,
    },
  });

  if (!event) throw new ApiError(404, "Published event not found.");

  response.json({
    data: { event },
    event,
    success: true,
  });
});

export const listAllEvents = asyncHandler(async (request, response) => {
  const { events, pagination } = await findEvents(request);

  response.json({
    data: { events, pagination },
    events,
    pagination,
    success: true,
  });
});

export const createEvent = asyncHandler(async (request, response) => {
  const payload = normalizeEventPayload(request.body);
  validateEventPayload(payload);

  const event = await Event.create({
    ...payload,
    createdBy: request.admin?.id || null,
    slug: await makeUniqueSlug(payload.title),
  });

  await logEventAudit(request, {
    action: "event.created",
    description: "Admin created an event.",
    event,
  });

  response.status(201).json({
    data: { event },
    event,
    message: "Event created successfully.",
    success: true,
  });
});

export const updateEvent = asyncHandler(async (request, response) => {
  const event = await Event.findByPk(request.params.id);
  if (!event) throw new ApiError(404, "Event not found.");

  const next = {
    category: request.body.category === undefined ? event.category : cleanString(request.body.category),
    description: request.body.description === undefined ? event.description : cleanString(request.body.description),
    endTime: request.body.endTime === undefined ? event.endTime : cleanString(request.body.endTime) || null,
    eventDate:
      request.body.eventDate === undefined && request.body.date === undefined
        ? event.eventDate
        : cleanString(request.body.eventDate || request.body.date),
    imageUrl: request.body.imageUrl === undefined ? event.imageUrl : cleanString(request.body.imageUrl) || null,
    isFeatured:
      request.body.isFeatured === undefined && request.body.featured === undefined
        ? event.isFeatured
        : normalizeBoolean(request.body.isFeatured ?? request.body.featured, event.isFeatured),
    isPublished:
      request.body.isPublished === undefined && request.body.published === undefined
        ? event.isPublished
        : normalizeBoolean(request.body.isPublished ?? request.body.published, event.isPublished),
    location: request.body.location === undefined ? event.location : cleanString(request.body.location),
    startTime: request.body.startTime === undefined ? event.startTime : cleanString(request.body.startTime),
    title: request.body.title === undefined ? event.title : cleanString(request.body.title),
  };

  validateEventPayload(next);

  if (next.title !== event.title) {
    next.slug = await makeUniqueSlug(next.title, event.id);
  }

  await event.update(next);

  await logEventAudit(request, {
    action: "event.updated",
    description: "Admin updated an event.",
    event,
  });

  response.json({
    data: { event },
    event,
    message: "Event updated successfully.",
    success: true,
  });
});

export const publishEvent = asyncHandler(async (request, response) => {
  const event = await Event.findByPk(request.params.id);
  if (!event) throw new ApiError(404, "Event not found.");

  const isPublished = normalizeBoolean(request.body.isPublished ?? request.body.published, !event.isPublished);
  await event.update({ isPublished });

  await logEventAudit(request, {
    action: "event.updated",
    description: isPublished ? "Admin published an event." : "Admin unpublished an event.",
    details: { publishAction: isPublished ? "published" : "unpublished" },
    event,
  });

  response.json({
    data: { event },
    event,
    message: isPublished ? "Event published successfully." : "Event unpublished successfully.",
    success: true,
  });
});

export const deleteEvent = asyncHandler(async (request, response) => {
  const event = await Event.findByPk(request.params.id);
  if (!event) throw new ApiError(404, "Event not found.");

  await event.destroy();
  await logEventAudit(request, {
    action: "event.deleted",
    description: "Admin deleted an event.",
    event,
  });

  response.json({
    data: { id: request.params.id },
    deleted: true,
    message: "Event deleted successfully.",
    success: true,
  });
});
