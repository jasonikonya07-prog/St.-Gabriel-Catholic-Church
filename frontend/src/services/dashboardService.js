import { adminGet } from "../api/axios";

export function getDashboardStats() {
  return adminGet("/dashboard/stats");
}
