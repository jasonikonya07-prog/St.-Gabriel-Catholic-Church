const fallbackText = "N/A";

function toDate(value) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatCurrencyKES(amount) {
  const value = Number(amount || 0);

  return new Intl.NumberFormat("en-KE", {
    currency: "KES",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatDate(value) {
  if (!value) return fallbackText;

  const rawValue = String(value);

  if (/every|monday|tuesday|wednesday|thursday|friday|saturday|sunday/i.test(rawValue) && !toDate(value)) {
    return rawValue;
  }

  const date = toDate(value);
  if (!date) return rawValue || fallbackText;

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value) {
  if (!value) return fallbackText;

  const date = toDate(value);
  if (!date) return String(value);

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");

  if (!digits) return fallbackText;

  if (digits.startsWith("254") && digits.length === 12) {
    return `+254 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }

  if ((digits.startsWith("7") || digits.startsWith("1")) && digits.length === 9) {
    return `+254 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }

  return phone;
}

export function truncateText(text, length = 80) {
  const value = String(text || "");

  if (!value) return fallbackText;
  if (value.length <= length) return value;

  return `${value.slice(0, Math.max(0, length - 3)).trim()}...`;
}

export function getInitials(name) {
  const initials = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "SG";
}

export function formatStatus(status) {
  const value = String(status || "").trim();

  if (!value) return "Active";

  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatAdminValue(value, type) {
  if (type === "money" || type === "currency" || type === "number") return formatCurrencyKES(value);
  if (type === "date") return formatDate(value);
  if (type === "datetime" || type === "dateTime") return formatDateTime(value);
  if (type === "phone") return formatPhone(value);
  if (type === "status") return formatStatus(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === undefined || value === null || value === "") return fallbackText;

  return String(value);
}

export const formatCurrency = formatCurrencyKES;
