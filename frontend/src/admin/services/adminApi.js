import axios from "axios";
import { adminModules, defaultSettings, donationRecords } from "../data/adminData";
import { API_BASE_URL } from "../../api/axios";

const adminTokenKey = "stGabrielAdminToken";
const adminUserKey = "stGabrielAdminUser";
const legacySessionKey = "stGabrielAdminSession";
const apiBaseUrl = API_BASE_URL;

let globalErrorHandler = null;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getToken() {
  if (!canUseStorage()) return null;

  try {
    return localStorage.getItem(adminTokenKey);
  } catch {
    return null;
  }
}

export function setToken(token) {
  if (!token) return removeToken();
  if (!canUseStorage()) return;

  try {
    localStorage.setItem(adminTokenKey, token);
  } catch {
    // Storage can fail in private browsing; the route guard will ask for login again.
  }
}

export function removeToken() {
  if (!canUseStorage()) return;

  try {
    localStorage.removeItem(adminTokenKey);
  } catch {
    // Ignore storage cleanup failures.
  }
}

export function getAdmin() {
  if (!canUseStorage()) return null;

  try {
    return JSON.parse(localStorage.getItem(adminUserKey) || localStorage.getItem(legacySessionKey) || "null");
  } catch {
    return null;
  }
}

export function setAdmin(admin) {
  if (!admin) return removeAdmin();
  if (!canUseStorage()) return;

  try {
    localStorage.setItem(adminUserKey, JSON.stringify(admin));
    localStorage.setItem(legacySessionKey, JSON.stringify(admin));
  } catch {
    // Ignore storage persistence failures.
  }
}

export function removeAdmin() {
  if (!canUseStorage()) return;

  try {
    localStorage.removeItem(adminUserKey);
    localStorage.removeItem(legacySessionKey);
  } catch {
    // Ignore storage cleanup failures.
  }
}

export function logoutAdmin() {
  removeToken();
  removeAdmin();
}

export function setAdminApiErrorHandler(handler) {
  globalErrorHandler = typeof handler === "function" ? handler : null;
}

function normalizeApiError(error) {
  const status = error?.response?.status || 0;
  const data = error?.response?.data || {};
  const defaultMessage = error?.code === "ECONNABORTED"
    ? "The server took too long to respond. Please try again."
    : !error?.response
      ? "The admin API is unavailable. Please confirm the backend server is running."
      : "Something went wrong while communicating with the server.";
  const message = data.message || data.error || defaultMessage || error?.message;

  return {
    data,
    isNetworkError: !error?.response,
    message,
    originalError: error,
    status,
  };
}

function handleApiError(error) {
  const normalizedError = normalizeApiError(error);

  if (normalizedError.status === 401) {
    logoutAdmin();
  }

  globalErrorHandler?.(normalizedError);

  return Promise.reject(normalizedError);
}

export const adminHttp = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

adminHttp.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(normalizeApiError(error)),
);

adminHttp.interceptors.response.use((response) => response, handleApiError);

export const adminApi = {
  delete: async (url, config) => {
    const { data } = await adminHttp.delete(url, config);
    return data;
  },
  get: async (url, config) => {
    const { data } = await adminHttp.get(url, config);
    return data;
  },
  patch: async (url, payload, config) => {
    const { data } = await adminHttp.patch(url, payload, config);
    return data;
  },
  post: async (url, payload, config) => {
    const { data } = await adminHttp.post(url, payload, config);
    return data;
  },
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
