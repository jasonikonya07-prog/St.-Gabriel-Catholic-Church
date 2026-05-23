import {
  clearAdminSession,
  getMe,
  getAdminToken,
  getStoredAdmin,
  isAdminAuthenticated,
  login as loginAdmin,
  logout as logoutAdmin,
  setAdminToken,
  setStoredAdmin,
} from "./adminAuthService";

export async function verifyCurrentAdmin() {
  if (!getAdminToken()) {
    clearAdminSession();
    return null;
  }

  const admin = await getMe();

  if (!admin?.email) {
    clearAdminSession();
    throw new Error("Your admin session could not be verified.");
  }

  return admin;
}

export function getCurrentAdmin() {
  return getStoredAdmin();
}

export {
  clearAdminSession,
  getAdminToken as getToken,
  isAdminAuthenticated,
  loginAdmin,
  logoutAdmin,
  setStoredAdmin as setAdmin,
  setAdminToken as setToken,
};
