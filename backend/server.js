import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import { nanoid } from "nanoid";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import donationRoutes from "./routes/donationRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";
import prayerRoutes from "./routes/prayerRoutes.js";
import securityRoutes from "./routes/securityRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import userAuthRoutes from "./routes/userAuthRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { testConnection } from "./config/database.js";
import { getButtonControls, getPublicSettings, getSettings } from "./controllers/settingsController.js";
import { auditAdminMutations } from "./middleware/auditMiddleware.js";
import { maintenanceMiddleware } from "./middleware/maintenanceMiddleware.js";
import { globalLimiter, loginLimiter, mpesaLimiter, publicFormLimiter } from "./middleware/rateLimiters.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import { bodySizeLimit, configureSecurityMiddleware } from "./middleware/securityMiddleware.js";
import { sequelize } from "./models/index.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);
const apiPrefix = process.env.API_PREFIX || "/api";
const isProduction = process.env.NODE_ENV === "production";
const requestBodyLimit = process.env.REQUEST_BODY_LIMIT || "100kb";

morgan.token("id", (request) => request.id || "-");

function attachRequestId(request, response, next) {
  request.id = request.headers["x-request-id"] || nanoid(12);
  response.setHeader("X-Request-Id", request.id);
  next();
}

app.use(attachRequestId);

// 1. Basic security middleware.
configureSecurityMiddleware(app, { bodyLimit: requestBodyLimit, includeBodyParsers: false });

// 2. Rate limiters.
app.use(globalLimiter);
app.post(`${apiPrefix}/auth/login`, loginLimiter);
app.post(`${apiPrefix}/admin-auth/login`, loginLimiter);
app.post(`${apiPrefix}/users/register`, loginLimiter);
app.post(`${apiPrefix}/user-auth/register`, loginLimiter);
app.post(`${apiPrefix}/contact`, publicFormLimiter);
app.post(`${apiPrefix}/prayers`, publicFormLimiter);
app.post(`${apiPrefix}/donations`, publicFormLimiter);
app.post(`${apiPrefix}/donations/mpesa/stk-push`, mpesaLimiter);
app.post(`${apiPrefix}/newsletter/subscribe`, publicFormLimiter);
app.post(`${apiPrefix}/newsletter/unsubscribe`, publicFormLimiter);

app.use(morgan(isProduction ? ":id :remote-addr :method :url :status :res[content-length] - :response-time ms" : ":id :method :url :status :response-time ms"));
app.use(bodySizeLimit(requestBodyLimit));
app.use(auditAdminMutations);

app.get(`${apiPrefix}/health`, (request, response) => {
  response.json({
    service: "St. Gabriel Church API",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// 3. Public settings routes must stay available during maintenance.
app.get(`${apiPrefix}/settings`, getSettings);
app.get(`${apiPrefix}/settings/public`, getPublicSettings);
app.get(`${apiPrefix}/settings/buttons`, getButtonControls);

// 4. Admin auth must stay available during maintenance.
app.use(`${apiPrefix}/admin-auth`, adminAuthRoutes);
app.use(`${apiPrefix}/auth`, authRoutes);

// 5. Maintenance middleware blocks normal public traffic when enabled.
app.use(maintenanceMiddleware);

// 6. Public and admin API routes.
app.use(`${apiPrefix}/user-auth`, userAuthRoutes);
app.use(`${apiPrefix}/admin-users`, adminUserRoutes);
app.use(`${apiPrefix}/users`, userRoutes);
app.use(`${apiPrefix}/settings`, settingsRoutes);
app.use(`${apiPrefix}`, auditRoutes);
app.use(`${apiPrefix}/security`, securityRoutes);
app.use(`${apiPrefix}/contact`, contactRoutes);
app.use(`${apiPrefix}/prayers`, prayerRoutes);
app.use(`${apiPrefix}/donations`, donationRoutes);
app.use(`${apiPrefix}/announcements`, announcementRoutes);
app.use(`${apiPrefix}/events`, eventRoutes);
app.use(`${apiPrefix}/newsletter`, newsletterRoutes);
app.use(`${apiPrefix}/dashboard`, dashboardRoutes);

// 7. 404 handler.
app.use(notFound);

// 8. Global error handler.
app.use(errorHandler);

async function syncModelsSafely() {
  if (isProduction) {
    if (process.env.DB_SYNC === "true" || process.env.DB_SYNC_ALTER === "true" || process.env.DB_SYNC_FORCE === "true") {
      console.warn("Skipping Sequelize sync in production. Use migrations for production schema changes.");
    }

    return;
  }

  if (process.env.DB_SYNC_FORCE === "true") {
    await sequelize.sync({ force: true });
    console.log("Database models synced with force=true.");
    return;
  }

  if (process.env.DB_SYNC_ALTER === "true") {
    await sequelize.sync({ alter: true });
    console.log("Database models synced with alter=true.");
    return;
  }

  if (process.env.DB_SYNC === "true") {
    await sequelize.sync();
    console.log("Database models synced.");
  }
}

async function startServer() {
  await testConnection();
  await syncModelsSafely();

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

startServer().catch((error) => {
  console.error("Failed to start API server:", error);
  process.exit(1);
});

export default app;
