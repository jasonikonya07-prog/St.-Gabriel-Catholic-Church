import { adminApi } from "./adminApi";
import { adminModules, adminStats, attendanceTrend, donationTrend, givingBreakdown } from "../data/adminData";

export async function getDashboardStats() {
  return adminApi.get("/dashboard/stats");
}

export async function getDashboardSummary() {
  return {
    attendanceTrend,
    donationTrend,
    givingBreakdown,
    modules: adminModules,
    stats: adminStats,
  };
}
