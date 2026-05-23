export const givingCategories = [
  {
    description: "Support the mission and daily ministry of the Church.",
    title: "Tithe",
  },
  {
    description: "Give your weekly offering in thanksgiving to God.",
    title: "Sunday Offering",
  },
  {
    description: "Support parish construction, maintenance, and development.",
    title: "Church Development",
  },
  {
    description: "Help families, the sick, the poor, and people in need.",
    title: "Charity Support",
  },
  {
    description: "Support youth programs, events, and formation.",
    title: "Youth Ministry",
  },
  {
    description: "Offer a Mass intention for thanksgiving, healing, or remembrance.",
    title: "Mass Offering",
  },
  {
    description: "Give thanks for God's blessings.",
    title: "Thanksgiving Offering",
  },
  {
    description: "Support church building and renovation projects.",
    title: "Building Fund",
  },
  {
    description: "Give to another parish need.",
    title: "Other",
  },
];

export function formatMoney(amount) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return "KES 0";
  }

  return new Intl.NumberFormat("en-KE", {
    currency: "KES",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(numericAmount);
}

export function buildGivingReference(givingType, fullName) {
  const prefix = givingType === "Other" ? "OFFERING" : givingType.toUpperCase().replaceAll(" ", "-");
  const donor = fullName.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "") || "DONOR";

  return `${prefix}-${donor}`;
}

export function normalizeApiStatus(status) {
  const normalized = String(status || "").toLowerCase();

  if (["completed", "paid", "success", "succeeded"].includes(normalized)) return "completed";
  if (["failed", "cancelled", "canceled", "timeout", "expired"].includes(normalized)) return "failed";
  if (["pending", "processing", "queued", "waiting_confirmation"].includes(normalized)) return "waiting_confirmation";
  if (["prompt_sent", "sent"].includes(normalized)) return "prompt_sent";

  return "waiting_confirmation";
}

export function formatKenyanPhoneNumber(phone) {
  const trimmedPhone = String(phone || "").trim().replace(/\s|-/g, "");

  if (/^07\d{8}$/.test(trimmedPhone) || /^01\d{8}$/.test(trimmedPhone)) {
    return `254${trimmedPhone.slice(1)}`;
  }

  if (/^\+254(7|1)\d{8}$/.test(trimmedPhone)) {
    return trimmedPhone.slice(1);
  }

  if (/^254(7|1)\d{8}$/.test(trimmedPhone)) {
    return trimmedPhone;
  }

  return "";
}
