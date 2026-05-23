import { FailedLoginAttempt } from "../models/index.js";
import { getRequestMeta } from "./requestMeta.js";
import { logAudit } from "./securityLogger.js";

export async function writeAuditLog({
  action,
  actorEmail = null,
  actorId = null,
  actorType = "system",
  description = null,
  entity = null,
  entityId = null,
  metadata = null,
  module = "system",
  request = null,
}) {
  await logAudit({
    action,
    actorEmail,
    actorId,
    actorType,
    description,
    details: metadata,
    entity,
    entityId,
    module,
    request,
  });
}

export async function recordFailedLogin({ email, reason, request, scope }) {
  const requestMeta = getRequestMeta(request);

  try {
    await FailedLoginAttempt.create({
      email,
      ipAddress: requestMeta.ipAddress || null,
      reason,
      scope,
      userAgent: requestMeta.userAgent || null,
    });
  } catch (error) {
    console.error("Failed-login audit write failed:", error.message);
  }

  await writeAuditLog({
    action: `${scope}.login_failed`,
    actorEmail: email,
    actorType: scope,
    description: `${scope} login failed: ${reason}`,
    metadata: { reason },
    module: "authentication",
    request,
  });
}
