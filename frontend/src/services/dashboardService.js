import { apiGet } from "../api/axios";

export function getDashboardStats() {
  return apiGet("/dashboard/stats");
}
