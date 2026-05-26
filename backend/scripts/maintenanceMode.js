import dotenv from "dotenv";
import { connectDB, disconnectDB } from "../config/db.js";
import SiteSetting from "../models/SiteSetting.js";

dotenv.config();

const defaults = {
  allowRegistration: true,
  allowUserLogin: true,
  id: "1",
  maintenanceExpectedBack: null,
  maintenanceMessage: "We are currently improving our website. Please check back soon.",
  maintenanceMode: false,
  maintenanceTitle: "Website Under Maintenance",
};

function usage() {
  console.log("Usage: node scripts/maintenanceMode.js <on|off|status>");
  console.log("Examples:");
  console.log("  npm run maintenance:off");
  console.log("  npm run maintenance:on");
  console.log("  npm run maintenance:status");
}

function cleanString(value) {
  return String(value ?? "").trim();
}

function parseExpectedBack(value) {
  const text = cleanString(value);
  if (!text) return null;

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    throw new Error("MAINTENANCE_EXPECTED_BACK must be a valid date.");
  }

  return date;
}

async function ensureSiteSetting() {
  const existingSetting = await SiteSetting.findOne({ id: "1" });
  if (existingSetting) return existingSetting;

  return SiteSetting.create(defaults);
}

function printStatus(setting) {
  console.log(`Maintenance mode: ${setting.maintenanceMode ? "ON" : "OFF"}`);
  console.log(`Title: ${setting.maintenanceTitle}`);
  console.log(`Message: ${setting.maintenanceMessage}`);
  console.log(`Expected back: ${setting.maintenanceExpectedBack ? setting.maintenanceExpectedBack.toISOString() : "not set"}`);
  console.log(`Updated at: ${setting.updatedAt ? setting.updatedAt.toISOString() : "not set"}`);
}

async function updateMaintenanceMode(command) {
  const setting = await ensureSiteSetting();

  if (command === "status") {
    printStatus(setting);
    return;
  }

  if (command === "off") {
    setting.set({
      maintenanceExpectedBack: null,
      maintenanceMode: false,
    });
  }

  if (command === "on") {
    setting.set({
      maintenanceExpectedBack: parseExpectedBack(process.env.MAINTENANCE_EXPECTED_BACK),
      maintenanceMessage: cleanString(process.env.MAINTENANCE_MESSAGE) || defaults.maintenanceMessage,
      maintenanceMode: true,
      maintenanceTitle: cleanString(process.env.MAINTENANCE_TITLE) || defaults.maintenanceTitle,
    });
  }

  await setting.save();
  printStatus(setting);
}

const command = cleanString(process.argv[2] || "status").toLowerCase();

if (!["on", "off", "status"].includes(command)) {
  usage();
  process.exit(1);
}

try {
  await connectDB();
  await updateMaintenanceMode(command);
} catch (error) {
  console.error("Failed to update maintenance mode in the database.");
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await disconnectDB().catch(() => {});
}
