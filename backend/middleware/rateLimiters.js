import rateLimit from "express-rate-limit";

const DEFAULT_WINDOW_MINUTES = 15;

function minutesToMs(minutes = DEFAULT_WINDOW_MINUTES) {
  const value = Number(minutes);
  return Number.isFinite(value) && value > 0 ? value * 60 * 1000 : DEFAULT_WINDOW_MINUTES * 60 * 1000;
}

function readNumber(...values) {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return undefined;
}

function rateLimitResponse(message) {
  return (request, response) => {
    response.status(429).json({
      message,
      requestId: request.id || undefined,
      status: "fail",
      success: false,
    });
  };
}

export const globalLimiter = rateLimit({
  handler: rateLimitResponse("Too many requests. Please try again later."),
  legacyHeaders: false,
  limit: readNumber(process.env.RATE_LIMIT_MAX_REQUESTS, process.env.RATE_LIMIT_MAX, 300),
  standardHeaders: true,
  windowMs: readNumber(process.env.RATE_LIMIT_WINDOW_MS, minutesToMs(process.env.RATE_LIMIT_WINDOW_MINUTES)),
});

export const loginLimiter = rateLimit({
  handler: rateLimitResponse("Too many login attempts. Please try again later."),
  legacyHeaders: false,
  limit: readNumber(process.env.LOGIN_RATE_LIMIT_MAX, process.env.AUTH_RATE_LIMIT_MAX, 5),
  standardHeaders: true,
  windowMs: readNumber(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, process.env.AUTH_RATE_LIMIT_WINDOW_MS, minutesToMs(process.env.RATE_LIMIT_WINDOW_MINUTES)),
});

export const publicFormLimiter = rateLimit({
  handler: rateLimitResponse("Too many form submissions. Please wait a moment and try again."),
  legacyHeaders: false,
  limit: readNumber(process.env.PUBLIC_FORM_RATE_LIMIT_MAX, 20),
  standardHeaders: true,
  windowMs: readNumber(process.env.PUBLIC_FORM_RATE_LIMIT_WINDOW_MS, minutesToMs(process.env.RATE_LIMIT_WINDOW_MINUTES)),
});

export const mpesaLimiter = rateLimit({
  handler: rateLimitResponse("Too many payment requests. Please wait a moment and try again."),
  legacyHeaders: false,
  limit: readNumber(process.env.MPESA_RATE_LIMIT_MAX, 10),
  standardHeaders: true,
  windowMs: readNumber(process.env.MPESA_RATE_LIMIT_WINDOW_MS, minutesToMs(process.env.RATE_LIMIT_WINDOW_MINUTES)),
});

export const apiLimiter = globalLimiter;
export const authLimiter = loginLimiter;
