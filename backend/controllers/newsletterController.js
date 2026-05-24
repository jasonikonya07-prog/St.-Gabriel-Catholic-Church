import { Op } from "../utils/mongoQuery.js";
import ApiError from "../utils/ApiError.js";
import { NewsletterSubscriber } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";
import { sendNewsletterWelcomeEmail } from "../utils/sendEmail.js";

function cleanString(value) {
  return String(value || "").trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  return ["true", "1", "yes", "subscribed"].includes(String(value).toLowerCase());
}

function serializeSubscriber(subscriber) {
  const data = subscriber.toJSON ? subscriber.toJSON() : subscriber;

  return {
    ...data,
    status: data.isSubscribed ? "subscribed" : "unsubscribed",
  };
}

export const subscribe = asyncHandler(async (request, response) => {
  const email = cleanString(request.body.email).toLowerCase();
  const fullName = cleanString(request.body.fullName || request.body.name);
  const source = cleanString(request.body.source) || "website";

  if (!email) {
    throw new ApiError(400, "Email address is required.");
  }

  if (!isValidEmail(email)) {
    throw new ApiError(400, "Please enter a valid email address.");
  }

  const existingSubscriber = await NewsletterSubscriber.findOne({ where: { email } });

  if (existingSubscriber?.isSubscribed) {
    throw new ApiError(409, "This email is already subscribed.");
  }

  const subscriber = existingSubscriber
    ? await existingSubscriber.update({
        fullName: fullName || existingSubscriber.fullName,
        isSubscribed: true,
        source,
      })
    : await NewsletterSubscriber.create({
        email,
        fullName: fullName || null,
        isSubscribed: true,
        source,
      });

  sendNewsletterWelcomeEmail(subscriber).catch((error) => {
    console.error("Newsletter welcome email failed:", error.message);
  });

  response.status(existingSubscriber ? 200 : 201).json({
    data: { subscriber: serializeSubscriber(subscriber) },
    message: existingSubscriber ? "Newsletter subscription reactivated." : "Newsletter subscription created.",
    subscriber: serializeSubscriber(subscriber),
    success: true,
  });
});

export const unsubscribe = asyncHandler(async (request, response) => {
  const email = cleanString(request.body.email).toLowerCase();

  if (!email) {
    throw new ApiError(400, "Email address is required.");
  }

  if (!isValidEmail(email)) {
    throw new ApiError(400, "Please enter a valid email address.");
  }

  const subscriber = await NewsletterSubscriber.findOne({ where: { email } });

  if (!subscriber) {
    throw new ApiError(404, "Newsletter subscriber not found.");
  }

  if (!subscriber.isSubscribed) {
    response.json({
      data: { subscriber: serializeSubscriber(subscriber) },
      message: "This email is already unsubscribed.",
      subscriber: serializeSubscriber(subscriber),
      success: true,
    });
    return;
  }

  await subscriber.update({ isSubscribed: false });

  response.json({
    data: { subscriber: serializeSubscriber(subscriber) },
    message: "Newsletter subscription cancelled successfully.",
    subscriber: serializeSubscriber(subscriber),
    success: true,
  });
});

export const listSubscribers = asyncHandler(async (request, response) => {
  const { limit, offset, page } = getPagination(request.query);
  const search = cleanString(request.query.search || request.query.query);
  const where = {};

  if (request.query.isSubscribed !== undefined) {
    where.isSubscribed = normalizeBoolean(request.query.isSubscribed);
  } else if (request.query.status && request.query.status !== "all") {
    where.isSubscribed = normalizeBoolean(request.query.status);
  }

  if (search) {
    where[Op.or] = [{ email: { [Op.like]: `%${search}%` } }, { fullName: { [Op.like]: `%${search}%` } }];
  }

  const { count, rows } = await NewsletterSubscriber.findAndCountAll({
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    where,
  });
  const subscribers = rows.map(serializeSubscriber);
  const pagination = {
    limit,
    page,
    pages: Math.max(Math.ceil(count / limit), 1),
    total: count,
  };

  response.json({
    data: { pagination, subscribers },
    pagination,
    subscribers,
    success: true,
  });
});

export const deleteSubscriber = asyncHandler(async (request, response) => {
  const deleted = await NewsletterSubscriber.destroy({ where: { id: request.params.id } });
  if (!deleted) throw new ApiError(404, "Newsletter subscriber not found.");

  response.json({
    data: { id: request.params.id },
    deleted: true,
    message: "Newsletter subscriber deleted successfully.",
    success: true,
  });
});
