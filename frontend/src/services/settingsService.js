import { adminGet, adminPatch, publicGet } from "../api/axios";

export const defaultSiteSettings = {
  accountName: "",
  accountNumber: "",
  address: "",
  allowRegistration: true,
  allowUserLogin: true,
  backgroundColor: "#F8F3E7",
  bankName: "",
  buttonControls: {},
  buttons: [],
  churchName: "St. Gabriel Catholic Church",
  email: "office@stgabrielparish.org",
  facebook: "",
  goldAccent: "#C9A227",
  heroBackgroundImage: "",
  heroSubtitle: "Join us as we grow together in Christ through prayer, service, and love.",
  heroTitle: "Faith, Worship, Community, and Hope",
  homepageContactEnabled: true,
  homepageDisabledReason: "This action is temporarily unavailable.",
  homepageDonateEnabled: true,
  homepageMassTimesEnabled: true,
  homepageNewsletterEnabled: true,
  homepagePrayerEnabled: true,
  instagram: "",
  keywords: "Catholic church, Mass, prayer, parish",
  logoUrl: "",
  mainCtaText: "View Mass Times",
  maintenanceEnabled: false,
  maintenanceExpectedBack: null,
  maintenanceMessage: "We are making a few updates. Please check back soon.",
  maintenanceTitle: "Website temporarily unavailable",
  metaDescription: "St. Gabriel Catholic Church is a welcoming Catholic parish community.",
  mpesaPaybill: "",
  officeHours: "Monday - Friday, 9:00 AM - 5:00 PM",
  phone: "",
  primaryColor: "#071A2D",
  secondaryCtaText: "Donate Now",
  stkPushEnabled: true,
  tagline: "Growing together in faith, worship, and service.",
  tiktok: "",
  tillNumber: "",
  websiteTitle: "St. Gabriel Catholic Church",
  whatsapp: "",
  youtube: "",
};

const buttonSettingMap = {
  contact_us: "homepageContactEnabled",
  donate_now: "homepageDonateEnabled",
  newsletter_subscribe: "homepageNewsletterEnabled",
  prayer_request: "homepagePrayerEnabled",
  view_mass_times: "homepageMassTimesEnabled",
};

function extractSettings(response) {
  return response?.settings || response?.data?.settings || response || {};
}

function extractButtons(response) {
  const data = response?.data || response || {};
  return data.buttons || response?.buttons || [];
}

function normalizeSettings(rawSettings) {
  const settings = { ...defaultSiteSettings, ...rawSettings };
  const buttonControls = settings.buttonControls || {};
  const buttons = settings.buttons || Object.values(buttonControls);

  settings.buttons = buttons;
  settings.buttonControls = buttonControls;

  if (Object.prototype.hasOwnProperty.call(settings, "maintenanceMode")) {
    settings.maintenanceEnabled = Boolean(settings.maintenanceMode);
  }

  for (const [buttonKey, settingKey] of Object.entries(buttonSettingMap)) {
    const control = buttonControls[buttonKey] || buttons.find((button) => button.buttonKey === buttonKey);
    if (!control) continue;

    settings[settingKey] = Boolean(control.isEnabled);
    if (!control.isEnabled && control.disabledReason) {
      settings.homepageDisabledReason = control.disabledReason;
    }
  }

  return settings;
}

function dispatchSettingsUpdated(settings) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("st-gabriel:settings-updated", { detail: settings }));
  }
}

export async function getSiteSettings() {
  const [websiteResponse, publicResponse] = await Promise.all([publicGet("/settings"), publicGet("/settings/public")]);
  return normalizeSettings({
    ...extractSettings(websiteResponse),
    ...extractSettings(publicResponse),
  });
}

export async function getPublicSettings() {
  const response = await publicGet("/settings/public");
  return normalizeSettings(extractSettings(response));
}

export async function getAdminSettings() {
  const response = await adminGet("/settings/admin");
  return normalizeSettings(extractSettings(response));
}

export async function updateMaintenance(payload) {
  const response = await adminPatch("/settings/maintenance", payload);
  const settings = normalizeSettings(extractSettings(response));
  dispatchSettingsUpdated(settings);
  return response;
}

export async function updateAuthOptions(payload) {
  const response = await adminPatch("/settings/auth-options", payload);
  const settings = normalizeSettings(extractSettings(response));
  dispatchSettingsUpdated(settings);
  return response;
}

export async function updateButtonControl(buttonKey, payload) {
  const response = await adminPatch(`/settings/buttons/${encodeURIComponent(buttonKey)}`, payload);
  dispatchSettingsUpdated(await getSiteSettings());
  return response;
}

export async function getButtonControls() {
  const response = await publicGet("/settings/buttons");
  return {
    buttonControls: response?.buttonControls || response?.data?.buttonControls || {},
    buttons: extractButtons(response),
  };
}
