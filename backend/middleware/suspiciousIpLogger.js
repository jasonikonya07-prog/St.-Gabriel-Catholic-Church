import { writeAuditLog } from "../utils/audit.js";
import { getClientIp } from "../utils/requestMeta.js";

const requestBuckets = new Map();
const windowMs = Number(process.env.SUSPICIOUS_IP_WINDOW_MS || 60 * 1000);
const requestThreshold = Number(process.env.SUSPICIOUS_IP_THRESHOLD || 120);

export function suspiciousIpLogger(request, response, next) {
  const ipAddress = getClientIp(request) || "unknown";
  const now = Date.now();
  const current = requestBuckets.get(ipAddress) || { count: 0, loggedAt: 0, startedAt: now };

  if (now - current.startedAt > windowMs) {
    current.count = 0;
    current.startedAt = now;
  }

  current.count += 1;

  if (current.count === requestThreshold || (current.count > requestThreshold && now - current.loggedAt > windowMs)) {
    current.loggedAt = now;
    console.warn(`Suspicious request volume from ${ipAddress}: ${current.count} requests in ${windowMs}ms`);
    writeAuditLog({
      action: "security.suspicious_ip",
      actorType: "public",
      metadata: {
        count: current.count,
        path: request.originalUrl,
        windowMs,
      },
      request,
    });
  }

  requestBuckets.set(ipAddress, current);
  next();
}
