export const ADMIN_APP_NAME = "St. Gabriel Church Admin";

export const ADMIN_COLORS = {
  cream: "#F8F3E7",
  gold: "#C9A227",
  navy: "#071A2D",
  text: "#111827",
  warm: "#6B7280",
  white: "#FFFFFF",
};

export const ADMIN_ROUTE_PREFIX = "/admin";

export const donationPurposes = [
  "Tithe",
  "Church Development",
  "Charity",
  "Youth Ministry",
  "Mass Offering",
  "Other",
];

export const paymentMethods = [
  "M-Pesa",
  "Card",
  "Bank Transfer",
];

export const prayerCategories = [
  "Healing",
  "Family",
  "Thanksgiving",
  "Guidance",
  "Loss",
  "Private Request",
  "Other",
];

export const eventCategories = ["Mass", "Youth", "Charity", "Bible Study", "Parish", "Special"];

export const announcementCategories = ["Important", "Mass Update", "Youth", "Charity", "Parish News"];

export const statusOptions = [
  "Pending",
  "Completed",
  "Failed",
  "Cancelled",
  "Unread",
  "Read",
  "Replied",
  "Prayed",
  "Archived",
  "Accepted",
  "Rejected",
  "Published",
  "Draft",
  "Active",
  "Inactive",
];

export const ADMIN_STATUS_OPTIONS = {
  content: ["Draft", "Published", "Archived"],
  payment: ["Completed", "Pending", "Failed", "Cancelled"],
  request: ["New", "In Prayer", "Private", "Prayed", "Archived"],
};
