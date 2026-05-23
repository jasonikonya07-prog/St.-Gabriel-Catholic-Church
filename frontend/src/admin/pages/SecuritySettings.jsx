import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaCog,
  FaExclamationCircle,
  FaLock,
  FaPowerOff,
  FaSave,
  FaShieldAlt,
  FaSyncAlt,
  FaToggleOff,
  FaToggleOn,
} from "react-icons/fa";
import LoadingSkeleton from "../components/LoadingSkeleton";
import PageHeader from "../components/PageHeader";
import { formatDateTime } from "../utils/formatters";
import { getAdminSettings, updateAuthOptions, updateButtonControl, updateMaintenance } from "../../services/settingsService";
import { cardReveal, fadeUp } from "../../utils/animations";

const defaultButtonControls = [
  { buttonKey: "donate_now", buttonLabel: "Donate Now" },
  { buttonKey: "view_mass_times", buttonLabel: "View Mass Times" },
  { buttonKey: "contact_us", buttonLabel: "Contact Us" },
  { buttonKey: "prayer_request", buttonLabel: "Prayer Request" },
  { buttonKey: "newsletter_subscribe", buttonLabel: "Newsletter Subscribe" },
];

const defaultMaintenance = {
  maintenanceExpectedBack: "",
  maintenanceMessage: "We are currently improving our website. Please check back soon.",
  maintenanceMode: false,
  maintenanceTitle: "Website Under Maintenance",
};

function toDateTimeInput(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function fromDateTimeInput(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeButtonRows(settings) {
  const rowsByKey = Object.fromEntries((settings.buttons || []).map((button) => [button.buttonKey, button]));

  return defaultButtonControls.map((button) => {
    const control = settings.buttonControls?.[button.buttonKey] || rowsByKey[button.buttonKey] || {};

    return {
      buttonKey: button.buttonKey,
      buttonLabel: control.buttonLabel || button.buttonLabel,
      disabledReason: control.disabledReason || "",
      isEnabled: control.isEnabled !== false,
    };
  });
}

function ToggleSwitch({ checked, label, onChange }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={`inline-flex min-h-11 max-w-full flex-wrap items-center justify-center gap-3 rounded-full border px-4 text-sm font-extrabold transition focus:outline-none focus:ring-4 focus:ring-gold/20 ${
        checked ? "border-gold/40 bg-gold text-navy" : "border-navy/10 bg-cream text-warm hover:text-navy"
      }`}
    >
      {checked ? <FaToggleOn className="h-5 w-5" /> : <FaToggleOff className="h-5 w-5" />}
      {label}
    </button>
  );
}

function MessageBanner({ message, type = "success" }) {
  if (!message) return null;

  const isError = type === "error";

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={`flex items-start gap-3 rounded-3xl border p-5 text-sm font-extrabold leading-6 shadow-soft ${
        isError ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
      role={isError ? "alert" : "status"}
    >
      {isError ? <FaExclamationCircle className="mt-1 h-4 w-4 flex-none" /> : <FaCheckCircle className="mt-1 h-4 w-4 flex-none" />}
      <span className="min-w-0 break-words">{message}</span>
    </motion.div>
  );
}

function SummaryCard({ icon: Icon, label, tone = "navy", value }) {
  const isGold = tone === "gold";

  return (
    <div className="min-w-0 rounded-3xl border border-navy/10 bg-white p-5 shadow-soft">
      <span className={`grid h-11 w-11 place-items-center rounded-2xl ${isGold ? "bg-gold text-navy" : "bg-navy text-gold"}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 break-words text-xs font-extrabold uppercase tracking-[0.12em] text-warm sm:tracking-[0.18em]">{label}</p>
      <p className="mt-2 break-words font-display text-2xl font-bold text-navy">{value}</p>
    </div>
  );
}

function SectionCard({ children, description, icon: Icon, title }) {
  return (
    <motion.section variants={cardReveal} initial="hidden" animate="visible" className="min-w-0 rounded-3xl border border-navy/10 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex min-w-0 gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-navy text-gold">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="break-words font-display text-2xl font-bold text-navy sm:text-3xl">{title}</h2>
          <p className="mt-1 break-words text-sm font-semibold leading-6 text-warm">{description}</p>
        </div>
      </div>
      <div className="mt-6 min-w-0">{children}</div>
    </motion.section>
  );
}

function SecuritySettings() {
  const [authOptions, setAuthOptions] = useState({ allowRegistration: true, allowUserLogin: true });
  const [buttons, setButtons] = useState(defaultButtonControls.map((button) => ({ ...button, disabledReason: "", isEnabled: true })));
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState("");
  const [maintenance, setMaintenance] = useState(defaultMaintenance);
  const [saving, setSaving] = useState({ auth: false, buttonKey: "", maintenance: false });
  const [success, setSuccess] = useState("");

  const loadSettings = async () => {
    try {
      setError("");
      setIsLoading(true);
      const settings = await getAdminSettings();

      setMaintenance({
        maintenanceExpectedBack: toDateTimeInput(settings.maintenanceExpectedBack),
        maintenanceMessage: settings.maintenanceMessage || defaultMaintenance.maintenanceMessage,
        maintenanceMode: Boolean(settings.maintenanceMode || settings.maintenanceEnabled),
        maintenanceTitle: settings.maintenanceTitle || defaultMaintenance.maintenanceTitle,
      });
      setAuthOptions({
        allowRegistration: settings.allowRegistration !== false,
        allowUserLogin: settings.allowUserLogin !== false,
      });
      setButtons(normalizeButtonRows(settings));
      setLastUpdatedAt(settings.updatedAt || settings.lastUpdatedAt || "");
    } catch (requestError) {
      setError(requestError?.message || "Security settings could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const summary = useMemo(
    () => [
      {
        icon: maintenance.maintenanceMode ? FaPowerOff : FaShieldAlt,
        label: "Maintenance",
        tone: maintenance.maintenanceMode ? "gold" : "navy",
        value: maintenance.maintenanceMode ? "Enabled" : "Disabled",
      },
      {
        icon: FaLock,
        label: "Registration",
        tone: authOptions.allowRegistration ? "navy" : "gold",
        value: authOptions.allowRegistration ? "Allowed" : "Disabled",
      },
      {
        icon: FaShieldAlt,
        label: "User Login",
        tone: authOptions.allowUserLogin ? "navy" : "gold",
        value: authOptions.allowUserLogin ? "Allowed" : "Disabled",
      },
      {
        icon: FaClock,
        label: "Last Settings Update",
        tone: "gold",
        value: lastUpdatedAt ? formatDateTime(lastUpdatedAt) : "Current session",
      },
    ],
    [authOptions.allowRegistration, authOptions.allowUserLogin, lastUpdatedAt, maintenance.maintenanceMode],
  );

  const saveMaintenance = async (event) => {
    event.preventDefault();

    if (!maintenance.maintenanceTitle.trim() || !maintenance.maintenanceMessage.trim()) {
      setError("Maintenance title and message are required.");
      return;
    }

    try {
      setError("");
      setSuccess("");
      setSaving((current) => ({ ...current, maintenance: true }));
      const response = await updateMaintenance({
        maintenanceExpectedBack: fromDateTimeInput(maintenance.maintenanceExpectedBack),
        maintenanceMessage: maintenance.maintenanceMessage.trim(),
        maintenanceMode: maintenance.maintenanceMode,
        maintenanceTitle: maintenance.maintenanceTitle.trim(),
      });
      const settings = response?.settings || response?.data?.settings || {};
      setLastUpdatedAt(settings.updatedAt || new Date().toISOString());
      setSuccess("Maintenance settings saved successfully.");
    } catch (requestError) {
      setError(requestError?.message || "Maintenance settings could not be saved.");
    } finally {
      setSaving((current) => ({ ...current, maintenance: false }));
    }
  };

  const saveAuthOptions = async (event) => {
    event.preventDefault();

    try {
      setError("");
      setSuccess("");
      setSaving((current) => ({ ...current, auth: true }));
      await updateAuthOptions(authOptions);
      setLastUpdatedAt(new Date().toISOString());
      setSuccess("Authentication controls saved successfully.");
    } catch (requestError) {
      setError(requestError?.message || "Authentication controls could not be saved.");
    } finally {
      setSaving((current) => ({ ...current, auth: false }));
    }
  };

  const updateButton = (buttonKey, patch) => {
    setSuccess("");
    setButtons((current) => current.map((button) => (button.buttonKey === buttonKey ? { ...button, ...patch } : button)));
  };

  const saveButton = async (button) => {
    try {
      setError("");
      setSuccess("");
      setSaving((current) => ({ ...current, buttonKey: button.buttonKey }));
      await updateButtonControl(button.buttonKey, {
        disabledReason: button.disabledReason,
        isEnabled: button.isEnabled,
      });
      setLastUpdatedAt(new Date().toISOString());
      setSuccess(`${button.buttonLabel} control saved successfully.`);
    } catch (requestError) {
      setError(requestError?.message || `${button.buttonLabel} control could not be saved.`);
    } finally {
      setSaving((current) => ({ ...current, buttonKey: "" }));
    }
  };

  if (isLoading) return <LoadingSkeleton rows={7} />;

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Security Settings" title="Website Security Controls" onAction={loadSettings} actionLabel="Refresh" actionIcon={FaSyncAlt}>
        Control maintenance mode, public account access, and homepage action availability from one secure workspace.
      </PageHeader>

      <MessageBanner message={error} type="error" />
      <MessageBanner message={success} />

      <section className="grid gap-4">
        <div className="min-w-0">
          <p className="break-words text-xs font-extrabold uppercase tracking-[0.16em] text-gold sm:tracking-[0.22em]">Security Summary</p>
          <h2 className="mt-1 break-words font-display text-3xl font-bold text-navy">Current Control Status</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => (
            <SummaryCard key={item.label} {...item} />
          ))}
        </div>
      </section>

      <form onSubmit={saveMaintenance}>
        <SectionCard
          icon={FaPowerOff}
          title="Maintenance Mode Control"
          description="Show a maintenance screen for visitors while admin login remains available."
        >
          <div className="grid gap-5">
            <ToggleSwitch
              checked={maintenance.maintenanceMode}
              label={maintenance.maintenanceMode ? "Maintenance ON" : "Maintenance OFF"}
              onChange={(value) => setMaintenance((current) => ({ ...current, maintenanceMode: value }))}
            />

            <div className="grid min-w-0 gap-4 lg:grid-cols-2">
              <label className="grid min-w-0 gap-2 text-sm font-bold text-navy">
                Maintenance Title
                <input
                  value={maintenance.maintenanceTitle}
                  onChange={(event) => setMaintenance((current) => ({ ...current, maintenanceTitle: event.target.value }))}
                  className="min-h-12 w-full min-w-0 rounded-2xl border border-navy/10 bg-cream px-4 text-sm font-semibold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
                />
              </label>

              <label className="grid min-w-0 gap-2 text-sm font-bold text-navy">
                Expected Back Time
                <span className="relative min-w-0">
                  <FaCalendarAlt className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
                  <input
                    type="datetime-local"
                    value={maintenance.maintenanceExpectedBack}
                    onChange={(event) => setMaintenance((current) => ({ ...current, maintenanceExpectedBack: event.target.value }))}
                    className="min-h-12 w-full min-w-0 rounded-2xl border border-navy/10 bg-cream px-4 pl-11 text-sm font-semibold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
                  />
                </span>
              </label>
            </div>

            <label className="grid min-w-0 gap-2 text-sm font-bold text-navy">
              Maintenance Message
              <textarea
                rows={5}
                value={maintenance.maintenanceMessage}
                onChange={(event) => setMaintenance((current) => ({ ...current, maintenanceMessage: event.target.value }))}
                className="w-full min-w-0 resize-none rounded-2xl border border-navy/10 bg-cream px-4 py-3 text-sm font-semibold leading-7 text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
              />
            </label>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving.maintenance}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gold px-5 text-sm font-extrabold uppercase tracking-[0.1em] text-navy shadow-soft transition hover:bg-navy hover:text-gold disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-6 sm:tracking-[0.12em]"
              >
                <FaSave className="h-4 w-4" />
                {saving.maintenance ? "Saving..." : "Save Maintenance"}
              </button>
            </div>
          </div>
        </SectionCard>
      </form>

      <form onSubmit={saveAuthOptions}>
        <SectionCard icon={FaLock} title="Auth Controls" description="Enable or pause public account login and registration.">
          <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <ToggleSwitch
                checked={authOptions.allowUserLogin}
                label={authOptions.allowUserLogin ? "User Login ON" : "User Login OFF"}
                onChange={(value) => setAuthOptions((current) => ({ ...current, allowUserLogin: value }))}
              />
              <ToggleSwitch
                checked={authOptions.allowRegistration}
                label={authOptions.allowRegistration ? "Registration ON" : "Registration OFF"}
                onChange={(value) => setAuthOptions((current) => ({ ...current, allowRegistration: value }))}
              />
            </div>

            <button
              type="submit"
              disabled={saving.auth}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-navy px-5 text-sm font-extrabold uppercase tracking-[0.1em] text-gold shadow-soft transition hover:bg-gold hover:text-navy disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-6 sm:tracking-[0.12em]"
            >
              <FaSave className="h-4 w-4" />
              {saving.auth ? "Saving..." : "Save Auth"}
            </button>
          </div>
        </SectionCard>
      </form>

      <SectionCard
        icon={FaCog}
        title="Homepage Button Controls"
        description="Enable or disable public homepage actions and explain temporary pauses to visitors."
      >
        <div className="grid gap-4">
          {buttons.map((button) => (
            <div key={button.buttonKey} className="min-w-0 rounded-2xl border border-navy/10 bg-cream p-4">
              <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,16rem)_auto] lg:items-center">
                <div className="min-w-0">
                  <p className="break-words font-display text-2xl font-bold text-navy">{button.buttonLabel}</p>
                  <p className="mt-1 break-words text-xs font-extrabold uppercase tracking-[0.1em] text-warm sm:tracking-[0.16em]">{button.buttonKey}</p>
                </div>

                <label className="grid min-w-0 gap-2 text-sm font-bold text-navy">
                  Disabled Reason
                  <input
                    value={button.disabledReason || ""}
                    onChange={(event) => updateButton(button.buttonKey, { disabledReason: event.target.value })}
                    placeholder="This feature is temporarily unavailable."
                    className="min-h-12 w-full min-w-0 rounded-2xl border border-navy/10 bg-white px-4 text-sm font-semibold text-navy outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"
                  />
                </label>

                <div className="flex min-w-0 flex-wrap items-center gap-3 lg:justify-end">
                  <ToggleSwitch
                    checked={button.isEnabled}
                    label={button.isEnabled ? "Enabled" : "Disabled"}
                    onChange={(value) => updateButton(button.buttonKey, { isEnabled: value })}
                  />
                  <button
                    type="button"
                    disabled={saving.buttonKey === button.buttonKey}
                    onClick={() => saveButton(button)}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-gold px-5 text-xs font-extrabold uppercase tracking-[0.12em] text-navy shadow-soft transition hover:bg-navy hover:text-gold disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    <FaSave className="h-3.5 w-3.5" />
                    {saving.buttonKey === button.buttonKey ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export default SecuritySettings;
