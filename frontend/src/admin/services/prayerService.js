import { adminApi } from "./adminApi";

export async function getPrayerRequests(params = {}) {
  return adminApi.get("/prayers", { params });
}

export async function getPrayerRequest(id) {
  return adminApi.get(`/prayers/${id}`);
}

export async function updatePrayerStatus(id, payload) {
  return adminApi.patch(`/prayers/${id}/status`, payload);
}

export async function deletePrayerRequest(id) {
  return adminApi.delete(`/prayers/${id}`);
}

export const prayerService = {
  delete: deletePrayerRequest,
  get: getPrayerRequest,
  list: getPrayerRequests,
  updateStatus: updatePrayerStatus,
};
