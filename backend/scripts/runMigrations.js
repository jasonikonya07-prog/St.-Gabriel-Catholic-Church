import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { databaseConfig, getMysqlConnectionOptions } from "../config/databaseConfig.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");
const migrationsDir = path.join(backendRoot, "migrations");
const migrationFiles = ["001_st_gabriel_church_schema.sql", "002_security_upgrade_schema.sql"];

function escapeIdentifier(value) {
  return String(value || "st_gabriel_church").replace(/`/g, "``");
}

function shouldCreateDatabase() {
  return String(process.env.DB_CREATE_DATABASE || "true").trim().toLowerCase() !== "false";
}

function prepareSql(sql) {
  const databaseName = escapeIdentifier(databaseConfig.database);
  let nextSql = sql
    .replace(/CREATE DATABASE IF NOT EXISTS `st_gabriel_church`/g, `CREATE DATABASE IF NOT EXISTS \`${databaseName}\``)
    .replace(/USE `st_gabriel_church`;/g, `USE \`${databaseName}\`;`);

  if (!shouldCreateDatabase()) {
    nextSql = nextSql
      .replace(/CREATE DATABASE IF NOT EXISTS `[^`]+`\s+CHARACTER SET utf8mb4\s+COLLATE utf8mb4_unicode_ci;\s*/gi, "")
      .replace(/USE `[^`]+`;\s*/gi, "");
  }

  return nextSql;
}

function splitSqlStatements(sql) {
  const statements = [];
  const buffer = [];
  let delimiter = ";";

  for (const line of sql.split(/\r?\n/)) {
    const trimmed = line.trim();
    const delimiterMatch = trimmed.match(/^DELIMITER\s+(.+)$/i);

    if (delimiterMatch) {
      delimiter = delimiterMatch[1];
      continue;
    }

    buffer.push(line);

    if (trimmed.endsWith(delimiter)) {
      const rawStatement = buffer.join("\n");
      const statement = rawStatement.slice(0, rawStatement.lastIndexOf(delimiter)).trim();

      if (statement) {
        statements.push(statement);
      }

      buffer.length = 0;
    }
  }

  const trailingStatement = buffer.join("\n").trim();
  if (trailingStatement) {
    statements.push(trailingStatement);
  }

  return statements;
}

async function runMigrationFile(connection, fileName) {
  const filePath = path.join(migrationsDir, fileName);
  const sql = prepareSql(await fs.readFile(filePath, "utf8"));
  const statements = splitSqlStatements(sql);

  console.log(`Running ${fileName} (${statements.length} statements)...`);

  for (const statement of statements) {
    await connection.query(statement);
  }

  console.log(`Finished ${fileName}.`);
}

async function main() {
  const connection = await mysql.createConnection(
    getMysqlConnectionOptions({
      includeDatabase: !shouldCreateDatabase(),
    }),
  );

  try {
    if (!shouldCreateDatabase()) {
      await connection.query(`USE \`${escapeIdentifier(databaseConfig.database)}\``);
    }

    for (const fileName of migrationFiles) {
      await runMigrationFile(connection, fileName);
    }

    console.log(`Migrations complete for database "${databaseConfig.database}".`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("Migration failed.");
  console.error(error.message);
  process.exit(1);
});
