export const adminStats = [
  { label: "Monthly Giving", value: "KES 486K", change: "+18%", tone: "gold" },
  { label: "Prayer Requests", value: "128", change: "24 new", tone: "navy" },
  { label: "Contact Messages", value: "42", change: "8 unread", tone: "gold" },
  { label: "Upcoming Events", value: "16", change: "6 this week", tone: "navy" },
];

export const donationTrend = [
  { month: "Jan", total: 334000 },
  { month: "Feb", total: 369000 },
  { month: "Mar", total: 430000 },
  { month: "Apr", total: 470000 },
  { month: "May", total: 556000 },
  { month: "Jun", total: 606000 },
];

export const attendanceTrend = [
  { name: "Contact", activity: 42 },
  { name: "Prayer", activity: 128 },
  { name: "Giving", activity: 84 },
  { name: "News", activity: 18 },
  { name: "Events", activity: 16 },
];

export const givingBreakdown = [
  { name: "Tithe", value: 42 },
  { name: "Offering", value: 24 },
  { name: "Development", value: 18 },
  { name: "Charity", value: 10 },
  { name: "Youth", value: 6 },
];

const commonStatus = ["Draft", "Published", "Archived"];
const requestStatus = ["New", "In Prayer", "Private", "Completed"];
const paymentStatus = ["Completed", "Pending", "Failed", "Cancelled"];

export const adminModules = [
  {
    id: "events",
    label: "Events",
    group: "Website Content",
    description: "Create and update parish events and locations.",
    columns: [
      { key: "title", label: "Event" },
      { key: "date", label: "Date" },
      { key: "time", label: "Time" },
      { key: "status", label: "Status", type: "status" },
    ],
    fields: [
      { name: "title", label: "Event Title", required: true },
      { name: "date", label: "Date", type: "date" },
      { name: "time", label: "Time" },
      { name: "location", label: "Location" },
      { name: "summary", label: "Description", type: "textarea" },
      { name: "status", label: "Status", type: "select", options: commonStatus },
    ],
    initialRows: [
      { id: "event-1", title: "Sunday Family Mass", date: "Every Sunday", time: "9:00 AM", location: "Main Church", summary: "Family-centered Sunday worship.", status: "Published" },
      { id: "event-2", title: "Youth Fellowship", date: "Friday", time: "5:30 PM", location: "Parish Hall", summary: "Weekly youth fellowship and formation.", status: "Published" },
    ],
  },
  {
    id: "announcements",
    label: "Announcements",
    group: "Website Content",
    description: "Publish parish news, Mass updates, and important notices.",
    columns: [
      { key: "title", label: "Announcement" },
      { key: "category", label: "Category" },
      { key: "date", label: "Posted" },
      { key: "status", label: "Status", type: "status" },
    ],
    fields: [
      { name: "title", label: "Title", required: true },
      { name: "category", label: "Category", type: "select", options: ["Important", "Mass Update", "Youth", "Charity", "Parish News"] },
      { name: "date", label: "Date Posted", type: "date" },
      { name: "summary", label: "Announcement Text", type: "textarea" },
      { name: "status", label: "Status", type: "select", options: commonStatus },
    ],
    initialRows: [
      { id: "ann-1", title: "Special Mass this Sunday", category: "Important", date: "2026-05-22", summary: "Special Mass this Sunday at 9:00 AM.", status: "Published" },
      { id: "ann-2", title: "Parish office update", category: "Parish News", date: "2026-05-20", summary: "The parish office has updated weekday opening hours.", status: "Published" },
    ],
  },
  {
    id: "prayer-requests",
    label: "Prayer Requests",
    group: "Pastoral Care",
    description: "Track public, private, and completed prayer requests.",
    columns: [
      { key: "name", label: "Name" },
      { key: "category", label: "Category" },
      { key: "private", label: "Private" },
      { key: "status", label: "Status", type: "status" },
    ],
    fields: [
      { name: "name", label: "Full Name", required: true },
      { name: "contact", label: "Phone / Email" },
      { name: "category", label: "Category", type: "select", options: ["Healing", "Family", "Thanksgiving", "Guidance", "Loss", "Private Request"] },
      { name: "message", label: "Prayer Message", type: "textarea" },
      { name: "private", label: "Private", type: "select", options: ["Yes", "No"] },
      { name: "status", label: "Status", type: "select", options: requestStatus },
    ],
    initialRows: [
      { id: "prayer-1", name: "Grace A.", contact: "grace@example.com", category: "Healing", message: "Please pray for healing.", private: "Yes", status: "In Prayer" },
      { id: "prayer-2", name: "John K.", contact: "0712345678", category: "Thanksgiving", message: "Thanksgiving for answered prayers.", private: "No", status: "New" },
    ],
  },
  {
    id: "newsletter",
    label: "Newsletter",
    group: "Communication",
    description: "Manage newsletter subscribers and campaigns.",
    columns: [
      { key: "email", label: "Email" },
      { key: "name", label: "Name" },
      { key: "source", label: "Source" },
      { key: "status", label: "Status", type: "status" },
    ],
    fields: [
      { name: "email", label: "Email", required: true },
      { name: "name", label: "Name" },
      { name: "source", label: "Source" },
      { name: "status", label: "Status", type: "select", options: ["Subscribed", "Unsubscribed", "Bounced"] },
    ],
    initialRows: [
      { id: "news-sub-1", email: "mary@example.com", name: "Mary W.", source: "Footer", status: "Subscribed" },
      { id: "news-sub-2", email: "paul@example.com", name: "Paul K.", source: "Contact Page", status: "Subscribed" },
    ],
  },
  {
    id: "contact-messages",
    label: "Contact Messages",
    group: "Communication",
    description: "Manage website contact form messages and replies.",
    columns: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "subject", label: "Subject" },
      { key: "status", label: "Status", type: "status" },
    ],
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "email", label: "Email" },
      { name: "phone", label: "Phone" },
      { name: "subject", label: "Subject" },
      { name: "message", label: "Message", type: "textarea" },
      { name: "status", label: "Status", type: "select", options: ["Unread", "Read", "Replied", "Archived"] },
    ],
    initialRows: [
      { id: "msg-1", name: "Catherine N.", email: "cat@example.com", phone: "0700000000", subject: "Baptism Inquiry", message: "I would like parish information.", status: "Unread" },
      { id: "msg-2", name: "Peter O.", email: "peter@example.com", phone: "0711111111", subject: "Office Hours", message: "Please confirm office hours.", status: "Read" },
    ],
  },
];

export const donationRecords = [
  { id: "don-1", donor: "Jason Ikonya", amount: 5000, method: "Safaricom", purpose: "Tithe", date: "2026-05-22", receipt: "MPESA-438291", status: "Completed" },
  { id: "don-2", donor: "Mary Wanjiku", amount: 2500, method: "Card", purpose: "Other", date: "2026-05-21", receipt: "CARD-182930", status: "Completed" },
  { id: "don-3", donor: "Peter Kamau", amount: 10000, method: "Bank Transfer", purpose: "Church Development", date: "2026-05-19", receipt: "BANK-982201", status: "Pending" },
];

export const donationFields = [
  { name: "donor", label: "Donor", required: true },
  { name: "amount", label: "Amount", type: "number", required: true },
  { name: "method", label: "Method", type: "select", options: ["M-Pesa", "Card", "Bank Transfer"] },
  { name: "purpose", label: "Purpose", type: "select", options: ["Tithe", "Church Development", "Charity", "Youth Ministry", "Mass Offering", "Other"] },
  { name: "date", label: "Date", type: "date" },
  { name: "receipt", label: "Receipt" },
  { name: "status", label: "Status", type: "select", options: paymentStatus },
];

export const donationColumns = [
  { key: "donor", label: "Donor" },
  { key: "purpose", label: "Purpose" },
  { key: "method", label: "Method" },
  { key: "amount", label: "Amount", type: "money" },
  { key: "status", label: "Status", type: "status" },
];

export const defaultSettings = {
  churchName: "St. Gabriel Catholic Church",
  parishEmail: "office@stgabrielparish.org",
  parishPhone: "(555) 284-1912",
  address: "125 Grace Avenue, Brookfield, NY 10021",
  paybill: "123456",
  accountReference: "ST-GABRIEL",
  primaryColor: "#071A2D",
  accentColor: "#C9A227",
  livestreamUrl: "https://www.youtube.com/",
  publicDonations: "Enabled",
  prayerPrivacy: "Private by default",
};
