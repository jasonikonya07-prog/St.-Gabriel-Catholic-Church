import { adminDelete, adminGet } from "../api/axios";

export async function getAuditLogs(params = {}) {
  return adminGet("/audit-logs", { params });
}

export async function getSecurityEvents(params = {}) {
  return adminGet("/security-events", { params });
}

export async function deleteAuditLog(id) {
  return adminDelete(`/audit-logs/${encodeURIComponent(id)}`);
}

export async function deleteSecurityEvent(id) {
  return adminDelete(`/security-events/${encodeURIComponent(id)}`);
}
