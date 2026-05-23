import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
  FaFilter,
  FaSearch,
  FaShieldAlt,
  FaSyncAlt,
} from "react-icons/fa";
import EmptyState from "../components/EmptyState";
import LoadingSkeleton from "../components/LoadingSkeleton";
import PageHeader from "../components/PageHeader";
import { formatDateTime, formatStatus, truncateText } from "../utils/formatters";
import { getSecurityEvents } from "../../services/auditService";
import { cardReveal, fadeUp } from "../../utils/animations";

const severityOptions = [
  { label: "All Severities", value: "all" },
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Critical", value: "critical" },
];

const severityStyles = {
  critical: "bg-red-100 text-red-800 ring-red-200",
  high: "bg-orange-100 text-orange-800 ring-orange-200",
  low: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  medium: "bg-amber-50 text-amber-700 ring-amber-100",
};

const fallbackPagination = {
  limit: 20,
  page: 1,
  pages: 1,
  total: 0,
};

function normalizeRows(response) {
  return response?.securityEvents || response?.data?.securityEvents || response?.data || [];
}

function normalizePagination(response, rows) {
  return {
    ...fallbackPagination,
    total: rows.length,
    ...(response?.data?.pagination || response?.pagination || {}),
  };
}

function sanitizeValue(value, fallback = "N/A") {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
}

function humanizeKey(value) {
  return String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function detailsToText(details) {
  if (!details) return "No details recorded.";

  if (typeof details === "string") {
    try {
      const parsed = JSON.parse(details);
      return detailsToText(parsed);
    } catch {
      return details;
    }
  }

  if (Array.isArray(details)) {
    return details.map(detailsToText).join("; ");
  }

  if (typeof details === "object") {
    const entries = Object.entries(details)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => {
        const cleanValue = typeof value === "object" ? detailsToText(value) : String(value);
        return `${humanizeKey(key)}: ${cleanValue}`;
      });

    return entries.length ? entries.join("; ") : "No details recorded.";
  }

  return String(details);
}

function SeverityBadge({ severity }) {
  const key = String(severity || "low").toLowerCase();
  const className = severityStyles[key] || "bg-cream text-navy ring-navy/10";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-[0.1em] ring-1 ring-inset ${className}`}
    >
      {formatStatus(key)}
    </span>
  );
}

function PaginationControls({ pagination, onPageChange }) {
  const currentPage = Number(pagination.page || 1);
  const totalPages = Math.max(Number(pagination.pages || 1), 1);
  const total = Number(pagination.total || 0);
  const canGoBack = currentPage > 1;
  const canGoForward = currentPage < totalPages;

  return (
    <div className="flex flex-col gap-3 border-t border-navy/10 bg-cream px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-sm font-bold text-warm">
        Page <span className="text-navy">{currentPage}</span> of <span className="text-navy">{totalPages}</span>
        <span className="mx-2 text-navy/30">|</span>
        <span className="text-navy">{total}</span> security events
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!canGoBack}
          onClick={() => onPageChange(currentPage - 1)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-navy/10 bg-white px-4 text-xs font-extrabold uppercase tracking-[0.12em] text-navy transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-45"
        >
          <FaChevronLeft className="h-3.5 w-3.5" />
          Prev
        </button>
        <button
          type="button"
          disabled={!canGoForward}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gold px-4 text-xs font-extrabold uppercase tracking-[0.12em] text-navy transition hover:bg-navy hover:text-gold disabled:cursor-not-allowed disabled:opacity-45"
        >
          Next
          <FaChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function FilterBar({ filters, onChange, onClear }) {
  return (
    <motion.section
      animate="visible"
      className="rounded-3xl border border-navy/10 bg-white p-4 shadow-soft sm:p-5"
      initial="hidden"
      variants={fadeUp}
    >
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)_auto] lg:items-center">
        <label className="relative block min-w-0">
          <FaSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
          <input
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value })}
            placeholder="Search by email or IP address..."
            className="min-h-12 w-full min-w-0 rounded-2xl border border-navy/10 bg-cream pl-11 pr-4 text-sm font-bold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
          />
        </label>

        <label className="relative block min-w-0">
          <FaFilter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
          <select
            value={filters.severity}
            onChange={(event) => onChange({ severity: event.target.value })}
            className="min-h-12 w-full min-w-0 appearance-none rounded-2xl border border-navy/10 bg-cream pl-11 pr-4 text-sm font-bold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
          >
            {severityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={onClear}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-navy/10 bg-cream px-5 text-xs font-extrabold uppercase tracking-[0.12em] text-navy transition hover:border-gold hover:text-gold lg:w-auto"
        >
          Clear
        </button>
      </div>
    </motion.section>
  );
}

function SecurityEventsTable({ events, pagination, onPageChange }) {
  if (!events.length) {
    return (
      <EmptyState
        title="No security events found"
        message="Try changing the search text or severity filter. Failed logins, lockouts, and suspicious requests will appear here."
      />
    );
  }

  return (
    <motion.section
      animate="visible"
      className="overflow-hidden rounded-3xl border border-navy/10 bg-white shadow-soft"
      initial="hidden"
      variants={cardReveal}
    >
      <div className="flex flex-col gap-2 border-b border-navy/10 bg-navy px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-gold">Threat And Abuse Signals</p>
          <p className="mt-1 text-sm font-semibold text-white/65">Newest security events are shown first.</p>
        </div>
        <FaShieldAlt className="hidden h-6 w-6 text-gold sm:block" />
      </div>

      <div className="overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[1080px] text-left">
          <thead className="bg-cream text-[10px] uppercase tracking-[0.14em] text-warm">
            <tr>
              {["Date", "Event Type", "Email", "IP Address", "Severity", "Details"].map((column) => (
                <th key={column} className="px-5 py-4 font-extrabold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/10">
            {events.map((event, index) => (
              <tr key={event.id || `${event.createdAt}-${index}`} className="transition hover:bg-cream/70">
                <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-warm">
                  {formatDateTime(event.createdAt)}
                </td>
                <td className="px-5 py-4">
                  <p className="font-extrabold text-navy">{sanitizeValue(event.eventType)}</p>
                </td>
                <td className="px-5 py-4 text-sm font-bold text-navy">{sanitizeValue(event.email, "none")}</td>
                <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-navy">
                  {sanitizeValue(event.ipAddress, "unknown")}
                </td>
                <td className="px-5 py-4">
                  <SeverityBadge severity={event.severity} />
                </td>
                <td className="max-w-[32rem] px-5 py-4 text-sm font-semibold leading-6 text-warm">
                  {truncateText(detailsToText(event.details), 140)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hidden">
        {events.map((event, index) => (
          <article key={event.id || `${event.createdAt}-${index}`} className="rounded-2xl border border-navy/10 bg-cream p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-extrabold text-navy">{sanitizeValue(event.eventType)}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-warm">
                  {formatDateTime(event.createdAt)}
                </p>
              </div>
              <SeverityBadge severity={event.severity} />
            </div>

            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="font-extrabold text-warm">Email</span>
                <span className="truncate text-right font-bold text-navy">{sanitizeValue(event.email, "none")}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-extrabold text-warm">IP Address</span>
                <span className="text-right font-bold text-navy">{sanitizeValue(event.ipAddress, "unknown")}</span>
              </div>
              <div>
                <span className="font-extrabold text-warm">Details</span>
                <p className="mt-1 font-semibold leading-6 text-navy">{truncateText(detailsToText(event.details), 200)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <PaginationControls pagination={pagination} onPageChange={onPageChange} />
    </motion.section>
  );
}

function SecurityEvents() {
  const [error, setError] = useState("");
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({ search: "", severity: "all" });
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(fallbackPagination);

  const queryParams = useMemo(
    () => ({
      limit: 20,
      page,
      ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
      ...(filters.severity !== "all" ? { severity: filters.severity } : {}),
    }),
    [filters.search, filters.severity, page],
  );

  const loadEvents = useCallback(async () => {
    try {
      setError("");
      setIsLoading(true);
      const response = await getSecurityEvents(queryParams);
      const rows = normalizeRows(response);
      setEvents(rows);
      setPagination(normalizePagination(response, rows));
    } catch (requestError) {
      setError(requestError?.message || "Security events could not be loaded.");
      setEvents([]);
      setPagination(fallbackPagination);
    } finally {
      setIsLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const updateFilters = (patch) => {
    setPage(1);
    setFilters((current) => ({ ...current, ...patch }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters({ search: "", severity: "all" });
  };

  if (isLoading && !events.length) return <LoadingSkeleton rows={8} />;

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Security Events"
        title="Security Events"
        onAction={loadEvents}
        actionIcon={FaSyncAlt}
        actionLabel="Refresh"
      >
        Review failed logins, account locks, suspicious requests, and abuse signals captured by the backend.
      </PageHeader>

      {error ? (
        <motion.div
          animate="visible"
          className="flex flex-col gap-4 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-800 shadow-soft sm:flex-row sm:items-center sm:justify-between"
          initial="hidden"
          role="alert"
          variants={fadeUp}
        >
          <p className="text-sm font-extrabold leading-6">{error}</p>
          <button
            type="button"
            onClick={loadEvents}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-navy px-4 text-xs font-extrabold uppercase tracking-[0.12em] text-gold transition hover:bg-gold hover:text-navy"
          >
            <FaSyncAlt className="h-3.5 w-3.5" />
            Retry
          </button>
        </motion.div>
      ) : null}

      <FilterBar filters={filters} onChange={updateFilters} onClear={clearFilters} />

      {isLoading ? (
        <LoadingSkeleton rows={5} />
      ) : (
        <SecurityEventsTable events={events} pagination={pagination} onPageChange={setPage} />
      )}
    </div>
  );
}

export default SecurityEvents;
