import {
  getCurrentAdmin,
  getToken,
  isAdminAuthenticated,
  loginAdmin,
  logoutAdmin,
  setAdmin,
  setToken,
  verifyCurrentAdmin,
} from "../../services/authService";

export async function login(email, password) {
  return loginAdmin(email, password);
}

export function logout() {
  logoutAdmin();
}

export { getCurrentAdmin };

export async function verifyAdmin() {
  return verifyCurrentAdmin();
}

export function isAuthenticated() {
  return isAdminAuthenticated();
}

export function getAdminSession() {
  return getCurrentAdmin();
}

export function createAdminSession(email) {
  const admin = {
    email,
    name: "Parish Administrator",
    role: "Website Manager",
    signedInAt: new Date().toISOString(),
  };

  setAdmin(admin);
  setToken(`demo-admin-token-${Date.now()}`);
  return admin;
}

export function clearAdminSession() {
  logoutAdmin();
}

export { getToken };
