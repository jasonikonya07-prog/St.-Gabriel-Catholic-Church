import dotenv from "dotenv";
import { Admin, sequelize } from "../models/index.js";

dotenv.config();

function getRequiredEnv(...names) {
  const foundName = names.find((name) => String(process.env[name] || "").trim());
  const value = foundName ? String(process.env[foundName] || "").trim() : "";

  if (!value) {
    throw new Error(`${names.join(" or ")} is required in backend/.env before running npm run seed:admin.`);
  }

  return value;
}

async function seedAdmin() {
  try {
    await sequelize.authenticate();
    await Admin.sync();

    const name = getRequiredEnv("ADMIN_NAME", "ADMIN_SEED_NAME");
    const email = getRequiredEnv("ADMIN_EMAIL", "ADMIN_SEED_EMAIL").toLowerCase();
    const password = getRequiredEnv("ADMIN_PASSWORD", "ADMIN_SEED_PASSWORD");

    const existingAdmin = await Admin.findOne({ where: { email } });

    if (existingAdmin) {
      console.log(`Admin already exists: ${email}`);
      return;
    }

    await Admin.create({
      email,
      name,
      password,
      role: "super_admin",
    });

    console.log(`Admin created successfully: ${email}`);
  } finally {
    await sequelize.close();
  }
}

seedAdmin().catch((error) => {
  console.error("Failed to seed admin:");
  console.error(error.message);
  process.exit(1);
});
