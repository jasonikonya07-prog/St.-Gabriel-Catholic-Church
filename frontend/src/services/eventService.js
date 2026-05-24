import { adminDelete, adminGet, adminPatch, adminPost, publicGet } from "../api/axios";

export function getPublishedEvents(params = {}) {
  return publicGet("/events", { params });
}

export function getEventBySlug(slug) {
  return publicGet(`/events/${slug}`);
}

export function getAllEvents(params = {}) {
  return adminGet("/events/admin/all", { params });
}

export function createEvent(payload) {
  return adminPost("/events", payload);
}

export function updateEvent(id, payload) {
  return adminPatch(`/events/${id}`, payload);
}

export function publishEvent(id, isPublished) {
  return adminPatch(`/events/${id}/publish`, { isPublished });
}

export function deleteEvent(id) {
  return adminDelete(`/events/${id}`);
}
