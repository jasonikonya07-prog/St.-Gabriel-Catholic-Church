import ApiError from "./ApiError.js";

const maxFailedLoginAttempts = Number(process.env.LOGIN_SECURITY_MAX_FAILED_ATTEMPTS || 5);
const lockMinutes = Number(process.env.LOGIN_SECURITY_LOCK_MINUTES || 15);

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
  await account.save({ fields: ["failedLoginAttempts", "lockUntil"] });

  return { locked: false };
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
  await account.save({ fields: ["failedLoginAttempts", "lockUntil"] });

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
  await account.save({ fields: ["failedLoginAttempts", "lockUntil"] });
}

export function throwLockedAccount(lockState) {
  if (lockState?.locked) {
    throw new ApiError(423, lockState.message);
  }
}

export { lockMinutes, maxFailedLoginAttempts };
