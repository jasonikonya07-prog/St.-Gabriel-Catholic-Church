import ApiError from "../utils/ApiError.js";
import Donation, { donationPurposes, donationStatuses, paymentMethods } from "../models/Donation.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";
import { logAudit } from "../utils/securityLogger.js";
import { sendDonationConfirmationEmail } from "../utils/sendEmail.js";

function cleanString(value) {
  return String(value || "").trim();
}

function escapeRegExp(value) {
  return cleanString(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
  const text = cleanString(value || fallback);
  const statusAliases = {
    Cancelled: "cancelled",
    Completed: "completed",
    Failed: "failed",
    Pending: "pending",
  };

  return statusAliases[text] || text.toLowerCase();
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
  const base = cleanString(providedCode).toUpperCase() || makeTransactionCode();
  let candidate = base;
  let counter = 2;
  const idFilter = ignoreId ? { id: { $ne: String(ignoreId) } } : {};

  while (await Donation.exists({ ...idFilter, transactionCode: candidate })) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }

  return candidate;
}

function buildDonationPayload(body, { allowStatus = false } = {}) {
  const amount = Number(body.amount);
  const email = cleanString(body.email).toLowerCase() || null;
  const paymentMethod = normalizePaymentMethod(body.paymentMethod);
  const purpose = normalizePurpose(body.purpose);
  const status = allowStatus ? normalizeStatus(body.status, "pending") : "pending";

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

function buildDonationFilter(query) {
  const search = cleanString(query.search || query.query);
  const status = normalizeStatus(query.status, "");
  const purpose = normalizePurpose(query.purpose);
  const paymentMethod = normalizePaymentMethod(query.paymentMethod);
  const filter = {};

  if (status && status !== "all") {
    if (!donationStatuses.includes(status)) throw new ApiError(400, "Invalid donation status.");
    filter.status = status;
  }

  if (purpose && purpose !== "all") {
    if (!donationPurposes.includes(purpose)) throw new ApiError(400, "Invalid donation purpose.");
    filter.purpose = purpose;
  }

  if (paymentMethod && paymentMethod !== "all") {
    if (!paymentMethods.includes(paymentMethod)) throw new ApiError(400, "Invalid payment method.");
    filter.paymentMethod = paymentMethod;
  }

  if (search) {
    const regex = new RegExp(escapeRegExp(search), "i");
    filter.$or = [{ donorName: regex }, { phone: regex }, { email: regex }, { transactionCode: regex }];
  }

  return filter;
}

function paginationMeta(count, limit, page) {
  return {
    limit,
    page,
    pages: Math.max(Math.ceil(count / limit), 1),
    total: count,
  };
}

async function sendCompletedDonationEmail(donation, context) {
  if (donation.status !== "completed") return;

  sendDonationConfirmationEmail(donation).catch((error) => {
    console.error(`${context} donation confirmation email failed:`, error.message);
  });
}

export const createDonation = asyncHandler(async (request, response) => {
  const payload = buildDonationPayload(request.body);
  const donation = await Donation.create({
    ...payload,
    transactionCode: await makeUniqueTransactionCode(payload.transactionCode),
    userId: request.user?.id || null,
  });

  await sendCompletedDonationEmail(donation, "Public");

  response.status(201).json({
    data: { donation },
    donation,
    message: "Donation record created successfully.",
    success: true,
  });
});

export const verifyDonation = asyncHandler(async (request, response) => {
  const transactionCode = cleanString(request.params.transactionCode).toUpperCase();
  const donation = await Donation.findOne({ transactionCode });

  if (!donation) throw new ApiError(404, "Donation was not found for this transaction code.");

  response.json({
    data: { donation },
    donation,
    success: true,
  });
});

export const listDonations = asyncHandler(async (request, response) => {
  const { limit, offset, page } = getPagination(request.query);
  const filter = buildDonationFilter(request.query);
  const [count, donations] = await Promise.all([
    Donation.countDocuments(filter),
    Donation.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit),
  ]);
  const pagination = paginationMeta(count, limit, page);

  response.json({
    data: { donations, pagination },
    donations,
    pagination,
    success: true,
  });
});

export const getDonation = asyncHandler(async (request, response) => {
  const donation = await Donation.findOne({ id: String(request.params.id) });
  if (!donation) throw new ApiError(404, "Donation not found.");

  response.json({
    data: { donation },
    donation,
    success: true,
  });
});

export const updateDonationStatus = asyncHandler(async (request, response) => {
  const donation = await Donation.findOne({ id: String(request.params.id) });
  if (!donation) throw new ApiError(404, "Donation not found.");

  const previousStatus = donation.status;
  const previousTransactionCode = donation.transactionCode;
  const previousCheckoutRequestId = donation.checkoutRequestId;
  const previousMpesaReceiptNumber = donation.mpesaReceiptNumber;
  const wasCompleted = previousStatus === "completed";
  const status = normalizeStatus(request.body.status, donation.status);

  if (!donationStatuses.includes(status)) throw new ApiError(400, "Invalid donation status.");

  donation.status = status;
  donation.transactionCode =
    request.body.transactionCode === undefined
      ? donation.transactionCode
      : await makeUniqueTransactionCode(request.body.transactionCode, donation.id);
  donation.checkoutRequestId =
    request.body.checkoutRequestId === undefined ? donation.checkoutRequestId : cleanString(request.body.checkoutRequestId) || null;
  donation.mpesaReceiptNumber =
    request.body.mpesaReceiptNumber === undefined && request.body.mpesaReceipt === undefined
      ? donation.mpesaReceiptNumber
      : cleanString(request.body.mpesaReceiptNumber ?? request.body.mpesaReceipt) || null;
  donation.updatedBy = request.admin?.id || null;
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
      previousCheckoutRequestId,
      previousMpesaReceiptNumber,
      previousStatus,
      previousTransactionCode,
      checkoutRequestId: donation.checkoutRequestId,
      mpesaReceiptNumber: donation.mpesaReceiptNumber,
      transactionCode: donation.transactionCode,
    },
    entity: "donation",
    entityId: donation.id,
    module: "donations",
    request,
  });

  if (!wasCompleted && donation.status === "completed") {
    await sendCompletedDonationEmail(donation, "Admin");
  }

  response.json({
    data: { donation },
    donation,
    message: "Donation status updated successfully.",
    success: true,
  });
});

export const deleteDonation = asyncHandler(async (request, response) => {
  const donation = await Donation.findOneAndDelete({ id: String(request.params.id) });
  if (!donation) throw new ApiError(404, "Donation not found.");

  await logAudit({
    action: "donation.deleted",
    actorEmail: request.admin?.email,
    actorId: request.admin?.id,
    actorType: "admin",
    description: "Admin deleted a donation.",
    details: {
      amount: donation.amount,
      donationId: donation.id,
      donorName: donation.donorName,
      paymentMethod: donation.paymentMethod,
      purpose: donation.purpose,
      status: donation.status,
      transactionCode: donation.transactionCode,
    },
    entity: "donation",
    entityId: donation.id,
    module: "donations",
    request,
  });

  response.json({
    data: { id: request.params.id },
    deleted: true,
    message: "Donation deleted successfully.",
    success: true,
  });
});

export const donationStats = asyncHandler(async (request, response) => {
  const [amounts, counts, byPurpose] = await Promise.all([
    Donation.aggregate([
      {
        $group: {
          _id: "$status",
          totalAmount: { $sum: "$amount" },
        },
      },
    ]),
    Donation.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    Donation.aggregate([
      {
        $group: {
          _id: "$purpose",
          total: { $sum: "$amount" },
        },
      },
      {
        $project: {
          _id: 0,
          purpose: "$_id",
          total: 1,
        },
      },
      { $sort: { purpose: 1 } },
    ]),
  ]);

  const amountByStatus = new Map(amounts.map((item) => [item._id, Number(item.totalAmount || 0)]));
  const countByStatus = new Map(counts.map((item) => [item._id, Number(item.count || 0)]));
  const totalAmount = amounts.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
  const totalCount = counts.reduce((sum, item) => sum + Number(item.count || 0), 0);
  const stats = {
    byPurpose,
    completedAmount: amountByStatus.get("completed") || 0,
    completedCount: countByStatus.get("completed") || 0,
    pendingAmount: amountByStatus.get("pending") || 0,
    pendingCount: countByStatus.get("pending") || 0,
    totalAmount,
    totalCount,
  };

  response.json({
    data: stats,
    stats,
    success: true,
  });
});
