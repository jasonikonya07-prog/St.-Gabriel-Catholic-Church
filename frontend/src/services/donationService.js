import { adminDelete, adminGet, adminPatch, publicGet, userPost } from "../api/axios";

function withDataFields(response) {
  return response?.data && typeof response.data === "object" ? { ...response, ...response.data } : response;
}

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
  return userPost("/donations", normalizeDonationPayload(payload)).then(withDataFields);
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
  }).then(withDataFields);
}

export function getMpesaPaymentStatus(checkoutRequestId) {
  return publicGet(`/donations/mpesa/status/${checkoutRequestId}`).then(withDataFields);
}

export function verifyDonation(transactionCode) {
  return publicGet(`/donations/verify/${transactionCode}`).then(withDataFields);
}

export function getDonations(params = {}) {
  return adminGet("/donations", { params }).then(withDataFields);
}

export function getDonation(id) {
  return adminGet(`/donations/${id}`).then(withDataFields);
}

export function getDonationStats() {
  return adminGet("/donations/stats").then(withDataFields);
}

export function updateDonationStatus(id, payload) {
  return adminPatch(`/donations/${id}/status`, typeof payload === "string" ? { status: payload } : payload).then(withDataFields);
}

export function deleteDonation(id) {
  return adminDelete(`/donations/${id}`);
}
