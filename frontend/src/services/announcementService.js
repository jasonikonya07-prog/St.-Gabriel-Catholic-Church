import { apiDelete, apiGet, apiPatch, apiPost } from "../api/axios";

export function getPublishedAnnouncements(params = {}) {
  return apiGet("/announcements", { params });
}

export function getAnnouncementBySlug(slug) {
  return apiGet(`/announcements/${slug}`);
}

export function getAllAnnouncements(params = {}) {
  return apiGet("/announcements/admin/all", { params });
}

export function createAnnouncement(payload) {
  return apiPost("/announcements", payload);
}

export function updateAnnouncement(id, payload) {
  return apiPatch(`/announcements/${id}`, payload);
}

export function publishAnnouncement(id, isPublished) {
  return apiPatch(`/announcements/${id}/publish`, { isPublished });
}

export function deleteAnnouncement(id) {
  return apiDelete(`/announcements/${id}`);
}
