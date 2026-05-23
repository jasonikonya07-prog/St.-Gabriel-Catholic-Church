import { adminApi } from "./adminApi";
import { getAuditLogs as getRootAuditLogs, getSecurityEvents as getRootSecurityEvents } from "../../services/auditService";

export async function getSecurityOverview() {
  return adminApi.get("/security/overview");
}

export async function getAuditLogs(params = {}) {
  return getRootAuditLogs(params);
}

export async function getSecurityEvents(params = {}) {
  return getRootSecurityEvents(params);
}

export async function getFailedLoginAttempts(params = {}) {
  return adminApi.get("/security/failed-logins", { params });
}
