import {
  adminGet,
  adminPost,
  clearAdminSession,
  getAdminToken,
  getStoredAdmin,
  setAdminToken,
  setStoredAdmin,
} from "../api/axios";

function readAdminSession(response) {
  const token = response?.accessToken || response?.token || response?.data?.accessToken || response?.data?.token || "";
  const admin = response?.admin || response?.data?.admin || null;
  return { admin, token };
}

function saveAdminSession(session) {
  if (session.token) setAdminToken(session.token);
  if (session.admin) setStoredAdmin(session.admin);
}

export async function login(email, password) {
  const response = await adminPost("/admin-auth/login", {
    email: String(email || "").trim().toLowerCase(),
    password,
  });
  const session = readAdminSession(response);

  if (!session.token || !session.admin) {
    throw new Error("The server did not return a valid admin session.");
  }

  saveAdminSession(session);
  return { ...response, ...session };
}

export async function logout() {
  try {
    await adminPost("/admin-auth/logout");
  } finally {
    clearAdminSession();
  }
}

export async function getMe() {
  const response = await adminGet("/admin-auth/me");
  const admin = response?.admin || response?.data?.admin || null;

  if (admin) setStoredAdmin(admin);
  return admin;
}

export function isAdminAuthenticated() {
  return Boolean(getAdminToken());
}

export { clearAdminSession, getAdminToken, getStoredAdmin, setAdminToken, setStoredAdmin };

export const loginAdmin = login;
export const logoutAdmin = logout;
export const getCurrentAdmin = getMe;
