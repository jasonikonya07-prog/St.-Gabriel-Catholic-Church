import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import morgan from "morgan";
import { nanoid } from "nanoid";
import { connectDB } from "./config/db.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import { auditLogRoutes, securityEventRoutes } from "./routes/auditRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import donationRoutes from "./routes/donationRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";
import prayerRoutes from "./routes/prayerRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import userAuthRoutes from "./routes/userAuthRoutes.js";
import ApiError from "./utils/ApiError.js";
import { getAllowedOrigins, isOriginAllowed } from "./utils/corsOrigins.js";
import { auditAdminMutations } from "./middleware/auditMiddleware.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import { maintenanceMiddleware } from "./middleware/maintenanceMiddleware.js";
import { globalLimiter, loginLimiter, mpesaLimiter, publicFormLimiter } from "./middleware/rateLimiters.js";
import { sanitizeBody } from "./middleware/validateMiddleware.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);
const apiPrefix = normalizeApiPrefix(process.env.API_PREFIX);
const apiMountPrefixes = getApiMountPrefixes(apiPrefix);
const bodyLimit = process.env.REQUEST_BODY_LIMIT || "100kb";
const isProduction = process.env.NODE_ENV === "production";

function normalizeApiPrefix(value) {
  const prefix = String(value || "/api")
    .trim()
    .replace(/^\/?/, "/")
    .replace(/\/+$/, "");

  return prefix || "/api";
}

function getApiMountPrefixes(prefix) {
  return [...new Set([prefix, ""])];
}

function apiPath(prefix, path) {
  if (!prefix) return path;
  if (path === "/") return prefix;
  return `${prefix}${path}`;
}

function corsWhitelist() {
  const allowedOrigins = getAllowedOrigins();

  return cors({
    allowedHeaders: ["Authorization", "Content-Type", "X-Requested-With", "X-Request-Id"],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    optionsSuccessStatus: 204,
    origin(origin, callback) {
      if (isOriginAllowed(origin, allowedOrigins)) {
        callback(null, true);
        return;
      }

      callback(new ApiError(403, "This origin is not allowed by CORS."));
    },
  });
}

function parseTrustProxy() {
  const value = String(process.env.TRUST_PROXY || "").trim().toLowerCase();
  if (!value && process.env.VERCEL === "1") return 1;
  if (["true", "1", "yes", "on"].includes(value)) return 1;
  if (["false", "0", "no", "off"].includes(value)) return false;
  return value || false;
}

function getCookieSecret() {
  return process.env.COOKIE_SECRET || process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || undefined;
}

function attachRequestId(request, response, next) {
  request.id = request.headers["x-request-id"] || nanoid(12);
  response.setHeader("X-Request-Id", request.id);
  next();
}

async function ensureDatabase(request, response, next) {
  if (request.method === "OPTIONS") {
    next();
    return;
  }

  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
}

morgan.token("id", (request) => request.id || "-");

app.set("trust proxy", parseTrustProxy());
app.disable("x-powered-by");
app.use(attachRequestId);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" }, hidePoweredBy: true }));
app.use(corsWhitelist());
app.use(compression());
app.use(hpp());
app.use(getCookieSecret() ? cookieParser(getCookieSecret()) : cookieParser());
app.use(express.json({ limit: bodyLimit, strict: true }));
app.use(express.urlencoded({ extended: false, limit: bodyLimit, parameterLimit: 50 }));
app.use(sanitizeBody);

app.use(globalLimiter);
apiMountPrefixes.forEach((prefix) => {
  app.post(apiPath(prefix, "/auth/login"), loginLimiter);
  app.post(apiPath(prefix, "/admin-auth/login"), loginLimiter);
  app.post(apiPath(prefix, "/user-auth/login"), loginLimiter);
  app.post(apiPath(prefix, "/user-auth/register"), loginLimiter);
  app.post(apiPath(prefix, "/contact"), publicFormLimiter);
  app.post(apiPath(prefix, "/prayers"), publicFormLimiter);
  app.post(apiPath(prefix, "/donations"), publicFormLimiter);
  app.post(apiPath(prefix, "/donations/mpesa/stk-push"), mpesaLimiter);
  app.post(apiPath(prefix, "/newsletter/subscribe"), publicFormLimiter);
  app.post(apiPath(prefix, "/newsletter/unsubscribe"), publicFormLimiter);
});

app.use(
  morgan(isProduction ? ":id :remote-addr :method :url :status :res[content-length] - :response-time ms" : ":id :method :url :status :response-time ms"),
);
app.use(auditAdminMutations);

app.get("/", (request, response) => {
  response.json({
    message: "St. Gabriel Church API",
    status: "ok",
    success: true,
  });
});

function healthCheck(request, response) {
  response.json({
    service: "St. Gabriel Church API",
    status: "ok",
    success: true,
    timestamp: new Date().toISOString(),
  });
}

function mountApiRoutes(prefix) {
  app.get(apiPath(prefix, "/health"), healthCheck);
  app.use(apiPath(prefix, "/auth"), ensureDatabase, authRoutes);
  app.use(apiPath(prefix, "/admin-auth"), ensureDatabase, adminAuthRoutes);
  app.use(apiPath(prefix, "/admin-users"), ensureDatabase, maintenanceMiddleware, adminUserRoutes);
  app.use(apiPath(prefix, "/user-auth"), ensureDatabase, maintenanceMiddleware, userAuthRoutes);
  app.use(apiPath(prefix, "/contact"), ensureDatabase, maintenanceMiddleware, contactRoutes);
  app.use(apiPath(prefix, "/prayers"), ensureDatabase, maintenanceMiddleware, prayerRoutes);
  app.use(apiPath(prefix, "/donations"), ensureDatabase, maintenanceMiddleware, donationRoutes);
  app.use(apiPath(prefix, "/announcements"), ensureDatabase, maintenanceMiddleware, announcementRoutes);
  app.use(apiPath(prefix, "/events"), ensureDatabase, maintenanceMiddleware, eventRoutes);
  app.use(apiPath(prefix, "/newsletter"), ensureDatabase, maintenanceMiddleware, newsletterRoutes);
  app.use(apiPath(prefix, "/settings"), ensureDatabase, maintenanceMiddleware, settingsRoutes);
  app.use(apiPath(prefix, "/dashboard"), ensureDatabase, maintenanceMiddleware, dashboardRoutes);
  app.use(apiPath(prefix, "/audit-logs"), ensureDatabase, maintenanceMiddleware, auditLogRoutes);
  app.use(apiPath(prefix, "/security-events"), ensureDatabase, maintenanceMiddleware, securityEventRoutes);
}

apiMountPrefixes.forEach(mountApiRoutes);

app.use(notFound);
app.use(errorHandler);

async function startServer() {
  await connectDB();

  const server = app.listen(port, () => {
    console.log(`St. Gabriel Church API running on http://localhost:${port}${apiPrefix}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Stop the other Node process or change PORT in backend/.env.`);
      process.exit(1);
    }

    console.error("HTTP server failed to start:", error);
    process.exit(1);
  });
}

if (process.env.VERCEL !== "1") {
  startServer().catch((error) => {
    console.error("Failed to start API server:", error);
    process.exit(1);
  });
}

export default app;
