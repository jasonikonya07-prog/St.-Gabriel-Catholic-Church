import dotenv from "dotenv";
import mysql2 from "mysql2";
import { Sequelize } from "sequelize";
import { databaseConfig, getDatabaseSslConfig } from "./databaseConfig.js";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const sslConfig = getDatabaseSslConfig();

const sequelize = new Sequelize(databaseConfig.database, databaseConfig.username, databaseConfig.password, {
  dialect: "mysql",
  dialectModule: mysql2,
  dialectOptions: sslConfig
    ? {
        ssl: sslConfig,
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
