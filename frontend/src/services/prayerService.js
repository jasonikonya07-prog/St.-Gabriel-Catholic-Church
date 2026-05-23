import { adminDelete, adminGet, adminPatch, userPost } from "../api/axios";

export function submitPrayerRequest(payload) {
  return userPost("/prayers", {
    category: payload.category || "Private Request",
    contact: payload.contact,
    fullName: payload.fullName || payload.name,
    isPrivate: Boolean(payload.isPrivate),
    message: payload.message,
  });
}

export function getPrayerRequests(params = {}) {
  return adminGet("/prayers", { params });
}

export function getPrayerRequest(id) {
  return adminGet(`/prayers/${id}`);
}

export function updatePrayerStatus(id, payload) {
  return adminPatch(`/prayers/${id}/status`, payload);
}

export function deletePrayerRequest(id) {
  return adminDelete(`/prayers/${id}`);
}
