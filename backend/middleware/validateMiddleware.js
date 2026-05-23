import xss from "xss";
import ApiError from "../utils/ApiError.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9\s().-]{7,20}$/;
const urlRegex = /^https?:\/\/[^\s]+$/i;
const sensitiveFields = new Set(["confirmPassword", "currentPassword", "newPassword", "password", "token"]);
const xssOptions = {
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style"],
  whiteList: {},
};

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

export function cleanString(value) {
  return String(value ?? "").trim();
}

export function sanitizeBody(request, response, next) {
  if (request.body && typeof request.body === "object" && !Array.isArray(request.body)) {
    request.body = sanitizeObject(request.body);
  }

  next();
}

function sanitizeObject(value, fieldName = "") {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeObject(item, fieldName));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeObject(item, key)]));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (sensitiveFields.has(fieldName)) return trimmed;
    return xss(trimmed, xssOptions);
  }

  return value;
}

function isEmpty(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return cleanString(value) === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function hasBodyContent(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;
  return Object.values(body).some((value) => !isEmpty(value));
}

function readField(source, field, aliases = []) {
  for (const key of [field, ...aliases]) {
    if (hasOwn(source, key)) {
      return { exists: true, key, value: source[key] };
    }
  }

  return { exists: false, key: field, value: undefined };
}

function validateByType(rule, value) {
  if (rule.type === "email" && !emailRegex.test(cleanString(value).toLowerCase())) {
    return "Please enter a valid email address.";
  }

  if (rule.type === "phone" && !phoneRegex.test(cleanString(value))) {
    return "Please enter a valid phone number.";
  }

  if (rule.type === "kenyanPhone" && !isValidKenyanPhone(value)) {
    return "Please enter a valid Kenyan phone number.";
  }

  if (rule.type === "phoneOrEmail") {
    const text = cleanString(value);
    const valid = text.includes("@") ? emailRegex.test(text.toLowerCase()) : phoneRegex.test(text);
    if (!valid) return "Please enter a valid phone number or email address.";
  }

  if (rule.type === "amount") {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) {
      return "Amount must be greater than zero.";
    }
  }

  if (rule.type === "url" && !urlRegex.test(cleanString(value))) {
    return "Please enter a valid URL.";
  }

  if (rule.type === "boolean") {
    const booleanValue = typeof value === "string" ? value.toLowerCase() : value;
    if (!["true", "false", "1", "0", "yes", "no", "on", "off", "published", "featured", true, false].includes(booleanValue)) {
      return "Please enter a valid true or false value.";
    }
  }

  if (rule.type === "date" && Number.isNaN(Date.parse(cleanString(value)))) {
    return "Please enter a valid date.";
  }

  return null;
}

function isValidKenyanPhone(value) {
  const phone = cleanString(value).replace(/[\s().-]/g, "");
  return /^(?:\+?254|0)(?:7|1)\d{8}$/.test(phone);
}

function validateRule(rule, fieldState, { partial }) {
  const errors = [];
  const label = rule.label || rule.field;

  if (partial && !fieldState.exists) {
    return errors;
  }

  if (rule.required && isEmpty(fieldState.value)) {
    errors.push({ field: rule.field, message: `${label} is required.` });
    return errors;
  }

  if (isEmpty(fieldState.value)) {
    return errors;
  }

  const value = fieldState.value;
  const text = cleanString(value);

  if (rule.minLength && text.length < rule.minLength) {
    errors.push({ field: rule.field, message: `${label} must be at least ${rule.minLength} characters.` });
  }

  if (rule.maxLength && text.length > rule.maxLength) {
    errors.push({ field: rule.field, message: `${label} must be ${rule.maxLength} characters or fewer.` });
  }

  if (rule.enum && !rule.enum.includes(value)) {
    errors.push({ field: rule.field, message: `${label} has an invalid value.` });
  }

  const typeError = validateByType(rule, value);
  if (typeError) {
    errors.push({ field: rule.field, message: typeError });
  }

  if (rule.validate) {
    const customMessage = rule.validate(value);
    if (customMessage) {
      errors.push({ field: rule.field, message: customMessage });
    }
  }

  return errors;
}

export function validateBody(rules = [], options = {}) {
  return (request, response, next) => {
    const body = request.body || {};

    if (!options.allowEmpty && !hasBodyContent(body)) {
      next(new ApiError(400, "Please complete the form before submitting."));
      return;
    }

    const errors = rules.flatMap((rule) => validateRule(rule, readField(body, rule.field, rule.aliases), options));

    if (errors.length) {
      next(new ApiError(400, "Please check the highlighted fields.", errors));
      return;
    }

    next();
  };
}

export const validateLogin = validateBody([
  { field: "email", label: "Email", required: true, type: "email", maxLength: 160 },
  { field: "password", label: "Password", required: true, minLength: 6, maxLength: 128 },
]);

export const validateContactMessage = validateBody([
  { aliases: ["name"], field: "fullName", label: "Full name", required: true, maxLength: 120 },
  { field: "email", label: "Email", required: true, type: "email", maxLength: 160 },
  { field: "phone", label: "Phone", type: "phone", maxLength: 30 },
  { field: "subject", label: "Subject", maxLength: 160 },
  { field: "message", label: "Message", required: true, minLength: 10, maxLength: 3000 },
]);

export const validateContactStatus = validateBody([
  { enum: ["unread", "read", "replied"], field: "status", label: "Status", required: true },
  { field: "adminNotes", label: "Admin notes", maxLength: 1000 },
]);

export const validatePrayerRequest = validateBody([
  { aliases: ["name"], field: "fullName", label: "Full name", required: true, maxLength: 120 },
  { field: "contact", label: "Phone or email", required: true, type: "phoneOrEmail", maxLength: 160 },
  {
    enum: ["Healing", "Family", "Thanksgiving", "Guidance", "Loss", "Private Request", "Other"],
    field: "category",
    label: "Prayer category",
  },
  { field: "message", label: "Prayer message", required: true, minLength: 10, maxLength: 2000 },
  { field: "isPrivate", label: "Private request", type: "boolean" },
]);

export const validatePrayerStatus = validateBody([
  { enum: ["pending", "prayed", "archived"], field: "status", label: "Status", required: true },
  { field: "adminNotes", label: "Admin notes", maxLength: 1000 },
]);

const donationPurposeOptions = [
  "Tithe",
  "Sunday Offering",
  "Church Development",
  "Charity",
  "Charity Support",
  "Youth Ministry",
  "Mass Offering",
  "Thanksgiving Offering",
  "Building Fund",
  "Other",
];

export const validateDonation = validateBody([
  { field: "donorName", label: "Donor name", required: true, maxLength: 120 },
  { field: "phone", label: "Phone number", required: true, type: "kenyanPhone" },
  { field: "email", label: "Email", type: "email", maxLength: 160 },
  { field: "amount", label: "Donation amount", required: true, type: "amount" },
  { enum: donationPurposeOptions, field: "purpose", label: "Giving category", required: true },
  {
    enum: ["M-Pesa", "M-Pesa STK Push", "Safaricom", "Airtel Money", "Card", "Card Payment", "Bank Transfer"],
    field: "paymentMethod",
    label: "Payment method",
    required: true,
  },
  { field: "message", label: "Message", maxLength: 1000 },
]);

export const validateMpesaDonation = validateBody([
  { field: "donorName", label: "Donor name", required: true, maxLength: 120 },
  { field: "phone", label: "Phone number", required: true, type: "kenyanPhone" },
  { field: "email", label: "Email", type: "email", maxLength: 160 },
  { field: "amount", label: "Donation amount", required: true, type: "amount" },
  { enum: donationPurposeOptions, field: "purpose", label: "Giving category", required: true },
  { field: "message", label: "Message", maxLength: 1000 },
]);

export const validateDonationStatus = validateBody([
  { enum: ["pending", "completed", "failed", "cancelled"], field: "status", label: "Status", required: true },
  { field: "transactionCode", label: "Transaction code", maxLength: 80 },
  { field: "mpesaReceiptNumber", label: "M-Pesa receipt", maxLength: 80 },
]);

export const validateNewsletterSubscribe = validateBody([
  { field: "email", label: "Email", required: true, type: "email", maxLength: 160 },
  { aliases: ["name"], field: "fullName", label: "Full name", maxLength: 120 },
  { field: "source", label: "Source", maxLength: 80 },
]);

export const validateNewsletterUnsubscribe = validateBody([
  { field: "email", label: "Email", required: true, type: "email", maxLength: 160 },
]);

export const validateAnnouncementCreate = validateBody([
  { field: "title", label: "Title", required: true, maxLength: 180 },
  {
    enum: ["Important", "Mass Update", "Youth", "Charity", "Parish News"],
    field: "category",
    label: "Category",
  },
  { field: "summary", label: "Summary", required: true, minLength: 10, maxLength: 500 },
  { aliases: ["fullContent"], field: "content", label: "Content", required: true, minLength: 20, maxLength: 10000 },
  { field: "imageUrl", label: "Image URL", type: "url", maxLength: 500 },
  { field: "isPublished", label: "Published", type: "boolean" },
]);

export const validateAnnouncementUpdate = validateBody(
  [
    { field: "title", label: "Title", maxLength: 180 },
    {
      enum: ["Important", "Mass Update", "Youth", "Charity", "Parish News"],
      field: "category",
      label: "Category",
    },
    { field: "summary", label: "Summary", minLength: 10, maxLength: 500 },
    { aliases: ["fullContent"], field: "content", label: "Content", minLength: 20, maxLength: 10000 },
    { field: "imageUrl", label: "Image URL", type: "url", maxLength: 500 },
    { field: "isPublished", label: "Published", type: "boolean" },
  ],
  { partial: true },
);

export const validateEventCreate = validateBody([
  { field: "title", label: "Title", required: true, maxLength: 180 },
  { field: "description", label: "Description", required: true, minLength: 10, maxLength: 5000 },
  { aliases: ["date"], field: "eventDate", label: "Event date", required: true, type: "date" },
  { field: "startTime", label: "Start time", required: true, maxLength: 20 },
  { field: "endTime", label: "End time", maxLength: 20 },
  { field: "location", label: "Location", required: true, maxLength: 180 },
  { enum: ["Mass", "Youth", "Charity", "Bible Study", "Parish", "Special"], field: "category", label: "Category" },
  { field: "imageUrl", label: "Image URL", type: "url", maxLength: 500 },
  { field: "isFeatured", label: "Featured", type: "boolean" },
  { field: "isPublished", label: "Published", type: "boolean" },
]);

export const validateEventUpdate = validateBody(
  [
    { field: "title", label: "Title", maxLength: 180 },
    { field: "description", label: "Description", minLength: 10, maxLength: 5000 },
    { aliases: ["date"], field: "eventDate", label: "Event date", type: "date" },
    { field: "startTime", label: "Start time", maxLength: 20 },
    { field: "endTime", label: "End time", maxLength: 20 },
    { field: "location", label: "Location", maxLength: 180 },
    { enum: ["Mass", "Youth", "Charity", "Bible Study", "Parish", "Special"], field: "category", label: "Category" },
    { field: "imageUrl", label: "Image URL", type: "url", maxLength: 500 },
    { field: "isFeatured", label: "Featured", type: "boolean" },
    { field: "isPublished", label: "Published", type: "boolean" },
  ],
  { partial: true },
);
