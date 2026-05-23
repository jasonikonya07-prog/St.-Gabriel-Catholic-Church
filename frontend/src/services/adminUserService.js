import { adminGet, adminPatch } from "../api/axios";

export function getAdminUsers(params = {}) {
  return adminGet("/admin-users", { params });
}

export function updateAdminUser(id, payload) {
  return adminPatch(`/admin-users/${encodeURIComponent(id)}`, payload);
}
