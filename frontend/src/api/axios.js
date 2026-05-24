import axios from "axios";

const adminTokenKey = "stGabrielAdminToken";
const adminUserKey = "stGabrielAdminUser";
const legacyAdminSessionKey = "stGabrielAdminSession";
const userTokenKey = "stGabrielUserToken";
const userProfileKey = "stGabrielUserProfile";
const userRememberKey = "stGabrielUserRemember";

const localApiPort = "5000";
const localApiPath = "/api";
const loopbackHosts = new Set(["localhost", "127.0.0.1", "::1"]);
let activeApiRequests = 0;

export const API_CONFIGURATION_MESSAGE =
  "The backend API is not configured for this deployment. Set VITE_API_URL to your deployed backend API URL ending in /api.";

function normalizeApiBaseUrl(value) {
  const trimmed = String(value || "")
    .trim()
    .replace(/\/+$/, "");

  if (!trimmed) return "";
  if (/\/api(?:\/|$)/.test(trimmed)) return trimmed;

  return `${trimmed}${localApiPath}`;
}

function isLoopbackHost(hostname) {
  const normalized = String(hostname || "").toLowerCase();
  return loopbackHosts.has(normalized) || normalized.startsWith("127.");
}

function isLoopbackApiUrl(url) {
  try {
    return isLoopbackHost(new URL(url).hostname);
  } catch {
    return false;
  }
}

function isLoopbackBrowser() {
  if (typeof window === "undefined") return false;
  return isLoopbackHost(window.location.hostname);
}

function getLocalApiBaseUrl() {
  if (!isLoopbackBrowser()) return "";
  return `http://${window.location.hostname}:${localApiPort}${localApiPath}`;
}

function getSameOriginApiBaseUrl() {
  if (typeof window === "undefined") return "";
  return localApiPath;
}

function resolveApiBaseUrl() {
  const configuredUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

  if (configuredUrl) {
    return isLoopbackApiUrl(configuredUrl) && !isLoopbackBrowser() ? "" : configuredUrl;
  }

  return getLocalApiBaseUrl() || getSameOriginApiBaseUrl();
}

export const API_BASE_URL = resolveApiBaseUrl();
export const isApiConfigured = Boolean(API_BASE_URL);

export function createApiConfigurationError() {
  const error = new Error(API_CONFIGURATION_MESSAGE);
  error.isApiConfigurationError = true;
  error.status = 0;
  return error;
}

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
  const maintenance = data?.maintenance || data?.data?.maintenance || null;
  const serverMessage = data?.message || data?.error || validationMessage;

  if (error?.isApiConfigurationError) return API_CONFIGURATION_MESSAGE;
  if (serverMessage) return serverMessage;
  if (error?.code === "ECONNABORTED") return "The request took too long. Please try again.";
  if (!error?.response) return "The backend API is unavailable. Please confirm the server is running.";
  if (status === 401) return "Please sign in again to continue.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  if (status === 503 && maintenance) return maintenance.message || maintenance.maintenanceMessage || "The website is temporarily unavailable for maintenance.";
  if (status === 503) return "The backend service is temporarily unavailable. Please try again shortly.";

  return "Something went wrong. Please try again.";
}

export function normalizeApiError(error) {
  const status = error?.response?.status || error?.status || 0;
  const data = error?.response?.data || error?.data || {};
  const details = data.details || error?.details || [];
  const maintenance = data.maintenance || data?.data?.maintenance || null;
  const isMaintenance = status === 503 && Boolean(maintenance || data.status === "maintenance");

  return {
    data,
    details,
    isAccountLocked: status === 423,
    isForbidden: status === 403,
    isApiConfigurationError: Boolean(error?.isApiConfigurationError),
    isMaintenance,
    isNetworkError: !error?.response && !error?.isApiConfigurationError,
    isRateLimited: status === 429,
    isServiceUnavailable: status === 503,
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

  if (normalizedError.isMaintenance && normalizedError.maintenance) {
    window.dispatchEvent(new CustomEvent("st-gabriel:maintenance", { detail: normalizedError.maintenance }));
  }

  window.dispatchEvent(new CustomEvent("st-gabriel:api-error", { detail: normalizedError }));
}

function emitApiLoadingState() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("st-gabriel:api-loading", {
      detail: {
        activeRequests: activeApiRequests,
        isLoading: activeApiRequests > 0,
      },
    }),
  );
}

function startApiRequest(config) {
  if (config.trackLoading === false) return config;

  activeApiRequests += 1;
  config.metadata = {
    ...(config.metadata || {}),
    tracksLoading: true,
  };
  emitApiLoadingState();

  return config;
}

function finishApiRequest(config) {
  if (!config?.metadata?.tracksLoading) return;

  activeApiRequests = Math.max(activeApiRequests - 1, 0);
  emitApiLoadingState();
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
    baseURL: API_BASE_URL || undefined,
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 30000,
    withCredentials: true,
  });

  client.interceptors.request.use((config) => {
    if (!isApiConfigured) {
      return Promise.reject(createApiConfigurationError());
    }

    const token = tokenForScope(config.tokenScope || tokenScope);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return startApiRequest(config);
  });

  client.interceptors.response.use(
    (response) => {
      finishApiRequest(response.config);
      return response;
    },
    (error) => {
      finishApiRequest(error?.config);
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
