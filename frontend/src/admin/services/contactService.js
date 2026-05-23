import { adminApi } from "./adminApi";

export async function getContactMessages(params = {}) {
  return adminApi.get("/contact", { params });
}

export async function getContactMessage(id) {
  return adminApi.get(`/contact/${id}`);
}

export async function updateContactMessageStatus(id, status) {
  return adminApi.patch(`/contact/${id}/status`, { status });
}

export async function deleteContactMessage(id) {
  return adminApi.delete(`/contact/${id}`);
}

export const contactService = {
  delete: deleteContactMessage,
  get: getContactMessage,
  list: getContactMessages,
  updateStatus: updateContactMessageStatus,
};
