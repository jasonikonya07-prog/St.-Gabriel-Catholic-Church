import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  clearUserSession,
  getMe,
  getStoredUser,
  getUserToken,
  login as loginUser,
  logout as logoutUser,
  register as registerUser,
} from "../services/userAuthService";

const UserAuthContext = createContext({
  error: "",
  isAuthenticated: false,
  isLoading: false,
  login: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
  register: async () => {},
  user: null,
});

export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [isLoading, setIsLoading] = useState(Boolean(getUserToken()));
  const [error, setError] = useState("");

  const refreshProfile = useCallback(async () => {
    if (!getUserToken()) {
      setIsLoading(false);
      return null;
    }

    try {
      setError("");
      const profile = await getMe();
      setUser(profile);
      return profile;
    } catch (requestError) {
      clearUserSession();
      setUser(null);
      setError(requestError?.message || "Your session could not be verified.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = useCallback(async (email, password, options = {}) => {
    setError("");
    const session = await loginUser(email, password, options);
    setUser(session.user);
    return session.user;
  }, []);

  const register = useCallback(async (payload) => {
    setError("");
    const session = await registerUser(payload);
    setUser(session.user);
    return session.user;
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      error,
      isAuthenticated: Boolean(user && getUserToken()),
      isLoading,
      login,
      logout,
      refreshProfile,
      register,
      user,
    }),
    [error, isLoading, login, logout, refreshProfile, register, user],
  );

  return <UserAuthContext.Provider value={value}>{children}</UserAuthContext.Provider>;
}

export function useUserAuth() {
  return useContext(UserAuthContext);
}
