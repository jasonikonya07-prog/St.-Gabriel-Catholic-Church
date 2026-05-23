import {
  clearUserSession,
  getStoredUser,
  getUserToken,
  setStoredUser,
  setUserToken,
  userGet,
  userPost,
} from "../api/axios";

function readUserSession(response) {
  const token = response?.accessToken || response?.token || response?.data?.accessToken || response?.data?.token || "";
  const user = response?.user || response?.data?.user || null;
  return { token, user };
}

function saveUserSession(session, options = {}) {
  if (session.token) setUserToken(session.token, options);
  if (session.user) setStoredUser(session.user);
}

export async function register(payload) {
  const response = await userPost("/user-auth/register", payload);
  const session = readUserSession(response);
  saveUserSession(session, { remember: true });
  return { ...response, ...session };
}

export async function login(email, password, options = {}) {
  const response = await userPost("/user-auth/login", {
    email: String(email || "").trim().toLowerCase(),
    password,
  });
  const session = readUserSession(response);
  saveUserSession(session, { remember: Boolean(options.remember) });
  return { ...response, ...session };
}

export async function logout() {
  try {
    await userPost("/user-auth/logout");
  } finally {
    clearUserSession();
  }
}

export async function getMe() {
  const response = await userGet("/user-auth/me");
  const user = response?.user || response?.data?.user || null;

  if (user) setStoredUser(user);
  return user;
}

export function isUserAuthenticated() {
  return Boolean(getUserToken());
}

export { clearUserSession, getStoredUser, getUserToken, setStoredUser, setUserToken };

export const registerUser = register;
export const loginUser = login;
export const logoutUser = logout;
export const getUserProfile = getMe;
