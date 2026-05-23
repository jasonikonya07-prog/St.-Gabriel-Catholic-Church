import { adminDelete, adminGet, adminPatch, userPost } from "../api/axios";

export function submitContactMessage(payload) {
  return userPost("/contact", {
    email: payload.email,
    fullName: payload.fullName || payload.name,
    message: payload.message,
    phone: payload.phone || undefined,
    subject: payload.subject || "Website inquiry",
  });
}

export function getContactMessages(params = {}) {
  return adminGet("/contact", { params });
}

export function getContactMessage(id) {
  return adminGet(`/contact/${id}`);
}

export function updateContactMessageStatus(id, payload) {
  return adminPatch(`/contact/${id}/status`, payload);
}

export function deleteContactMessage(id) {
  return adminDelete(`/contact/${id}`);
}
