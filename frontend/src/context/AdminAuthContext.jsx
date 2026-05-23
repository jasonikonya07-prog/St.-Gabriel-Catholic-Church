import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  clearAdminSession,
  getAdminToken,
  getMe,
  getStoredAdmin,
  login as loginAdminRequest,
  logout as logoutAdminRequest,
  setAdminToken,
  setStoredAdmin,
} from "../services/adminAuthService";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(getStoredAdmin);
  const [isChecking, setIsChecking] = useState(Boolean(getAdminToken()));

  const login = useCallback(async ({ admin: authenticatedAdmin, email, password, token } = {}) => {
    let session = { admin: authenticatedAdmin, token };

    if (!session.token && email && password) {
      session = await loginAdminRequest(email, password);
    }

    const nextAdmin =
      session.admin || authenticatedAdmin || {
        email,
        name: "Parish Administrator",
        role: "admin",
      };

    const signedInAdmin = {
      ...nextAdmin,
      signedInAt: nextAdmin.signedInAt || new Date().toISOString(),
    };

    if (session.token) setAdminToken(session.token);
    setStoredAdmin(signedInAdmin);
    setAdmin(signedInAdmin);

    return signedInAdmin;
  }, []);

  const verifyAdmin = useCallback(async () => {
    if (!getAdminToken()) {
      clearAdminSession();
      setAdmin(null);
      setIsChecking(false);
      return null;
    }

    try {
      setIsChecking(true);
      const verifiedAdmin = await getMe();

      if (!verifiedAdmin?.email) {
        throw new Error("Admin session could not be verified.");
      }

      setStoredAdmin(verifiedAdmin);
      setAdmin(verifiedAdmin);
      return verifiedAdmin;
    } catch (error) {
      clearAdminSession();
      setAdmin(null);
      throw error;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (getAdminToken()) {
        await logoutAdminRequest();
      }
    } finally {
      clearAdminSession();
      setAdmin(null);
      setIsChecking(false);
    }
  }, []);

  const setVerifiedAdmin = useCallback((verifiedAdmin) => {
    if (!verifiedAdmin) return;
    setStoredAdmin(verifiedAdmin);
    setAdmin(verifiedAdmin);
  }, []);

  const value = useMemo(
    () => ({
      admin,
      isAuthenticated: Boolean(admin && getAdminToken()),
      isChecking,
      login,
      logout,
      setVerifiedAdmin,
      verifyAdmin,
    }),
    [admin, isChecking, login, logout, setVerifiedAdmin, verifyAdmin],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error("useAdminAuth must be used inside AdminAuthProvider.");
  }

  return context;
}
