import dotenv from "dotenv";

dotenv.config();

const defaultDatabaseName = "st_gabriel_church";

function readOptionalEnv(name) {
  const value = String(process.env[name] || "").trim();
  return value || undefined;
}

function readBooleanEnv(name, fallback = false) {
  const value = readOptionalEnv(name);
  if (value === undefined) return fallback;
  return ["true", "1", "yes", "on"].includes(value.toLowerCase());
}

function decodeUrlPart(value) {
  return value ? decodeURIComponent(value) : "";
}

function parseConnectionUrl() {
  const rawUrl = readOptionalEnv("DATABASE_URL") || readOptionalEnv("MYSQL_URL");
  if (!rawUrl) return {};

  try {
    const parsed = new URL(rawUrl);
    const database = decodeUrlPart(parsed.pathname.replace(/^\/+/, ""));
    const sslMode = parsed.searchParams.get("ssl-mode") || parsed.searchParams.get("sslmode");
    const sslParam = parsed.searchParams.get("ssl");

    return {
      database,
      host: parsed.hostname,
      password: decodeUrlPart(parsed.password),
      port: parsed.port ? Number(parsed.port) : 3306,
      ssl:
        sslParam === "true" ||
        sslMode === "REQUIRED" ||
        sslMode === "VERIFY_IDENTITY" ||
        sslMode === "VERIFY_CA" ||
        sslMode === "require",
      username: decodeUrlPart(parsed.username),
    };
  } catch {
    return {};
  }
}

const urlConfig = parseConnectionUrl();

export const databaseConfig = {
  database: readOptionalEnv("DB_NAME") || urlConfig.database || defaultDatabaseName,
  host: readOptionalEnv("DB_HOST") || urlConfig.host || "localhost",
  password: readOptionalEnv("DB_PASSWORD") ?? urlConfig.password ?? "",
  port: Number(readOptionalEnv("DB_PORT") || urlConfig.port || 3306),
  username: readOptionalEnv("DB_USER") || urlConfig.username || "root",
};

export const sslEnabled = readBooleanEnv("DB_SSL", Boolean(urlConfig.ssl));

export function getDatabaseSslConfig() {
  if (!sslEnabled) return undefined;

  return {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
  };
}

export function getMysqlConnectionOptions({ includeDatabase = true, multipleStatements = false } = {}) {
  return {
    database: includeDatabase ? databaseConfig.database : undefined,
    host: databaseConfig.host,
    multipleStatements,
    password: databaseConfig.password,
    port: databaseConfig.port,
    ssl: getDatabaseSslConfig(),
    user: databaseConfig.username,
  };
}
