import { Op } from "../utils/mongoQuery.js";
import ApiError from "../utils/ApiError.js";
import { ContactMessage } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";
import { logAudit } from "../utils/securityLogger.js";
import { sendContactMessageNotification } from "../utils/sendEmail.js";

const allowedStatuses = ["unread", "read", "replied"];

function cleanString(value) {
  return String(value || "").trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const createContactMessage = asyncHandler(async (request, response) => {
  const fullName = cleanString(request.body.fullName || request.body.name);
  const email = cleanString(request.body.email).toLowerCase();
  const phone = cleanString(request.body.phone);
  const subject = cleanString(request.body.subject) || "Website inquiry";
  const message = cleanString(request.body.message);

  if (!fullName || !email || !message) {
    throw new ApiError(400, "Full name, email, and message are required.");
  }

  if (!isValidEmail(email)) {
    throw new ApiError(400, "Please enter a valid email address.");
  }

  const contactMessage = await ContactMessage.create({
    email,
    fullName,
    message,
    phone: phone || null,
    subject,
    userId: request.user?.id || null,
  });

  sendContactMessageNotification(contactMessage).catch((error) => {
    console.error("Contact email notification failed:", error.message);
  });

  response.status(201).json({
    contactMessage,
    data: { contactMessage },
    message: "Contact message submitted successfully.",
    success: true,
  });
});

export const listContactMessages = asyncHandler(async (request, response) => {
  const search = cleanString(request.query.search || request.query.query);
  const status = cleanString(request.query.status);
  const { limit, offset, page } = getPagination(request.query);
  const where = {};

  if (status && status !== "all") {
    if (!allowedStatuses.includes(status)) {
      throw new ApiError(400, "Invalid contact message status.");
    }

    where.status = status;
  }

  if (search) {
    where[Op.or] = [
      { fullName: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { subject: { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await ContactMessage.findAndCountAll({
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    where,
  });

  response.json({
    data: {
      messages: rows,
      pagination: {
        limit,
        page,
        pages: Math.max(Math.ceil(count / limit), 1),
        total: count,
      },
    },
    messages: rows,
    pagination: {
      limit,
      page,
      pages: Math.max(Math.ceil(count / limit), 1),
      total: count,
    },
    success: true,
  });
});

export const getContactMessage = asyncHandler(async (request, response) => {
  const contactMessage = await ContactMessage.findByPk(request.params.id);
  if (!contactMessage) throw new ApiError(404, "Contact message not found.");

  response.json({
    contactMessage,
    data: { contactMessage },
    success: true,
  });
});

export const updateContactStatus = asyncHandler(async (request, response) => {
  const contactMessage = await ContactMessage.findByPk(request.params.id);
  if (!contactMessage) throw new ApiError(404, "Contact message not found.");

  const status = cleanString(request.body.status || contactMessage.status);

  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, "Invalid contact message status.");
  }

  contactMessage.status = status;
  contactMessage.adminNotes = request.body.adminNotes === undefined ? contactMessage.adminNotes : cleanString(request.body.adminNotes);
  await contactMessage.save();

  response.json({
    contactMessage,
    data: { contactMessage },
    message: "Contact message updated successfully.",
    success: true,
  });
});

export const deleteContactMessage = asyncHandler(async (request, response) => {
  const contactMessage = await ContactMessage.findByPk(request.params.id);
  if (!contactMessage) throw new ApiError(404, "Contact message not found.");

  await contactMessage.destroy();
  await logAudit({
    action: "contact_message.deleted",
    actorEmail: request.admin?.email,
    actorId: request.admin?.id,
    actorType: "admin",
    description: "Admin deleted a contact message.",
    details: {
      contactMessageId: contactMessage.id,
      status: contactMessage.status,
      subject: contactMessage.subject,
    },
    entity: "contact_message",
    entityId: contactMessage.id,
    module: "contact",
    request,
  });

  response.json({
    data: { id: request.params.id },
    message: "Contact message deleted successfully.",
    success: true,
  });
});
