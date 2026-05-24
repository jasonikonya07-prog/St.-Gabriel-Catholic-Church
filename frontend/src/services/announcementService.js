import { adminDelete, adminGet, adminPatch, adminPost, publicGet } from "../api/axios";

export function getPublishedAnnouncements(params = {}) {
  return publicGet("/announcements", { params });
}

export function getAnnouncementBySlug(slug) {
  return publicGet(`/announcements/${slug}`);
}

export function getAllAnnouncements(params = {}) {
  return adminGet("/announcements/admin/all", { params });
}

export function createAnnouncement(payload) {
  return adminPost("/announcements", payload);
}

export function updateAnnouncement(id, payload) {
  return adminPatch(`/announcements/${id}`, payload);
}

export function publishAnnouncement(id, isPublished) {
  return adminPatch(`/announcements/${id}/publish`, { isPublished });
}

export function deleteAnnouncement(id) {
  return adminDelete(`/announcements/${id}`);
}
