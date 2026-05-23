import { adminApi } from "./adminApi";

export async function getSettings() {
  return adminApi.get("/settings");
}

export async function saveSettings(payload) {
  const response = await adminApi.patch("/settings", payload);
  const settings = response?.settings || response?.data?.settings || response;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("st-gabriel:settings-updated", { detail: settings }));
  }

  return response;
}
