import { apiDelete, apiGet, apiPatch, apiPost } from "../api/axios";

export function getPublishedEvents(params = {}) {
  return apiGet("/events", { params });
}

export function getEventBySlug(slug) {
  return apiGet(`/events/${slug}`);
}

export function getAllEvents(params = {}) {
  return apiGet("/events/admin/all", { params });
}

export function createEvent(payload) {
  return apiPost("/events", payload);
}

export function updateEvent(id, payload) {
  return apiPatch(`/events/${id}`, payload);
}

export function publishEvent(id, isPublished) {
  return apiPatch(`/events/${id}/publish`, { isPublished });
}

export function deleteEvent(id) {
  return apiDelete(`/events/${id}`);
}
