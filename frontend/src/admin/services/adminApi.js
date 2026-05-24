import { adminModules, defaultSettings, donationRecords } from "../data/adminData";
import {
  adminApiClient,
  clearAdminSession,
  getAdminToken,
  getStoredAdmin,
  removeAdminToken,
  removeStoredAdmin,
  setAdminToken,
  setStoredAdmin,
} from "../../api/axios";

let globalErrorHandler = null;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getToken() {
  return getAdminToken() || null;
}

export function setToken(token) {
  setAdminToken(token);
}

export function removeToken() {
  removeAdminToken();
}

export function getAdmin() {
  return getStoredAdmin();
}

export function setAdmin(admin) {
  setStoredAdmin(admin);
}

export function removeAdmin() {
  removeStoredAdmin();
}

export function logoutAdmin() {
  clearAdminSession();
}

export function setAdminApiErrorHandler(handler) {
  globalErrorHandler = typeof handler === "function" ? handler : null;
}

export const adminHttp = adminApiClient;

async function readAdminData(request) {
  try {
    const { data } = await request;
    return data;
  } catch (error) {
    globalErrorHandler?.(error);
    throw error;
  }
}

export const adminApi = {
  delete: (url, config) => readAdminData(adminHttp.delete(url, config)),
  get: (url, config) => readAdminData(adminHttp.get(url, config)),
  patch: (url, payload, config) => readAdminData(adminHttp.patch(url, payload, config)),
  post: (url, payload, config) => readAdminData(adminHttp.post(url, payload, config)),
};

const storagePrefix = "stGabrielAdmin";

function storageKey(resource) {
  return `${storagePrefix}:${resource}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readCollection(resource, fallback) {
  try {
    const stored = localStorage.getItem(storageKey(resource));
    if (stored) return JSON.parse(stored);
  } catch {
    // Local storage can fail in private browsing; fallback keeps the admin usable.
  }

  return clone(fallback);
}

function writeCollection(resource, rows) {
  if (!canUseStorage()) return rows;

  try {
    localStorage.setItem(storageKey(resource), JSON.stringify(rows));
  } catch {
    // Keep in-memory result usable even if persistence fails.
  }

  return rows;
}

function findModule(moduleId) {
  return adminModules.find((module) => module.id === moduleId);
}

export async function getRecords(moduleId) {
  const module = findModule(moduleId);
  const fallback = module?.initialRows || [];
  return readCollection(moduleId, fallback);
}

export async function saveRecord(moduleId, record) {
  const rows = await getRecords(moduleId);
  const nextRecord = {
    ...record,
    id: record.id || `${moduleId}-${Date.now()}`,
    updatedAt: new Date().toISOString(),
  };
  const exists = rows.some((row) => row.id === nextRecord.id);
  const nextRows = exists ? rows.map((row) => (row.id === nextRecord.id ? nextRecord : row)) : [nextRecord, ...rows];

  return writeCollection(moduleId, nextRows);
}

export async function deleteRecord(moduleId, recordId) {
  const rows = await getRecords(moduleId);
  return writeCollection(
    moduleId,
    rows.filter((row) => row.id !== recordId),
  );
}

export async function getDonationRecords() {
  return readCollection("donations", donationRecords);
}

export async function saveDonationRecord(record) {
  const rows = await getDonationRecords();
  const nextRecord = {
    ...record,
    amount: Number(record.amount),
    id: record.id || `don-${Date.now()}`,
    updatedAt: new Date().toISOString(),
  };
  const exists = rows.some((row) => row.id === nextRecord.id);
  const nextRows = exists ? rows.map((row) => (row.id === nextRecord.id ? nextRecord : row)) : [nextRecord, ...rows];

  return writeCollection("donations", nextRows);
}

export async function deleteDonationRecord(recordId) {
  const rows = await getDonationRecords();
  return writeCollection(
    "donations",
    rows.filter((row) => row.id !== recordId),
  );
}

export async function getSettings() {
  return readCollection("settings", defaultSettings);
}

export async function saveSettings(settings) {
  if (canUseStorage()) {
    try {
      localStorage.setItem(storageKey("settings"), JSON.stringify(settings));
    } catch {
      // Ignore storage persistence failures.
    }
  }
  return settings;
}
