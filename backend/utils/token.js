import { signAccessToken, verifyAccessToken } from "./generateTokens.js";

export function signToken(payload) {
  return signAccessToken(payload, payload.tokenType || "admin");
}

export function verifyToken(token) {
  return verifyAccessToken(token);
}
