import ApiError from "../utils/ApiError.js";
import { ButtonControl, SiteSetting } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logAudit, logSecurityEvent } from "../utils/securityLogger.js";

const buttonDefaults = {
  contact_us: "Contact Us",
  donate_now: "Donate Now",
  newsletter_subscribe: "Newsletter Subscribe",
  prayer_request: "Prayer Request",
  view_mass_times: "View Mass Times",
};

const buttonKeys = Object.keys(buttonDefaults);

const siteSettingDefaults = {
  allowRegistration: true,
  allowUserLogin: true,
  maintenanceExpectedBack: null,
  maintenanceMessage: "We are making a few updates. Please check back soon.",
  maintenanceMode: false,
  maintenanceTitle: "Website temporarily unavailable",
};

function cleanString(value) {
  return String(value ?? "").trim();
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  return ["true", "1", "yes", "on", "enabled"].includes(String(value).toLowerCase());
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function readFirstPresent(source, keys) {
  for (const key of keys) {
    if (hasOwn(source, key)) {
      return { exists: true, value: source[key] };
    }
  }

  return { exists: false, value: undefined };
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

function serializeButton(button, { includeMeta = false } = {}) {
  const data = {
    buttonKey: button.buttonKey,
    buttonLabel: button.buttonLabel,
    disabledReason: button.disabledReason || null,
    isEnabled: Boolean(button.isEnabled),
  };

  if (includeMeta) {
    data.id = button.id;
    data.updatedAt = button.updatedAt;
    data.updatedBy = button.updatedBy || null;
  }

  return data;
}

function serializeButtons(buttons, options = {}) {
  return buttons.map((button) => serializeButton(button, options));
}

function buttonsByKey(buttons, options = {}) {
  return Object.fromEntries(buttons.map((button) => [button.buttonKey, serializeButton(button, options)]));
}

function serializeSettings(siteSetting, buttons, { includeMeta = false } = {}) {
  const maintenance = {
    enabled: Boolean(siteSetting.maintenanceMode),
    expectedBack: siteSetting.maintenanceExpectedBack,
    maintenanceExpectedBack: siteSetting.maintenanceExpectedBack,
    maintenanceMessage: siteSetting.maintenanceMessage,
    maintenanceMode: Boolean(siteSetting.maintenanceMode),
    maintenanceTitle: siteSetting.maintenanceTitle,
    message: siteSetting.maintenanceMessage,
    title: siteSetting.maintenanceTitle,
  };
  const auth = {
    allowRegistration: Boolean(siteSetting.allowRegistration),
    allowUserLogin: Boolean(siteSetting.allowUserLogin),
  };
  const serializedButtons = serializeButtons(buttons, { includeMeta });
  const buttonControls = buttonsByKey(buttons, { includeMeta });

  return {
    auth,
    buttonControls,
    buttons: serializedButtons,
    maintenance,
    allowRegistration: auth.allowRegistration,
    allowUserLogin: auth.allowUserLogin,
    maintenanceExpectedBack: maintenance.expectedBack,
    maintenanceMessage: maintenance.message,
    maintenanceMode: maintenance.enabled,
    maintenanceTitle: maintenance.title,
  };
}

async function ensureSiteSetting() {
  return SiteSetting.findOneAndUpdate(
    { id: "1" },
    { $setOnInsert: { id: "1", ...siteSettingDefaults } },
    {
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
      upsert: true,
    },
  );
}

async function ensureButtonControls() {
  const buttons = await Promise.all(
    buttonKeys.map((buttonKey) =>
      ButtonControl.findOneAndUpdate(
        { buttonKey },
        {
          $setOnInsert: {
            buttonKey,
            buttonLabel: buttonDefaults[buttonKey],
            isEnabled: true,
          },
        },
        {
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
          upsert: true,
        },
      ),
    ),
  );

  return buttons;
}

async function readSettings(options = {}) {
  const [siteSetting, buttons] = await Promise.all([ensureSiteSetting(), ensureButtonControls()]);
  return serializeSettings(siteSetting, buttons, options);
}

function changedKeysFrom(previous, patch) {
  return Object.keys(patch).filter((key) => {
    const previousValue = previous[key] instanceof Date ? previous[key].toISOString() : previous[key];
    const nextValue = patch[key] instanceof Date ? patch[key].toISOString() : patch[key];
    return previousValue !== nextValue;
  });
}

async function logSettingsChange({ action, changedKeys, description, details = {}, eventType = null, request, severity = "low" }) {
  if (!changedKeys.length) return;

  const auditDetails = { changedKeys, ...details };

  await logAudit({
    action,
    actorEmail: request.admin?.email,
    actorId: request.admin?.id,
    actorType: "admin",
    description,
    details: auditDetails,
    entity: "site_setting",
    entityId: "1",
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

function normalizeMaintenancePatch(body = {}) {
  const patch = {};
  const mode = readFirstPresent(body, ["maintenanceMode", "enabled"]);
  const title = readFirstPresent(body, ["maintenanceTitle", "title"]);
  const message = readFirstPresent(body, ["maintenanceMessage", "message"]);
  const expectedBack = readFirstPresent(body, ["maintenanceExpectedBack", "expectedBack"]);

  if (mode.exists) {
    patch.maintenanceMode = normalizeBoolean(mode.value);
  }

  if (title.exists) {
    patch.maintenanceTitle = cleanString(title.value);
    if (!patch.maintenanceTitle) throw new ApiError(400, "Maintenance title is required.");
  }

  if (message.exists) {
    patch.maintenanceMessage = cleanString(message.value);
    if (!patch.maintenanceMessage) throw new ApiError(400, "Maintenance message is required.");
  }

  if (expectedBack.exists) {
    patch.maintenanceExpectedBack = parseOptionalDate(expectedBack.value, "maintenanceExpectedBack");
  }

  return patch;
}

function normalizeAuthOptionsPatch(body = {}) {
  const patch = {};

  if (hasOwn(body, "allowUserLogin")) {
    patch.allowUserLogin = normalizeBoolean(body.allowUserLogin);
  }

  if (hasOwn(body, "allowRegistration")) {
    patch.allowRegistration = normalizeBoolean(body.allowRegistration);
  }

  return patch;
}

function normalizeButtonPatch(body = {}) {
  const patch = {};
  const enabled = readFirstPresent(body, ["isEnabled", "enabled"]);

  if (enabled.exists) {
    patch.isEnabled = normalizeBoolean(enabled.value);
  }

  if (hasOwn(body, "disabledReason")) {
    patch.disabledReason = cleanString(body.disabledReason) || null;
  }

  if (hasOwn(body, "buttonLabel")) {
    patch.buttonLabel = cleanString(body.buttonLabel);
    if (!patch.buttonLabel) throw new ApiError(400, "Button label is required.");
  }

  return patch;
}

export const getPublicSettings = asyncHandler(async (request, response) => {
  const settings = await readSettings();

  response.json({
    data: { settings },
    settings,
    success: true,
  });
});

export const getAdminSettings = asyncHandler(async (request, response) => {
  const settings = await readSettings({ includeMeta: true });

  response.json({
    data: { settings },
    settings,
    success: true,
  });
});

export const getButtonControls = asyncHandler(async (request, response) => {
  const buttons = await ensureButtonControls();

  response.json({
    buttonControls: buttonsByKey(buttons),
    buttons: serializeButtons(buttons),
    data: {
      buttonControls: buttonsByKey(buttons),
      buttons: serializeButtons(buttons),
    },
    success: true,
  });
});

export const updateMaintenance = asyncHandler(async (request, response) => {
  const patch = normalizeMaintenancePatch(request.body);

  if (!Object.keys(patch).length) {
    throw new ApiError(400, "No maintenance settings were provided.");
  }

  const siteSetting = await ensureSiteSetting();
  const previous = siteSetting.toJSON();
  siteSetting.set({
    ...patch,
    updatedBy: request.admin?.id || null,
  });
  await siteSetting.save();

  const changedKeys = changedKeysFrom(previous, patch);
  await logSettingsChange({
    action: changedKeys.includes("maintenanceMode") ? "maintenance.mode_changed" : "settings.maintenance_updated",
    changedKeys,
    description: "Admin updated maintenance settings.",
    details: {
      maintenanceMode: Boolean(siteSetting.maintenanceMode),
    },
    eventType: changedKeys.includes("maintenanceMode") ? "maintenance_mode_changed" : "settings.maintenance_updated",
    request,
    severity: siteSetting.maintenanceMode ? "medium" : "low",
  });

  const settings = await readSettings({ includeMeta: true });
  response.json({
    data: { settings },
    message: "Maintenance settings saved successfully.",
    settings,
    success: true,
  });
});

export const updateAuthOptions = asyncHandler(async (request, response) => {
  const patch = normalizeAuthOptionsPatch(request.body);

  if (!Object.keys(patch).length) {
    throw new ApiError(400, "No authentication settings were provided.");
  }

  const siteSetting = await ensureSiteSetting();
  const previous = siteSetting.toJSON();
  siteSetting.set({
    ...patch,
    updatedBy: request.admin?.id || null,
  });
  await siteSetting.save();

  await logSettingsChange({
    action: "settings.auth_options_updated",
    changedKeys: changedKeysFrom(previous, patch),
    description: "Admin updated website authentication options.",
    details: patch,
    eventType: "settings.auth_options_updated",
    request,
  });

  const settings = await readSettings({ includeMeta: true });
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

  const patch = normalizeButtonPatch(request.body);

  if (!Object.keys(patch).length) {
    throw new ApiError(400, "No button settings were provided.");
  }

  const button = await ButtonControl.findOneAndUpdate(
    { buttonKey },
    {
      $setOnInsert: {
        buttonKey,
        buttonLabel: buttonDefaults[buttonKey],
        isEnabled: true,
      },
    },
    {
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
      upsert: true,
    },
  );
  const previous = button.toJSON();
  button.set({
    ...patch,
    updatedBy: request.admin?.id || null,
  });
  await button.save();

  const changedKeys = changedKeysFrom(previous, patch);
  await logSettingsChange({
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
    button: serializeButton(button, { includeMeta: true }),
    data: { button: serializeButton(button, { includeMeta: true }) },
    message: "Button settings saved successfully.",
    success: true,
  });
});

export const getSettings = getPublicSettings;

export const updateSettings = asyncHandler(async (request, response) => {
  const maintenancePatch = normalizeMaintenancePatch(request.body);
  const authPatch = normalizeAuthOptionsPatch(request.body);
  const patch = { ...maintenancePatch, ...authPatch };

  if (!Object.keys(patch).length) {
    throw new ApiError(400, "No supported settings were provided.");
  }

  const siteSetting = await ensureSiteSetting();
  const previous = siteSetting.toJSON();
  siteSetting.set({
    ...patch,
    updatedBy: request.admin?.id || null,
  });
  await siteSetting.save();

  await logSettingsChange({
    action: "settings.updated",
    changedKeys: changedKeysFrom(previous, patch),
    description: "Admin updated website settings.",
    details: patch,
    eventType: "settings.updated",
    request,
  });

  const settings = await readSettings({ includeMeta: true });
  response.json({
    data: { settings },
    message: "Website settings saved successfully.",
    settings,
    success: true,
  });
});
