import dotenv from "dotenv";
import mysql2 from "mysql2";
import { Sequelize } from "sequelize";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

const databaseConfig = {
  database: process.env.DB_NAME || "st_gabriel_church",
  host: process.env.DB_HOST || "localhost",
  password: process.env.DB_PASSWORD || "",
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USER || "root",
};

const sslEnabled = process.env.DB_SSL === "true";

const sequelize = new Sequelize(databaseConfig.database, databaseConfig.username, databaseConfig.password, {
  dialect: "mysql",
  dialectModule: mysql2,
  dialectOptions: sslEnabled
    ? {
        ssl: {
          rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
        },
      }
    : undefined,
  define: {
    timestamps: true,
  },
  host: databaseConfig.host,
  logging: process.env.DB_LOGGING === "true" && !isProduction ? console.log : false,
  pool: {
    acquire: Number(process.env.DB_POOL_ACQUIRE || 30000),
    idle: Number(process.env.DB_POOL_IDLE || 10000),
    max: Number(process.env.DB_POOL_MAX || 10),
    min: Number(process.env.DB_POOL_MIN || 0),
  },
  port: databaseConfig.port,
  retry: {
    max: Number(process.env.DB_RETRY_MAX || 3),
  },
  timezone: process.env.DB_TIMEZONE || "+03:00",
});

export async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log(`MySQL connected: ${databaseConfig.host}:${databaseConfig.port}/${databaseConfig.database}`);
    return sequelize;
  } catch (error) {
    console.error("MySQL connection failed.");
    console.error(`Host: ${databaseConfig.host}:${databaseConfig.port}`);
    console.error(`Database: ${databaseConfig.database}`);
    console.error(error.message);
    throw error;
  }
}

export default sequelize;
