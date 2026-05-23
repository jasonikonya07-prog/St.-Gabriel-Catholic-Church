import { col, fn, Op } from "sequelize";
import ApiError from "../utils/ApiError.js";
import { Donation } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";
import { logAudit } from "../utils/securityLogger.js";
import { sendDonationConfirmationEmail } from "../utils/sendEmail.js";

const donationPurposes = ["Tithe", "Church Development", "Charity", "Youth Ministry", "Mass Offering", "Other"];
const paymentMethods = ["M-Pesa", "Card", "Bank Transfer"];
const donationStatuses = ["pending", "completed", "failed", "cancelled"];

function cleanString(value) {
  return String(value || "").trim();
}

function normalizePurpose(value) {
  const purpose = cleanString(value);
  const purposeAliases = {
    "Building Fund": "Church Development",
    "Charity Support": "Charity",
    "Sunday Offering": "Other",
    "Thanksgiving Offering": "Other",
  };

  return purposeAliases[purpose] || purpose;
}

function normalizePaymentMethod(value) {
  const method = cleanString(value);
  const methodAliases = {
    "Airtel Money": "M-Pesa",
    "Card Payment": "Card",
    "M-Pesa STK Push": "M-Pesa",
    Safaricom: "M-Pesa",
  };

  return methodAliases[method] || method;
}

function normalizeStatus(value, fallback = "pending") {
  const status = cleanString(value || fallback).toLowerCase();
  const statusAliases = {
    Cancelled: "cancelled",
    Completed: "completed",
    Failed: "failed",
    Pending: "pending",
  };

  return statusAliases[value] || status;
}

function validateEmail(email) {
  return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function makeTransactionCode() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SGC-${date}-${random}`;
}

async function makeUniqueTransactionCode(providedCode = "", ignoreId = null) {
  let transactionCode = cleanString(providedCode).toUpperCase();

  if (!transactionCode) {
    transactionCode = makeTransactionCode();
  }

  let candidate = transactionCode;
  let counter = 2;

  while (await Donation.findOne({ where: ignoreId ? { id: { [Op.ne]: ignoreId }, transactionCode: candidate } : { transactionCode: candidate } })) {
    candidate = `${transactionCode}-${counter}`;
    counter += 1;
  }

  return candidate;
}

function buildDonationPayload(body) {
  const amount = Number(body.amount);
  const email = cleanString(body.email).toLowerCase() || null;
  const paymentMethod = normalizePaymentMethod(body.paymentMethod);
  const purpose = normalizePurpose(body.purpose);
  const status = normalizeStatus(body.status, "pending");

  if (!cleanString(body.donorName)) throw new ApiError(400, "Donor name is required.");
  if (!cleanString(body.phone)) throw new ApiError(400, "Phone number is required.");
  if (!Number.isFinite(amount) || amount <= 0) throw new ApiError(400, "Donation amount must be greater than zero.");
  if (!donationPurposes.includes(purpose)) throw new ApiError(400, "Invalid donation purpose.");
  if (!paymentMethods.includes(paymentMethod)) throw new ApiError(400, "Invalid payment method.");
  if (!donationStatuses.includes(status)) throw new ApiError(400, "Invalid donation status.");
  if (!validateEmail(email)) throw new ApiError(400, "Please enter a valid email address.");

  return {
    amount,
    checkoutRequestId: cleanString(body.checkoutRequestId) || null,
    donorName: cleanString(body.donorName),
    email,
    message: cleanString(body.message) || null,
    mpesaReceiptNumber: cleanString(body.mpesaReceiptNumber || body.mpesaReceipt) || null,
    paymentMethod,
    phone: cleanString(body.phone),
    purpose,
    status,
    transactionCode: cleanString(body.transactionCode),
  };
}

function buildListWhere(request) {
  const search = cleanString(request.query.search || request.query.query);
  const status = normalizeStatus(request.query.status, "");
  const purpose = normalizePurpose(request.query.purpose);
  const paymentMethod = normalizePaymentMethod(request.query.paymentMethod);
  const where = {};

  if (status && status !== "all") {
    if (!donationStatuses.includes(status)) throw new ApiError(400, "Invalid donation status.");
    where.status = status;
  }

  if (purpose && purpose !== "all") {
    if (!donationPurposes.includes(purpose)) throw new ApiError(400, "Invalid donation purpose.");
    where.purpose = purpose;
  }

  if (paymentMethod && paymentMethod !== "all") {
    if (!paymentMethods.includes(paymentMethod)) throw new ApiError(400, "Invalid payment method.");
    where.paymentMethod = paymentMethod;
  }

  if (search) {
    where[Op.or] = [
      { donorName: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
      { transactionCode: { [Op.like]: `%${search}%` } },
    ];
  }

  return where;
}

export const createDonation = asyncHandler(async (request, response) => {
  const payload = buildDonationPayload(request.body);
  const donation = await Donation.create({
    ...payload,
    transactionCode: await makeUniqueTransactionCode(payload.transactionCode),
    userId: request.user?.id || null,
  });

  if (donation.status === "completed") {
    sendDonationConfirmationEmail(donation).catch((error) => {
      console.error("Donation confirmation email failed:", error.message);
    });
  }

  response.status(201).json({
    data: { donation },
    donation,
    message: "Donation record created successfully.",
    success: true,
  });
});

export const verifyDonation = asyncHandler(async (request, response) => {
  const transactionCode = cleanString(request.params.transactionCode).toUpperCase();
  const donation = await Donation.findOne({ where: { transactionCode } });

  if (!donation) throw new ApiError(404, "Donation was not found for this transaction code.");

  response.json({
    data: { donation },
    donation,
    success: true,
  });
});

export const listDonations = asyncHandler(async (request, response) => {
  const { limit, offset, page } = getPagination(request.query);
  const where = buildListWhere(request);
  const { count, rows } = await Donation.findAndCountAll({
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
    data: { donations: rows, pagination },
    donations: rows,
    pagination,
    success: true,
  });
});

export const getDonation = asyncHandler(async (request, response) => {
  const donation = await Donation.findByPk(request.params.id);
  if (!donation) throw new ApiError(404, "Donation not found.");

  response.json({
    data: { donation },
    donation,
    success: true,
  });
});

export const updateDonationStatus = asyncHandler(async (request, response) => {
  const donation = await Donation.findByPk(request.params.id);
  if (!donation) throw new ApiError(404, "Donation not found.");

  const wasCompleted = donation.status === "completed";
  const previousStatus = donation.status;
  const status = normalizeStatus(request.body.status, donation.status);

  if (!donationStatuses.includes(status)) throw new ApiError(400, "Invalid donation status.");

  donation.status = status;
  donation.transactionCode =
    request.body.transactionCode === undefined
      ? donation.transactionCode
      : await makeUniqueTransactionCode(request.body.transactionCode, donation.id);
  donation.checkoutRequestId = request.body.checkoutRequestId ?? donation.checkoutRequestId;
  donation.mpesaReceiptNumber = request.body.mpesaReceiptNumber ?? request.body.mpesaReceipt ?? donation.mpesaReceiptNumber;
  await donation.save();

  await logAudit({
    action: "donation.status_updated",
    actorEmail: request.admin?.email,
    actorId: request.admin?.id,
    actorType: "admin",
    description: "Admin updated a donation status.",
    details: {
      donationId: donation.id,
      newStatus: donation.status,
      previousStatus,
      transactionCode: donation.transactionCode,
    },
    entity: "donation",
    entityId: donation.id,
    module: "donations",
    request,
  });

  if (!wasCompleted && donation.status === "completed") {
    sendDonationConfirmationEmail(donation).catch((error) => {
      console.error("Donation confirmation email failed:", error.message);
    });
  }

  response.json({
    data: { donation },
    donation,
    message: "Donation status updated successfully.",
    success: true,
  });
});

export const deleteDonation = asyncHandler(async (request, response) => {
  const deleted = await Donation.destroy({ where: { id: request.params.id } });
  if (!deleted) throw new ApiError(404, "Donation not found.");

  response.json({
    data: { id: request.params.id },
    deleted: true,
    message: "Donation deleted successfully.",
    success: true,
  });
});

export const donationStats = asyncHandler(async (request, response) => {
  const [totalAmount, completedAmount, pendingAmount, totalCount, completedCount, pendingCount, byPurpose] =
    await Promise.all([
      Donation.sum("amount"),
      Donation.sum("amount", { where: { status: "completed" } }),
      Donation.sum("amount", { where: { status: "pending" } }),
      Donation.count(),
      Donation.count({ where: { status: "completed" } }),
      Donation.count({ where: { status: "pending" } }),
      Donation.findAll({
        attributes: ["purpose", [fn("SUM", col("amount")), "total"]],
        group: ["purpose"],
        raw: true,
      }),
    ]);

  response.json({
    data: {
      byPurpose,
      completedAmount: Number(completedAmount || 0),
      completedCount,
      pendingAmount: Number(pendingAmount || 0),
      pendingCount,
      totalAmount: Number(totalAmount || 0),
      totalCount,
    },
    stats: {
      byPurpose,
      completedAmount: Number(completedAmount || 0),
      completedCount,
      pendingAmount: Number(pendingAmount || 0),
      pendingCount,
      totalAmount: Number(totalAmount || 0),
      totalCount,
    },
    success: true,
  });
});
