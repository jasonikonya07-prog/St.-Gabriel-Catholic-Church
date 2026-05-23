import { adminDelete, adminGet, adminPatch, publicGet, userPost } from "../api/axios";

function normalizeDonationPayload(payload) {
  return {
    amount: Number(payload.amount),
    donorName: payload.donorName || payload.fullName,
    email: payload.email || undefined,
    message: payload.message || undefined,
    paymentMethod: payload.paymentMethod || "M-Pesa",
    phone: payload.phone,
    purpose: payload.purpose || payload.givingType,
    status: payload.status || "pending",
    transactionCode: payload.transactionCode || undefined,
  };
}

export function createDonation(payload) {
  return userPost("/donations", normalizeDonationPayload(payload));
}

export function sendMpesaPrompt(payload) {
  return userPost("/donations/mpesa/stk-push", {
    amount: Number(payload.amount),
    donationId: payload.donationId || undefined,
    donorName: payload.donorName || payload.fullName,
    email: payload.email || undefined,
    message: payload.message || undefined,
    phone: payload.phone,
    purpose: payload.purpose || payload.givingType,
    transactionCode: payload.transactionCode || undefined,
  });
}

export function getMpesaPaymentStatus(checkoutRequestId) {
  return publicGet(`/donations/mpesa/status/${checkoutRequestId}`);
}

export function verifyDonation(transactionCode) {
  return publicGet(`/donations/verify/${transactionCode}`);
}

export function getDonations(params = {}) {
  return adminGet("/donations", { params });
}

export function getDonation(id) {
  return adminGet(`/donations/${id}`);
}

export function getDonationStats() {
  return adminGet("/donations/stats");
}

export function updateDonationStatus(id, payload) {
  return adminPatch(`/donations/${id}/status`, typeof payload === "string" ? { status: payload } : payload);
}

export function deleteDonation(id) {
  return adminDelete(`/donations/${id}`);
}
