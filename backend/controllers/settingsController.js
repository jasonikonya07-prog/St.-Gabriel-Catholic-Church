import ApiError from "../utils/ApiError.js";
import { ButtonControl, SiteSetting, WebsiteSetting } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logAudit, logSecurityEvent } from "../utils/securityLogger.js";

const buttonDefaults = {
  contact_us: "Contact Us",
  donate_now: "Donate Now",
  newsletter_subscribe: "Newsletter Subscribe",
  prayer_request: "Prayer Request",
  view_mass_times: "View Mass Times",
};

const homepageButtonSettings = {
  contact_us: "homepageContactEnabled",
  donate_now: "homepageDonateEnabled",
  newsletter_subscribe: "homepageNewsletterEnabled",
  prayer_request: "homepagePrayerEnabled",
  view_mass_times: "homepageMassTimesEnabled",
};

const defaultWebsiteSettings = {
  accountName: "",
  accountNumber: "",
  address: "",
  backgroundColor: "#F8F3E7",
  bankName: "",
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
  maintenanceMessage: "We are currently improving our website. Please check back soon.",
  maintenanceTitle: "Website Under Maintenance",
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

const websiteSettingKeys = Object.keys(defaultWebsiteSettings);
const booleanWebsiteKeys = new Set([
  "homepageContactEnabled",
  "homepageDonateEnabled",
  "homepageMassTimesEnabled",
  "homepageNewsletterEnabled",
  "homepagePrayerEnabled",
  "maintenanceEnabled",
  "stkPushEnabled",
]);
const hexColorKeys = new Set(["backgroundColor", "goldAccent", "primaryColor"]);

function cleanString(value) {
  return String(value ?? "").trim();
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  return ["true", "1", "yes", "on", "enabled", "published"].includes(String(value).toLowerCase());
}

function parseStoredValue(row) {
  try {
    return JSON.parse(row.settingValue);
  } catch {
    return row.settingValue;
  }
}

function parseOptionalDate(value, fieldName) {
  if (value === undefined) return undefined;
  if (value === null || cleanString(value) === "") return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, `${fieldName} must be a valid date.`);
  }

  return date;
}

function publicButton(row) {
  return {
    buttonKey: row.buttonKey,
    buttonLabel: row.buttonLabel,
    disabledReason: row.disabledReason,
    isEnabled: Boolean(row.isEnabled),
  };
}

function buttonControlsByKey(rows) {
  return Object.fromEntries(rows.map((row) => [row.buttonKey, publicButton(row)]));
}

async function ensureSiteSetting() {
  const [setting] = await SiteSetting.findOrCreate({
    defaults: {
      allowRegistration: true,
      allowUserLogin: true,
      maintenanceMessage: defaultWebsiteSettings.maintenanceMessage,
      maintenanceMode: false,
      maintenanceTitle: defaultWebsiteSettings.maintenanceTitle,
    },
    where: { id: 1 },
  });

  return setting;
}

async function ensureButtonControls() {
  await Promise.all(
    Object.entries(buttonDefaults).map(([buttonKey, buttonLabel]) =>
      ButtonControl.findOrCreate({
        defaults: {
          buttonKey,
          buttonLabel,
          isEnabled: true,
        },
        where: { buttonKey },
      }),
    ),
  );

  return ButtonControl.findAll({ order: [["id", "ASC"]] });
}

async function readStructuredSettings() {
  const [siteSetting, buttonRows] = await Promise.all([ensureSiteSetting(), ensureButtonControls()]);

  return {
    allowRegistration: Boolean(siteSetting.allowRegistration),
    allowUserLogin: Boolean(siteSetting.allowUserLogin),
    buttonControls: buttonControlsByKey(buttonRows),
    buttons: buttonRows.map(publicButton),
    maintenanceExpectedBack: siteSetting.maintenanceExpectedBack,
    maintenanceMessage: siteSetting.maintenanceMessage,
    maintenanceMode: Boolean(siteSetting.maintenanceMode),
    maintenanceTitle: siteSetting.maintenanceTitle,
  };
}

async function readWebsiteSettings() {
  const [rows, structured] = await Promise.all([WebsiteSetting.findAll({ raw: true }), readStructuredSettings()]);
  const storedSettings = Object.fromEntries(rows.map((row) => [row.settingKey, parseStoredValue(row)]));
  const settings = {
    ...defaultWebsiteSettings,
    ...storedSettings,
    maintenanceEnabled: structured.maintenanceMode,
    maintenanceExpectedBack: structured.maintenanceExpectedBack,
    maintenanceMessage: structured.maintenanceMessage,
    maintenanceTitle: structured.maintenanceTitle,
  };

  for (const [buttonKey, settingKey] of Object.entries(homepageButtonSettings)) {
    if (structured.buttonControls[buttonKey]) {
      settings[settingKey] = structured.buttonControls[buttonKey].isEnabled;
    }
  }

  return settings;
}

function normalizeWebsiteSettingsPatch(body) {
  const patch = {};

  for (const key of websiteSettingKeys) {
    if (!Object.prototype.hasOwnProperty.call(body, key)) continue;

    if (booleanWebsiteKeys.has(key)) {
      patch[key] = normalizeBoolean(body[key]);
      continue;
    }

    patch[key] = cleanString(body[key]);
  }

  return patch;
}

function validateWebsiteSettingsPatch(patch) {
  if (patch.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanString(patch.email).toLowerCase())) {
    throw new ApiError(400, "Please enter a valid email address.");
  }

  for (const key of hexColorKeys) {
    if (patch[key] && !/^#[0-9A-Fa-f]{6}$/.test(cleanString(patch[key]))) {
      throw new ApiError(400, `${key} must be a valid hex color, for example #071A2D.`);
    }
  }
}

function changedKeysFrom(previous, patch) {
  return Object.keys(patch).filter((key) => {
    const previousValue = previous[key] instanceof Date ? previous[key].toISOString() : previous[key];
    const nextValue = patch[key] instanceof Date ? patch[key].toISOString() : patch[key];
    return previousValue !== nextValue;
  });
}

async function logSettingsAudit({ action, changedKeys, description, details = {}, eventType = null, request, severity = "low" }) {
  if (!changedKeys.length) return;

  const auditDetails = {
    changedKeys,
    ...details,
  };

  await logAudit({
    action,
    actorEmail: request.admin?.email,
    actorId: request.admin?.id,
    actorType: "admin",
    description,
    details: auditDetails,
    module: "settings",
    request,
  });

  if (eventType) {
    await logSecurityEvent({
      details: auditDetails,
      email: request.admin?.email,
      eventType,
      request,
      severity,
    });
  }
}

function normalizeMaintenancePatch(body) {
  const patch = {};

  if (Object.prototype.hasOwnProperty.call(body, "maintenanceMode")) {
    patch.maintenanceMode = normalizeBoolean(body.maintenanceMode);
  }

  if (Object.prototype.hasOwnProperty.call(body, "maintenanceTitle")) {
    patch.maintenanceTitle = cleanString(body.maintenanceTitle);
    if (!patch.maintenanceTitle) throw new ApiError(400, "Maintenance title is required.");
    if (patch.maintenanceTitle.length > 180) throw new ApiError(400, "Maintenance title must be 180 characters or fewer.");
  }

  if (Object.prototype.hasOwnProperty.call(body, "maintenanceMessage")) {
    patch.maintenanceMessage = cleanString(body.maintenanceMessage);
    if (!patch.maintenanceMessage) throw new ApiError(400, "Maintenance message is required.");
  }

  if (Object.prototype.hasOwnProperty.call(body, "maintenanceExpectedBack")) {
    patch.maintenanceExpectedBack = parseOptionalDate(body.maintenanceExpectedBack, "maintenanceExpectedBack");
  }

  return patch;
}

function normalizeAuthOptionsPatch(body) {
  const patch = {};

  if (Object.prototype.hasOwnProperty.call(body, "allowUserLogin")) {
    patch.allowUserLogin = normalizeBoolean(body.allowUserLogin);
  }

  if (Object.prototype.hasOwnProperty.call(body, "allowRegistration")) {
    patch.allowRegistration = normalizeBoolean(body.allowRegistration);
  }

  return patch;
}

function normalizeButtonPatch(body) {
  const patch = {};

  if (Object.prototype.hasOwnProperty.call(body, "isEnabled")) {
    patch.isEnabled = normalizeBoolean(body.isEnabled);
  }

  if (Object.prototype.hasOwnProperty.call(body, "disabledReason")) {
    patch.disabledReason = cleanString(body.disabledReason) || null;
    if (patch.disabledReason && patch.disabledReason.length > 255) {
      throw new ApiError(400, "Disabled reason must be 255 characters or fewer.");
    }
  }

  return patch;
}

export const getPublicSettings = asyncHandler(async (request, response) => {
  const settings = await readStructuredSettings();

  response.json({
    data: { settings },
    settings,
    success: true,
  });
});

export const getAdminSettings = asyncHandler(async (request, response) => {
  const settings = await readStructuredSettings();

  response.json({
    data: { settings },
    settings,
    success: true,
  });
});

export const getButtonControls = asyncHandler(async (request, response) => {
  const buttonRows = await ensureButtonControls();
  const buttons = buttonRows.map(publicButton);

  response.json({
    buttonControls: buttonControlsByKey(buttonRows),
    buttons,
    data: {
      buttonControls: buttonControlsByKey(buttonRows),
      buttons,
    },
    success: true,
  });
});

export const updateMaintenance = asyncHandler(async (request, response) => {
  const patch = normalizeMaintenancePatch(request.body || {});

  if (!Object.keys(patch).length) {
    throw new ApiError(400, "No maintenance settings were provided.");
  }

  const siteSetting = await ensureSiteSetting();
  const previous = siteSetting.toJSON();
  siteSetting.set(patch);
  await siteSetting.save({ fields: Object.keys(patch) });

  const changedKeys = changedKeysFrom(previous, patch);
  await logSettingsAudit({
    action: changedKeys.includes("maintenanceMode") ? "maintenance.mode_changed" : "settings.maintenance_updated",
    changedKeys,
    description: "Admin updated maintenance settings.",
    details: {
      maintenanceMode: siteSetting.maintenanceMode,
    },
    eventType: changedKeys.includes("maintenanceMode") ? "maintenance_mode_changed" : "settings.maintenance_updated",
    request,
    severity: siteSetting.maintenanceMode ? "medium" : "low",
  });

  const settings = await readStructuredSettings();
  response.json({
    data: { settings },
    message: "Maintenance settings saved successfully.",
    settings,
    success: true,
  });
});

export const updateAuthOptions = asyncHandler(async (request, response) => {
  const patch = normalizeAuthOptionsPatch(request.body || {});

  if (!Object.keys(patch).length) {
    throw new ApiError(400, "No authentication settings were provided.");
  }

  const siteSetting = await ensureSiteSetting();
  const previous = siteSetting.toJSON();
  siteSetting.set(patch);
  await siteSetting.save({ fields: Object.keys(patch) });

  await logSettingsAudit({
    action: "settings.auth_options_updated",
    changedKeys: changedKeysFrom(previous, patch),
    description: "Admin updated website authentication options.",
    details: patch,
    eventType: "settings.auth_options_updated",
    request,
  });

  const settings = await readStructuredSettings();
  response.json({
    data: { settings },
    message: "Authentication options saved successfully.",
    settings,
    success: true,
  });
});

export const updateButtonControl = asyncHandler(async (request, response) => {
  const buttonKey = cleanString(request.params.buttonKey);

  if (!buttonDefaults[buttonKey]) {
    throw new ApiError(404, "Button control not found.");
  }

  const patch = normalizeButtonPatch(request.body || {});

  if (!Object.keys(patch).length) {
    throw new ApiError(400, "No button settings were provided.");
  }

  const [button] = await ButtonControl.findOrCreate({
    defaults: {
      buttonKey,
      buttonLabel: buttonDefaults[buttonKey],
      isEnabled: true,
    },
    where: { buttonKey },
  });
  const previous = button.toJSON();
  button.set({
    ...patch,
    updatedBy: request.admin?.id || null,
  });
  await button.save({ fields: [...Object.keys(patch), "updatedBy"] });

  const changedKeys = changedKeysFrom(previous, patch);
  await logSettingsAudit({
    action: changedKeys.includes("isEnabled") ? (button.isEnabled ? "button.enabled" : "button.disabled") : "settings.button_updated",
    changedKeys,
    description: "Admin updated homepage button controls.",
    details: {
      buttonKey,
      isEnabled: Boolean(button.isEnabled),
    },
    eventType: changedKeys.includes("isEnabled") ? (button.isEnabled ? "button.enabled" : "button.disabled") : "settings.button_updated",
    request,
  });

  response.json({
    button: publicButton(button),
    data: { button: publicButton(button) },
    message: "Button settings saved successfully.",
    success: true,
  });
});

export const getSettings = asyncHandler(async (request, response) => {
  const settings = await readWebsiteSettings();

  response.json({
    data: { settings },
    settings,
    success: true,
  });
});

export const updateSettings = asyncHandler(async (request, response) => {
  const patch = normalizeWebsiteSettingsPatch(request.body || {});

  if (!Object.keys(patch).length) {
    throw new ApiError(400, "No valid settings were provided.");
  }

  validateWebsiteSettingsPatch(patch);
  const previousSettings = await readWebsiteSettings();

  await Promise.all(
    Object.entries(patch).map(([settingKey, value]) =>
      WebsiteSetting.upsert({
        settingKey,
        settingValue: JSON.stringify(value),
      }),
    ),
  );

  if (
    Object.prototype.hasOwnProperty.call(patch, "maintenanceEnabled") ||
    Object.prototype.hasOwnProperty.call(patch, "maintenanceTitle") ||
    Object.prototype.hasOwnProperty.call(patch, "maintenanceMessage") ||
    Object.prototype.hasOwnProperty.call(patch, "maintenanceExpectedBack")
  ) {
    const siteSetting = await ensureSiteSetting();
    const structuredPatch = {};
    if (Object.prototype.hasOwnProperty.call(patch, "maintenanceEnabled")) structuredPatch.maintenanceMode = patch.maintenanceEnabled;
    if (Object.prototype.hasOwnProperty.call(patch, "maintenanceTitle")) structuredPatch.maintenanceTitle = patch.maintenanceTitle;
    if (Object.prototype.hasOwnProperty.call(patch, "maintenanceMessage")) structuredPatch.maintenanceMessage = patch.maintenanceMessage;
    if (Object.prototype.hasOwnProperty.call(patch, "maintenanceExpectedBack")) {
      structuredPatch.maintenanceExpectedBack = parseOptionalDate(patch.maintenanceExpectedBack, "maintenanceExpectedBack");
    }
    siteSetting.set(structuredPatch);
    await siteSetting.save({ fields: Object.keys(structuredPatch) });
  }

  await Promise.all(
    Object.entries(homepageButtonSettings)
      .filter(([, settingKey]) => Object.prototype.hasOwnProperty.call(patch, settingKey))
      .map(([buttonKey, settingKey]) =>
        ButtonControl.upsert({
          buttonKey,
          buttonLabel: buttonDefaults[buttonKey],
          disabledReason: patch[settingKey] ? null : patch.homepageDisabledReason || null,
          isEnabled: Boolean(patch[settingKey]),
          updatedBy: request.admin?.id || null,
        }),
      ),
  );

  const settings = await readWebsiteSettings();
  const changedKeys = changedKeysFrom(previousSettings, patch);
  await logSettingsAudit({
    action: changedKeys.includes("maintenanceEnabled") ? "maintenance.mode_changed" : "admin.updated_settings",
    changedKeys,
    description: "Admin updated website settings.",
    details: { changedKeys },
    eventType: changedKeys.includes("maintenanceEnabled") ? "maintenance_mode_changed" : "admin.updated_settings",
    request,
    severity: patch.maintenanceEnabled ? "medium" : "low",
  });

  await Promise.all(
    Object.entries(homepageButtonSettings)
      .filter(([, settingKey]) => changedKeys.includes(settingKey))
      .map(async ([buttonKey, settingKey]) => {
        const enabled = Boolean(patch[settingKey]);
        await logAudit({
          action: enabled ? "button.enabled" : "button.disabled",
          actorEmail: request.admin?.email,
          actorId: request.admin?.id,
          actorType: "admin",
          description: enabled ? "Admin enabled a homepage button." : "Admin disabled a homepage button.",
          details: {
            buttonKey,
            enabled,
          },
          entity: "button_control",
          entityId: buttonKey,
          module: "settings",
          request,
        });

        await logSecurityEvent({
          details: {
            buttonKey,
            enabled,
          },
          email: request.admin?.email,
          eventType: enabled ? "button.enabled" : "button.disabled",
          request,
          severity: "low",
        });
      }),
  );

  response.json({
    data: { settings },
    message: "Website settings saved successfully.",
    settings,
    success: true,
  });
});
