export function getClientIp(request) {
  const forwardedFor = String(request.headers["x-forwarded-for"] || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)[0];

  return forwardedFor || request.ip || request.socket?.remoteAddress || "";
}

export function getUserAgent(request) {
  return String(request.headers["user-agent"] || "").slice(0, 500);
}

export function getRequestMeta(request) {
  return {
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  };
}
