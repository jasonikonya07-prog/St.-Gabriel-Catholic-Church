import dotenv from "dotenv";
import { Admin, ButtonControl, SiteSetting, WebsiteSetting, sequelize } from "../models/index.js";

dotenv.config();

const websiteDefaults = {
  churchName: "St. Gabriel Catholic Church",
  email: "office@stgabrielparish.org",
  heroSubtitle: "Join us as we grow together in Christ through prayer, service, and love.",
  heroTitle: "Faith, Worship, Community, and Hope",
  homepageContactEnabled: true,
  homepageDisabledReason: "This action is temporarily unavailable.",
  homepageDonateEnabled: true,
  homepageMassTimesEnabled: true,
  homepageNewsletterEnabled: true,
  homepagePrayerEnabled: true,
  maintenanceEnabled: false,
  maintenanceMessage: "We are currently improving our website. Please check back soon.",
  maintenanceTitle: "Website Under Maintenance",
  metaDescription: "St. Gabriel Catholic Church is a welcoming Catholic parish community.",
  websiteTitle: "St. Gabriel Catholic Church",
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
    await sequelize.authenticate();
    await Admin.sync();
    await Promise.all([SiteSetting.sync(), ButtonControl.sync(), WebsiteSetting.sync()]);

    await SiteSetting.upsert({
      allowRegistration: true,
      allowUserLogin: true,
      id: 1,
      maintenanceMessage: "We are currently improving our website. Please check back soon.",
      maintenanceMode: false,
      maintenanceTitle: "Website Under Maintenance",
    });

    await Promise.all(
      buttonDefaults.map((button) =>
        ButtonControl.upsert({
          ...button,
          disabledReason: null,
          isEnabled: true,
        }),
      ),
    );

    await Promise.all(
      Object.entries(websiteDefaults).map(([settingKey, value]) =>
        WebsiteSetting.upsert({
          settingKey,
          settingValue: JSON.stringify(value),
        }),
      ),
    );

    console.log("Website security and content settings seeded successfully.");
  } finally {
    await sequelize.close();
  }
}

seedSettings().catch((error) => {
  console.error("Failed to seed settings:");
  console.error(error.message);
  process.exit(1);
});
