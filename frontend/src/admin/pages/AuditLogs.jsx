import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FaChevronLeft, FaChevronRight, FaFileAlt, FaFilter, FaSearch, FaSyncAlt } from "react-icons/fa";
import EmptyState from "../components/EmptyState";
import LoadingSkeleton from "../components/LoadingSkeleton";
import PageHeader from "../components/PageHeader";
import { formatDateTime, formatStatus, truncateText } from "../utils/formatters";
import { getAuditLogs } from "../../services/auditService";
import { cardReveal, fadeUp } from "../../utils/animations";

const moduleOptions = [
  { label: "All Modules", value: "all" },
  { label: "Authentication", value: "authentication" },
  { label: "Settings", value: "settings" },
  { label: "Security", value: "security" },
  { label: "Audit", value: "audit" },
  { label: "Announcements", value: "announcements" },
  { label: "Events", value: "events" },
  { label: "Donations", value: "donations" },
  { label: "Contact", value: "contact" },
  { label: "Prayers", value: "prayers" },
  { label: "Newsletter", value: "newsletter" },
  { label: "Dashboard", value: "dashboard" },
];

const fallbackPagination = {
  limit: 20,
  page: 1,
  pages: 1,
  total: 0,
};

function normalizeRows(response) {
  return response?.auditLogs || response?.data?.auditLogs || response?.data || [];
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
        <span className="text-navy">{total}</span> audit records
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
            placeholder="Search action, module, email, description, or IP..."
            className="min-h-12 w-full min-w-0 rounded-2xl border border-navy/10 bg-cream pl-11 pr-4 text-sm font-bold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
          />
        </label>

        <label className="relative block min-w-0">
          <FaFilter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
          <select
            value={filters.module}
            onChange={(event) => onChange({ module: event.target.value })}
            className="min-h-12 w-full min-w-0 appearance-none rounded-2xl border border-navy/10 bg-cream pl-11 pr-4 text-sm font-bold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
          >
            {moduleOptions.map((option) => (
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

function ActorBadge({ actorType }) {
  return (
    <span className="inline-flex items-center rounded-full bg-navy/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.1em] text-navy ring-1 ring-inset ring-navy/10">
      {formatStatus(actorType || "system")}
    </span>
  );
}

function AuditLogTable({ logs, pagination, onPageChange }) {
  if (!logs.length) {
    return (
      <EmptyState
        title="No audit logs found"
        message="Try changing the search text or module filter. Admin actions will appear here as they are recorded."
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
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-gold">Admin Audit Trail</p>
          <p className="mt-1 text-sm font-semibold text-white/65">Newest activity is shown first.</p>
        </div>
        <FaFileAlt className="hidden h-6 w-6 text-gold sm:block" />
      </div>

      <div className="overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[1080px] text-left">
          <thead className="bg-cream text-[10px] uppercase tracking-[0.14em] text-warm">
            <tr>
              {["Date", "Actor Type", "Action", "Module", "Description", "IP Address"].map((column) => (
                <th key={column} className="px-5 py-4 font-extrabold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/10">
            {logs.map((log, index) => (
              <tr key={log.id || `${log.createdAt}-${index}`} className="transition hover:bg-cream/70">
                <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-warm">
                  {formatDateTime(log.createdAt)}
                </td>
                <td className="px-5 py-4">
                  <ActorBadge actorType={log.actorType} />
                </td>
                <td className="px-5 py-4">
                  <p className="font-extrabold text-navy">{sanitizeValue(log.action)}</p>
                  {log.actorEmail ? <p className="mt-1 text-xs font-bold text-warm">{log.actorEmail}</p> : null}
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex rounded-full bg-gold/12 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.1em] text-gold ring-1 ring-inset ring-gold/20">
                    {sanitizeValue(log.module, "system")}
                  </span>
                </td>
                <td className="max-w-[28rem] px-5 py-4 text-sm font-semibold leading-6 text-warm">
                  {truncateText(log.description || log.entity || "No description recorded.", 120)}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-navy">
                  {sanitizeValue(log.ipAddress, "unknown")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hidden">
        {logs.map((log, index) => (
          <article key={log.id || `${log.createdAt}-${index}`} className="rounded-2xl border border-navy/10 bg-cream p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-extrabold text-navy">{sanitizeValue(log.action)}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-warm">
                  {formatDateTime(log.createdAt)}
                </p>
              </div>
              <ActorBadge actorType={log.actorType} />
            </div>

            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="font-extrabold text-warm">Module</span>
                <span className="text-right font-bold text-navy">{sanitizeValue(log.module, "system")}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-extrabold text-warm">IP Address</span>
                <span className="text-right font-bold text-navy">{sanitizeValue(log.ipAddress, "unknown")}</span>
              </div>
              {log.actorEmail ? (
                <div className="flex justify-between gap-4">
                  <span className="font-extrabold text-warm">Actor Email</span>
                  <span className="truncate text-right font-bold text-navy">{log.actorEmail}</span>
                </div>
              ) : null}
              <div>
                <span className="font-extrabold text-warm">Description</span>
                <p className="mt-1 font-semibold leading-6 text-navy">
                  {truncateText(log.description || log.entity || "No description recorded.", 180)}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <PaginationControls pagination={pagination} onPageChange={onPageChange} />
    </motion.section>
  );
}

function AuditLogs() {
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ module: "all", search: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(fallbackPagination);

  const queryParams = useMemo(
    () => ({
      limit: 20,
      page,
      ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
      ...(filters.module !== "all" ? { module: filters.module } : {}),
    }),
    [filters.module, filters.search, page],
  );

  const loadLogs = useCallback(async () => {
    try {
      setError("");
      setIsLoading(true);
      const response = await getAuditLogs(queryParams);
      const rows = normalizeRows(response);
      setLogs(rows);
      setPagination(normalizePagination(response, rows));
    } catch (requestError) {
      setError(requestError?.message || "Audit logs could not be loaded.");
      setLogs([]);
      setPagination(fallbackPagination);
    } finally {
      setIsLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const updateFilters = (patch) => {
    setPage(1);
    setFilters((current) => ({ ...current, ...patch }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters({ module: "all", search: "" });
  };

  if (isLoading && !logs.length) return <LoadingSkeleton rows={8} />;

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Security Records" title="Audit Logs" onAction={loadLogs} actionIcon={FaSyncAlt} actionLabel="Refresh">
        Review administrator, user, and system actions recorded by the backend security logger.
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
            onClick={loadLogs}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-navy px-4 text-xs font-extrabold uppercase tracking-[0.12em] text-gold transition hover:bg-gold hover:text-navy"
          >
            <FaSyncAlt className="h-3.5 w-3.5" />
            Retry
          </button>
        </motion.div>
      ) : null}

      <FilterBar filters={filters} onChange={updateFilters} onClear={clearFilters} />

      {isLoading ? <LoadingSkeleton rows={5} /> : <AuditLogTable logs={logs} pagination={pagination} onPageChange={setPage} />}
    </div>
  );
}

export default AuditLogs;
