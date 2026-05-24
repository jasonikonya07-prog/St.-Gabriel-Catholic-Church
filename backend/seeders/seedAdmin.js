import dotenv from "dotenv";
import { connectDB, disconnectDB } from "../config/db.js";
import Admin from "../models/Admin.js";

dotenv.config();

function getRequiredEnv(name) {
  const value = String(process.env[name] || "").trim();

  if (!value) {
    throw new Error(`${name} is required in backend/.env before running npm run seed:admin.`);
  }

  return value;
}

async function seedAdmin() {
  const name = getRequiredEnv("ADMIN_NAME");
  const email = getRequiredEnv("ADMIN_EMAIL").toLowerCase();
  const password = getRequiredEnv("ADMIN_PASSWORD");

  try {
    await connectDB();

    const existingAdmin = await Admin.findOne({}).select("email");

    if (existingAdmin) {
      console.log(`Admin already exists: ${existingAdmin.email}`);
      return;
    }

    await Admin.create({
      email,
      isActive: true,
      name,
      password,
      role: "super_admin",
    });

    console.log(`Admin created successfully: ${email}`);
  } finally {
    await disconnectDB();
  }
}

seedAdmin().catch((error) => {
  console.error("Failed to seed admin:");
  console.error(error.message);
  process.exit(1);
});
