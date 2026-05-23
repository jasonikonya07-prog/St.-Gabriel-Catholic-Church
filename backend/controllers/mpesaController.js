import ApiError from "../utils/ApiError.js";
import { Donation } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { formatMpesaPhone, initiateStkPush, parseStkCallback } from "../utils/mpesa.js";
import { sendDonationConfirmationEmail } from "../utils/sendEmail.js";

const donationPurposes = ["Tithe", "Church Development", "Charity", "Youth Ministry", "Mass Offering", "Other"];

function cleanString(value) {
  return String(value || "").trim();
}

function normalizePurpose(value) {
  const purpose = cleanString(value);
  const aliases = {
    "Building Fund": "Church Development",
    "Charity Support": "Charity",
    "Sunday Offering": "Other",
    "Thanksgiving Offering": "Other",
  };

  return aliases[purpose] || purpose;
}

function validateEmail(email) {
  return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function makeDonationReference() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SGC-MPESA-${date}-${random}`;
}

async function makeUniqueTransactionCode() {
  const base = makeDonationReference();
  let transactionCode = base;
  let counter = 2;

  while (await Donation.findOne({ where: { transactionCode } })) {
    transactionCode = `${base}-${counter}`;
    counter += 1;
  }

  return transactionCode;
}

function buildDonationPayload(body) {
  const amount = Number(body.amount);
  const email = cleanString(body.email).toLowerCase() || null;
  const purpose = normalizePurpose(body.purpose);

  if (!cleanString(body.donorName)) throw new ApiError(400, "Donor name is required.");
  if (!cleanString(body.phone)) throw new ApiError(400, "Phone number is required.");
  if (!Number.isFinite(amount) || amount <= 0) throw new ApiError(400, "Donation amount must be greater than zero.");
  if (!donationPurposes.includes(purpose)) throw new ApiError(400, "Invalid donation purpose.");
  if (!validateEmail(email)) throw new ApiError(400, "Please enter a valid email address.");

  return {
    amount,
    donorName: cleanString(body.donorName),
    email,
    message: cleanString(body.message) || null,
    phone: formatMpesaPhone(body.phone),
    purpose,
  };
}

export const sendStkPush = asyncHandler(async (request, response) => {
  const payload = buildDonationPayload(request.body);
  const donation = await Donation.create({
    ...payload,
    paymentMethod: "M-Pesa",
    status: "pending",
    transactionCode: await makeUniqueTransactionCode(),
    userId: request.user?.id || null,
  });

  try {
    const stkResponse = await initiateStkPush({
      amount: donation.amount,
      phone: donation.phone,
      reference: donation.transactionCode,
      transactionDescription: `${donation.purpose} donation`,
    });

    donation.checkoutRequestId = stkResponse.CheckoutRequestID;
    await donation.save();

    response.status(200).json({
      data: {
        checkoutRequestId: donation.checkoutRequestId,
        customerMessage: stkResponse.CustomerMessage,
        donation,
        transactionCode: donation.transactionCode,
      },
      message: "M-Pesa prompt sent. Please check your phone and enter your PIN.",
      success: true,
    });
  } catch (error) {
    donation.status = "failed";
    await donation.save();
    throw new ApiError(502, "We could not send the M-Pesa prompt. Please try again.", {
      reason: error.message,
      transactionCode: donation.transactionCode,
    });
  }
});

export const handleMpesaCallback = asyncHandler(async (request, response) => {
  const callback = parseStkCallback(request.body);

  console.log("M-Pesa callback received:", {
    checkoutRequestId: callback.checkoutRequestId,
    merchantRequestId: callback.merchantRequestId,
    resultCode: callback.resultCode,
  });

  if (!callback.checkoutRequestId) {
    throw new ApiError(400, "Invalid M-Pesa callback payload.");
  }

  const donation = await Donation.findOne({ where: { checkoutRequestId: callback.checkoutRequestId } });

  if (!donation) {
    console.warn("M-Pesa callback donation not found:", {
      checkoutRequestId: callback.checkoutRequestId,
      resultCode: callback.resultCode,
    });

    response.json({
      ResultCode: 0,
      ResultDesc: "Callback accepted.",
      success: true,
    });
    return;
  }

  const wasCompleted = donation.status === "completed";

  if (callback.resultCode === 0) {
    donation.status = "completed";
    donation.mpesaReceiptNumber = callback.mpesaReceiptNumber || donation.mpesaReceiptNumber;
    donation.amount = callback.amount || donation.amount;
    donation.phone = callback.phone || donation.phone;
  } else {
    donation.status = "failed";
  }

  await donation.save();

  if (!wasCompleted && donation.status === "completed") {
    sendDonationConfirmationEmail(donation).catch((error) => {
      console.error("M-Pesa donation confirmation email failed:", error.message);
    });
  }

  response.json({
    ResultCode: 0,
    ResultDesc: "Callback processed successfully.",
    data: {
      donationId: donation.id,
      status: donation.status,
      transactionCode: donation.transactionCode,
    },
    success: true,
  });
});

export const getMpesaStatus = asyncHandler(async (request, response) => {
  const checkoutRequestId = cleanString(request.params.checkoutRequestId);

  if (!checkoutRequestId) {
    throw new ApiError(400, "Checkout request ID is required.");
  }

  const donation = await Donation.findOne({ where: { checkoutRequestId } });

  if (!donation) {
    throw new ApiError(404, "Payment request was not found.");
  }

  response.json({
    amount: Number(donation.amount || 0),
    checkoutRequestId: donation.checkoutRequestId,
    donation,
    mpesaReceiptNumber: donation.mpesaReceiptNumber,
    paymentMethod: donation.paymentMethod,
    phone: donation.phone,
    purpose: donation.purpose,
    receiptNumber: donation.mpesaReceiptNumber || donation.transactionCode,
    status: donation.status,
    success: true,
    transactionCode: donation.transactionCode,
  });
});
