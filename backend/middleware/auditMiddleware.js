import { logAudit, logSecurityEvent } from "../utils/securityLogger.js";

const mutationMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function classifyAdminAction(request) {
  if (request.method === "DELETE") {
    return {
      action: "admin.deleted_data",
      description: "Admin deleted data.",
      eventType: "admin.deleted_data",
      severity: "medium",
    };
  }

  if (request.originalUrl.includes("/settings")) {
    return {
      action: "admin.updated_settings",
      description: "Admin updated website settings.",
      eventType: "admin.updated_settings",
      severity: "low",
    };
  }

  return {
    action: "admin.api_mutation",
    description: "Admin performed a protected data mutation.",
    eventType: null,
    severity: "low",
  };
}

function getBodyKeys(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return [];
  return Object.keys(body).filter((key) => !["password", "token", "accessToken", "refreshToken"].includes(key));
}

export function auditAdminMutations(request, response, next) {
  response.on("finish", () => {
    if (!request.admin || !mutationMethods.has(request.method) || response.statusCode >= 400) return;

    const classification = classifyAdminAction(request);
    const details = {
      bodyKeys: getBodyKeys(request.body),
      method: request.method,
      path: request.originalUrl,
      statusCode: response.statusCode,
    };

    logAudit({
      action: classification.action,
      actorEmail: request.admin.email,
      actorId: request.admin.id,
      actorType: "admin",
      description: classification.description,
      details,
      entity: request.baseUrl || request.path,
      module: "admin",
      request,
    });

    if (classification.eventType) {
      logSecurityEvent({
        details,
        email: request.admin.email,
        eventType: classification.eventType,
        request,
        severity: classification.severity,
      });
    }
  });

  next();
}
