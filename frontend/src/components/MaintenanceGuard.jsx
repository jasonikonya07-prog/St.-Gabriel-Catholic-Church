import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Maintenance from "../pages/Maintenance";
import { defaultSiteSettings, getPublicSettings } from "../services/settingsService";

function isMaintenanceEnabled(settings) {
  return Boolean(settings?.maintenanceMode || settings?.maintenanceEnabled);
}

function normalizeMaintenanceSettings(maintenance = {}) {
  return {
    maintenanceEnabled: Boolean(maintenance.maintenanceMode ?? maintenance.enabled),
    maintenanceExpectedBack: maintenance.maintenanceExpectedBack ?? maintenance.expectedBack ?? null,
    maintenanceMessage: maintenance.maintenanceMessage ?? maintenance.message ?? defaultSiteSettings.maintenanceMessage,
    maintenanceMode: Boolean(maintenance.maintenanceMode ?? maintenance.enabled),
    maintenanceTitle: maintenance.maintenanceTitle ?? maintenance.title ?? defaultSiteSettings.maintenanceTitle,
  };
}

function MaintenanceLoading() {
  return (
    <section className="grid min-h-screen place-items-center bg-navy px-4 text-center text-white">
      <div className="rounded-lg border border-gold/25 bg-white/10 px-7 py-6 shadow-premium backdrop-blur">
        <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-gold">St. Gabriel Church</p>
        <p className="mt-3 font-display text-3xl font-bold text-cream">Checking website status...</p>
      </div>
    </section>
  );
}

function MaintenanceGuard({ children }) {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith("/admin");
  const [state, setState] = useState({
    isLoading: !isAdminPath,
    settings: defaultSiteSettings,
  });

  const loadMaintenanceSettings = useCallback(async () => {
    if (isAdminPath) {
      setState((current) => ({ ...current, isLoading: false }));
      return;
    }

    try {
      setState((current) => ({ ...current, isLoading: true }));
      const publicSettings = await getPublicSettings();
      setState({
        isLoading: false,
        settings: {
          ...defaultSiteSettings,
          ...publicSettings,
        },
      });
    } catch {
      setState({
        isLoading: false,
        settings: defaultSiteSettings,
      });
    }
  }, [isAdminPath]);

  useEffect(() => {
    loadMaintenanceSettings();
  }, [loadMaintenanceSettings]);

  useEffect(() => {
    const handleSettingsUpdated = (event) => {
      setState((current) => ({
        ...current,
        settings: {
          ...current.settings,
          ...(event.detail || {}),
        },
      }));
    };

    window.addEventListener("st-gabriel:settings-updated", handleSettingsUpdated);
    return () => window.removeEventListener("st-gabriel:settings-updated", handleSettingsUpdated);
  }, []);

  useEffect(() => {
    const handleMaintenance = (event) => {
      setState((current) => ({
        isLoading: false,
        settings: {
          ...current.settings,
          ...normalizeMaintenanceSettings(event.detail || {}),
        },
      }));
    };

    window.addEventListener("st-gabriel:maintenance", handleMaintenance);
    return () => window.removeEventListener("st-gabriel:maintenance", handleMaintenance);
  }, []);

  const maintenanceActive = useMemo(() => isMaintenanceEnabled(state.settings), [state.settings]);

  if (isAdminPath) {
    return children;
  }

  if (state.isLoading) {
    return <MaintenanceLoading />;
  }

  if (maintenanceActive) {
    return <Maintenance settings={state.settings} />;
  }

  return children;
}

export default MaintenanceGuard;
