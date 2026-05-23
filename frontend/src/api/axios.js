import axios from "axios";

const adminTokenKey = "stGabrielAdminToken";
const adminUserKey = "stGabrielAdminUser";
const legacyAdminSessionKey = "stGabrielAdminSession";
const userTokenKey = "stGabrielUserToken";
const userProfileKey = "stGabrielUserProfile";
const userRememberKey = "stGabrielUserRemember";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStorage(key) {
  if (!canUseStorage()) return null;

  try {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value, { remember = true } = {}) {
  if (!canUseStorage()) return;

  try {
    if (value === null || value === undefined || value === "") {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } else {
      const primaryStorage = remember ? localStorage : sessionStorage;
      const secondaryStorage = remember ? sessionStorage : localStorage;
      secondaryStorage.removeItem(key);
      primaryStorage.setItem(key, value);
    }
  } catch {
    // Storage can fail in private browsing; the request lifecycle can continue.
  }
}

function readJsonStorage(primaryKey, fallbackKey = "") {
  const raw = readStorage(primaryKey) || (fallbackKey ? readStorage(fallbackKey) : "");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJsonStorage(key, value) {
  writeStorage(key, value ? JSON.stringify(value) : null);
}

function writeUserJsonStorage(key, value) {
  const remember = readStorage(userRememberKey) === "true";
  writeStorage(key, value ? JSON.stringify(value) : null, { remember });
}

export function getAdminToken() {
  return readStorage(adminTokenKey) || "";
}

export function setAdminToken(token) {
  writeStorage(adminTokenKey, token || null);
}

export function removeAdminToken() {
  setAdminToken(null);
}

export function getStoredAdmin() {
  return readJsonStorage(adminUserKey, legacyAdminSessionKey);
}

export function setStoredAdmin(admin) {
  writeJsonStorage(adminUserKey, admin);
  writeJsonStorage(legacyAdminSessionKey, admin);
}

export function removeStoredAdmin() {
  setStoredAdmin(null);
}

export function clearAdminSession() {
  removeAdminToken();
  removeStoredAdmin();
}

export function getUserToken() {
  return readStorage(userTokenKey) || "";
}

export function setUserToken(token, options = {}) {
  const remember = options.remember ?? readStorage(userRememberKey) === "true";
  writeStorage(userTokenKey, token || null, { remember });
  writeStorage(userRememberKey, token ? String(Boolean(remember)) : null, { remember });
}

export function removeUserToken() {
  setUserToken(null);
}

export function getStoredUser() {
  return readJsonStorage(userProfileKey);
}

export function setStoredUser(user) {
  writeUserJsonStorage(userProfileKey, user);
}

export function removeStoredUser() {
  setStoredUser(null);
}

export function clearUserSession() {
  removeUserToken();
  removeStoredUser();
}

function cleanMessage(error, data, status) {
  const details = data?.details || error?.details || [];
  const validationMessage = Array.isArray(details) && details.length ? details[0]?.message : "";
  const serverMessage = data?.message || data?.error || validationMessage;

  if (serverMessage) return serverMessage;
  if (error?.code === "ECONNABORTED") return "The request took too long. Please try again.";
  if (!error?.response) return "The backend API is unavailable. Please confirm the server is running.";
  if (status === 401) return "Please sign in again to continue.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  if (status === 503) return "The website is temporarily unavailable for maintenance.";

  return "Something went wrong. Please try again.";
}

export function normalizeApiError(error) {
  const status = error?.response?.status || error?.status || 0;
  const data = error?.response?.data || error?.data || {};
  const details = data.details || error?.details || [];
  const maintenance = data.maintenance || null;

  return {
    data,
    details,
    isForbidden: status === 403,
    isMaintenance: status === 503,
    isNetworkError: !error?.response,
    isRateLimited: status === 429,
    isUnauthorized: status === 401,
    maintenance,
    message: cleanMessage(error, data, status),
    originalError: error,
    status,
    success: false,
  };
}

function emitApiError(normalizedError) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("st-gabriel:api-error", { detail: normalizedError }));
}

function tokenForScope(tokenScope) {
  if (tokenScope === "user") return getUserToken();
  if (tokenScope === "none") return "";
  return getAdminToken();
}

function handleUnauthorized(tokenScope) {
  if (tokenScope === "user") {
    clearUserSession();
    return;
  }

  if (tokenScope === "admin") {
    clearAdminSession();
  }
}

export function createApiClient({ tokenScope = "admin" } = {}) {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 30000,
    withCredentials: true,
  });

  client.interceptors.request.use((config) => {
    const token = tokenForScope(config.tokenScope || tokenScope);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const normalizedError = normalizeApiError(error);

      if (normalizedError.status === 401) {
        handleUnauthorized(error?.config?.tokenScope || tokenScope);
      }

      emitApiError(normalizedError);
      return Promise.reject(normalizedError);
    },
  );

  return client;
}

export const api = createApiClient({ tokenScope: "admin" });
export const adminApiClient = api;
export const userApiClient = createApiClient({ tokenScope: "user" });
export const publicApiClient = createApiClient({ tokenScope: "none" });

async function readData(request) {
  const { data } = await request;
  return data;
}

export function apiGet(url, config) {
  return readData(api.get(url, config));
}

export function apiPost(url, payload, config) {
  return readData(api.post(url, payload, config));
}

export function apiPatch(url, payload, config) {
  return readData(api.patch(url, payload, config));
}

export function apiDelete(url, config) {
  return readData(api.delete(url, config));
}

export function adminGet(url, config) {
  return readData(adminApiClient.get(url, config));
}

export function adminPost(url, payload, config) {
  return readData(adminApiClient.post(url, payload, config));
}

export function adminPatch(url, payload, config) {
  return readData(adminApiClient.patch(url, payload, config));
}

export function adminDelete(url, config) {
  return readData(adminApiClient.delete(url, config));
}

export function userGet(url, config) {
  return readData(userApiClient.get(url, config));
}

export function userPost(url, payload, config) {
  return readData(userApiClient.post(url, payload, config));
}

export function userPatch(url, payload, config) {
  return readData(userApiClient.patch(url, payload, config));
}

export function userDelete(url, config) {
  return readData(userApiClient.delete(url, config));
}

export function publicGet(url, config) {
  return readData(publicApiClient.get(url, config));
}

export function publicPost(url, payload, config) {
  return readData(publicApiClient.post(url, payload, config));
}

export function getApiSuccessMessage(response, fallback = "Request completed successfully.") {
  return response?.message || response?.data?.message || fallback;
}

export function getApiErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  return error?.message || error?.data?.message || fallback;
}

export const getToken = getAdminToken;
export const setToken = setAdminToken;
export const removeToken = removeAdminToken;
