import ApiError from "./ApiError.js";
import { FailedLoginAttempt } from "../models/index.js";
import { getClientIp, getUserAgent } from "./securityLogger.js";

const maxFailedLoginAttempts = 5;
const lockMinutes = 15;

function getLockUntil() {
  return new Date(Date.now() + lockMinutes * 60 * 1000);
}

function isLockActive(account) {
  return account?.lockUntil && new Date(account.lockUntil).getTime() > Date.now();
}

export async function checkAccountLocked(account) {
  if (!account?.lockUntil) {
    return { locked: false };
  }

  if (isLockActive(account)) {
    return {
      lockUntil: account.lockUntil,
      locked: true,
      message: `This account is locked. Please try again after ${new Date(account.lockUntil).toISOString()}.`,
    };
  }

  account.failedLoginAttempts = 0;
  account.lockUntil = null;
  await account.save();

  return { locked: false };
}

export async function logFailedLoginAttempt({ email, reason, request = null, scope }) {
  if (!email || !scope) return;

  try {
    await FailedLoginAttempt.create({
      email: String(email).trim().toLowerCase(),
      ipAddress: getClientIp(request) || null,
      reason,
      scope,
      userAgent: getUserAgent(request) || null,
    });
  } catch (error) {
    console.error("Failed login attempt write failed:", error.message);
  }
}

export async function recordFailedLogin(account) {
  if (!account) {
    return {
      attempts: 0,
      locked: false,
      message: "Invalid email or password.",
    };
  }

  const failedLoginAttempts = Number(account.failedLoginAttempts || 0) + 1;
  const shouldLock = failedLoginAttempts >= maxFailedLoginAttempts;

  account.failedLoginAttempts = failedLoginAttempts;
  account.lockUntil = shouldLock ? getLockUntil() : null;
  await account.save();

  return {
    attempts: failedLoginAttempts,
    lockUntil: account.lockUntil,
    locked: shouldLock,
    message: shouldLock ? `Too many failed attempts. This account is locked for ${lockMinutes} minutes.` : "Invalid email or password.",
  };
}

export async function resetFailedLogin(account) {
  if (!account) return;

  account.failedLoginAttempts = 0;
  account.lockUntil = null;
  await account.save();
}

export function throwLockedAccount(lockState) {
  if (lockState?.locked) {
    throw new ApiError(423, lockState.message);
  }
}

export { lockMinutes, maxFailedLoginAttempts };
