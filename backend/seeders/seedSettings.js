import dotenv from "dotenv";
import { connectDB, disconnectDB } from "../config/db.js";
import ButtonControl from "../models/ButtonControl.js";
import SiteSetting from "../models/SiteSetting.js";

dotenv.config();

const siteSettingDefaults = {
  allowRegistration: true,
  allowUserLogin: true,
  id: "1",
  maintenanceMessage: "We are currently improving our website. Please check back soon.",
  maintenanceMode: false,
  maintenanceTitle: "Website Under Maintenance",
};

const buttonDefaults = [
  { buttonKey: "donate_now", buttonLabel: "Donate Now" },
  { buttonKey: "view_mass_times", buttonLabel: "View Mass Times" },
  { buttonKey: "contact_us", buttonLabel: "Contact Us" },
  { buttonKey: "prayer_request", buttonLabel: "Prayer Request" },
  { buttonKey: "newsletter_subscribe", buttonLabel: "Newsletter Subscribe" },
];

async function seedSettings() {
  try {
    await connectDB();

    const existingSettings = await SiteSetting.findOne({});

    if (existingSettings) {
      console.log("Site settings already exist.");
    } else {
      await SiteSetting.create(siteSettingDefaults);
      console.log("Default site settings created.");
    }

    await Promise.all(
      buttonDefaults.map(async (button) => {
        const existingButton = await ButtonControl.findOne({ buttonKey: button.buttonKey });

        if (existingButton) {
          return existingButton;
        }

        return ButtonControl.create({
          ...button,
          disabledReason: null,
          isEnabled: true,
        });
      }),
    );

    console.log("Default button controls are ready.");
  } finally {
    await disconnectDB();
  }
}

seedSettings().catch((error) => {
  console.error("Failed to seed settings:");
  console.error(error.message);
  process.exit(1);
});
