import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { defaultSiteSettings, getSiteSettings } from "../services/settingsService";

const defaultDisabledReason = "This feature is temporarily unavailable.";

const legacyButtonMap = {
  contact_us: "homepageContactEnabled",
  donate_now: "homepageDonateEnabled",
  newsletter_subscribe: "homepageNewsletterEnabled",
  prayer_request: "homepagePrayerEnabled",
  view_mass_times: "homepageMassTimesEnabled",
};

const SiteSettingsContext = createContext({
  getButtonControl: () => ({ disabledReason: "", isEnabled: true }),
  getButtonDisabledReason: () => defaultDisabledReason,
  error: "",
  isButtonEnabled: () => true,
  isLoading: false,
  reload: () => {},
  settings: defaultSiteSettings,
});

function readButtonControl(settings, buttonKey) {
  const directControl = settings.buttonControls?.[buttonKey];
  const listedControl = settings.buttons?.find((button) => button.buttonKey === buttonKey);
  const control = directControl || listedControl;

  if (control) {
    return {
      ...control,
      disabledReason: control.disabledReason || settings.homepageDisabledReason || defaultDisabledReason,
      isEnabled: control.isEnabled !== false,
    };
  }

  const legacyKey = legacyButtonMap[buttonKey];

  return {
    buttonKey,
    disabledReason: settings.homepageDisabledReason || defaultDisabledReason,
    isEnabled: legacyKey ? settings[legacyKey] !== false : true,
  };
}

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSiteSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSettings = useCallback(async () => {
    try {
      setError("");
      setIsLoading(true);
      setSettings(await getSiteSettings());
    } catch (requestError) {
      setError(requestError?.message || "Website settings could not be loaded.");
      setSettings(defaultSiteSettings);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    const handleSettingsUpdated = (event) => {
      setSettings({
        ...defaultSiteSettings,
        ...(event.detail || {}),
      });
    };

    window.addEventListener("st-gabriel:settings-updated", handleSettingsUpdated);
    return () => window.removeEventListener("st-gabriel:settings-updated", handleSettingsUpdated);
  }, []);

  useEffect(() => {
    document.title = settings.websiteTitle || settings.churchName;

    const metaFields = [
      { name: "description", value: settings.metaDescription },
      { name: "keywords", value: settings.keywords },
    ];

    metaFields.forEach(({ name, value }) => {
      let meta = document.querySelector(`meta[name="${name}"]`);

      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", name);
        document.head.appendChild(meta);
      }

      meta.setAttribute("content", value || "");
    });
  }, [settings]);

  const value = useMemo(() => {
    const getButtonControl = (buttonKey) => readButtonControl(settings, buttonKey);
    const isButtonEnabled = (buttonKey) => getButtonControl(buttonKey).isEnabled;
    const getButtonDisabledReason = (buttonKey) => getButtonControl(buttonKey).disabledReason || defaultDisabledReason;

    return {
      error,
      getButtonControl,
      getButtonDisabledReason,
      isButtonEnabled,
      isLoading,
      reload: loadSettings,
      settings,
    };
  }, [error, isLoading, loadSettings, settings]);

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
