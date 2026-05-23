const statusConfig = {
  accepted: { label: "Accepted", tone: "bg-emerald-50 text-emerald-700 ring-emerald-100", dot: "bg-emerald-500" },
  active: { label: "Active", tone: "bg-emerald-50 text-emerald-700 ring-emerald-100", dot: "bg-emerald-500" },
  archived: { label: "Archived", tone: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-400" },
  assigned: { label: "Assigned", tone: "bg-emerald-50 text-emerald-700 ring-emerald-100", dot: "bg-emerald-500" },
  bounced: { label: "Bounced", tone: "bg-red-50 text-red-700 ring-red-100", dot: "bg-red-500" },
  cancelled: { label: "Cancelled", tone: "bg-red-50 text-red-700 ring-red-100", dot: "bg-red-500" },
  completed: { label: "Completed", tone: "bg-emerald-50 text-emerald-700 ring-emerald-100", dot: "bg-emerald-500" },
  confirmed: { label: "Confirmed", tone: "bg-emerald-50 text-emerald-700 ring-emerald-100", dot: "bg-emerald-500" },
  contacted: { label: "Contacted", tone: "bg-blue-50 text-blue-700 ring-blue-100", dot: "bg-blue-500" },
  disabled: { label: "Disabled", tone: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-400" },
  draft: { label: "Draft", tone: "bg-amber-50 text-amber-700 ring-amber-100", dot: "bg-amber-500" },
  failed: { label: "Failed", tone: "bg-red-50 text-red-700 ring-red-100", dot: "bg-red-500" },
  inactive: { label: "Inactive", tone: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-400" },
  "in prayer": { label: "In Prayer", tone: "bg-gold/10 text-gold ring-gold/20", dot: "bg-gold" },
  new: { label: "New", tone: "bg-gold/10 text-gold ring-gold/20", dot: "bg-gold" },
  pending: { label: "Pending", tone: "bg-amber-50 text-amber-700 ring-amber-100", dot: "bg-amber-500" },
  prayed: { label: "Prayed", tone: "bg-emerald-50 text-emerald-700 ring-emerald-100", dot: "bg-emerald-500" },
  private: { label: "Private", tone: "bg-navy/10 text-navy ring-navy/10", dot: "bg-navy" },
  published: { label: "Published", tone: "bg-emerald-50 text-emerald-700 ring-emerald-100", dot: "bg-emerald-500" },
  read: { label: "Read", tone: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-400" },
  refunded: { label: "Refunded", tone: "bg-purple-50 text-purple-700 ring-purple-100", dot: "bg-purple-500" },
  rejected: { label: "Rejected", tone: "bg-red-50 text-red-700 ring-red-100", dot: "bg-red-500" },
  replied: { label: "Replied", tone: "bg-emerald-50 text-emerald-700 ring-emerald-100", dot: "bg-emerald-500" },
  scheduled: { label: "Scheduled", tone: "bg-blue-50 text-blue-700 ring-blue-100", dot: "bg-blue-500" },
  subscribed: { label: "Subscribed", tone: "bg-emerald-50 text-emerald-700 ring-emerald-100", dot: "bg-emerald-500" },
  unread: { label: "Unread", tone: "bg-gold/10 text-gold ring-gold/20", dot: "bg-gold" },
};

function humanizeStatus(status) {
  return String(status || "Active")
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function StatusBadge({ className = "", showDot = true, status }) {
  const key = String(status || "active").trim().toLowerCase();
  const config = statusConfig[key] || {
    dot: "bg-gold",
    label: humanizeStatus(status),
    tone: "bg-cream text-navy ring-navy/10",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold ring-1 ring-inset ${config.tone} ${className}`}
    >
      {showDot ? <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} aria-hidden="true" /> : null}
      {config.label}
    </span>
  );
}

export default StatusBadge;
