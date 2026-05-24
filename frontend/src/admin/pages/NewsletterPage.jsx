import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FaDownload, FaEnvelope, FaPaperPlane, FaSearch, FaSyncAlt, FaTrash, FaUsers } from "react-icons/fa";
import ConfirmModal from "../components/ConfirmModal";
import EmptyState from "../components/EmptyState";
import LoadingSkeleton from "../components/LoadingSkeleton";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { deleteNewsletterSubscriber, getNewsletterSubscribers } from "../services/newsletterService";
import { exportCsv } from "../utils/exportCsv";
import { cardReveal, fadeUp } from "../../utils/animations";

const statusOptions = ["all", "subscribed", "unsubscribed"];

function formatStatus(status) {
  if (!status) return "Subscribed";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function filterSubscribers(subscribers, query, status) {
  const loweredQuery = query.trim().toLowerCase();

  return subscribers.filter((subscriber) => {
    const searchable = [subscriber.email, subscriber.fullName, subscriber.name, subscriber.source]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (loweredQuery && !searchable.includes(loweredQuery)) return false;
    if (status !== "all" && subscriber.status !== status) return false;

    return true;
  });
}

function buildComposeHref(subscribers) {
  const emails = subscribers
    .filter((subscriber) => subscriber.status === "subscribed" && subscriber.email)
    .map((subscriber) => subscriber.email)
    .join(",");
  const subject = encodeURIComponent("St. Gabriel Church Newsletter");
  const body = encodeURIComponent("Peace be with you,\n\n");

  return `mailto:?bcc=${encodeURIComponent(emails)}&subject=${subject}&body=${body}`;
}

function NewsletterStats({ subscribers }) {
  const subscribed = subscribers.filter((subscriber) => subscriber.status === "subscribed").length;
  const unsubscribed = subscribers.filter((subscriber) => subscriber.status === "unsubscribed").length;
  const thisMonth = subscribers.filter((subscriber) => {
    const date = new Date(subscriber.dateSubscribed || subscriber.createdAt);
    const now = new Date();

    return (
      !Number.isNaN(date.getTime()) &&
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }).length;
  const cards = [
    { change: "All newsletter records", icon: FaUsers, label: "Subscribers", tone: "gold", value: subscribers.length },
    { change: "Active email audience", icon: FaEnvelope, label: "Subscribed", tone: "navy", value: subscribed },
    { change: "Opted out", icon: FaEnvelope, label: "Unsubscribed", tone: "gold", value: unsubscribed },
    { change: "Joined this month", icon: FaUsers, label: "New This Month", tone: "navy", value: thisMonth },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <StatCard key={card.label} {...card} index={index} />
      ))}
    </div>
  );
}

function NewsletterFilters({ query, status, onClear, onQueryChange, onStatusChange }) {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="rounded-3xl border border-navy/10 bg-white p-4 shadow-soft sm:p-5"
    >
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
        <label className="relative block min-w-0">
          <FaSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search by email, full name, or source..."
            className="min-h-12 w-full min-w-0 rounded-2xl border border-navy/10 bg-cream pl-11 pr-4 text-sm font-bold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
          />
        </label>

        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
          className="min-h-12 w-full min-w-0 rounded-2xl border border-navy/10 bg-cream px-4 text-sm font-bold capitalize text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All Subscribers" : formatStatus(option)}
            </option>
          ))}
        </select>

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

function NewsletterTable({ onDelete, subscribers }) {
  if (!subscribers.length) {
    return <EmptyState title="No subscribers found" message="Try changing the search text or status filter." />;
  }

  return (
    <motion.section
      variants={cardReveal}
      initial="hidden"
      animate="visible"
      className="overflow-hidden rounded-3xl border border-navy/10 bg-white shadow-soft"
    >
      <div className="border-b border-navy/10 p-4 sm:p-5">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-gold">Subscribers</p>
        <p className="mt-1 text-sm font-semibold text-warm">{subscribers.length} visible subscribers</p>
      </div>

      <div className="overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[920px] text-left">
          <thead className="bg-cream text-[10px] uppercase tracking-[0.14em] text-warm">
            <tr>
              {["Email", "Full Name", "Source", "Status", "Date Subscribed", "Actions"].map((column) => (
                <th key={column} className="px-5 py-4 font-extrabold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/10">
            {subscribers.map((subscriber) => (
              <tr key={subscriber.id} className="transition hover:bg-cream/70">
                <td className="px-5 py-4">
                  <p className="font-extrabold text-navy">{subscriber.email}</p>
                </td>
                <td className="px-5 py-4 text-sm font-bold text-navy">
                  {subscriber.fullName || subscriber.name || "-"}
                </td>
                <td className="px-5 py-4 text-sm font-bold text-warm">{subscriber.source || "-"}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={formatStatus(subscriber.status)} />
                </td>
                <td className="px-5 py-4 text-sm font-bold text-warm">
                  {formatDate(subscriber.dateSubscribed || subscriber.createdAt)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => onDelete(subscriber)}
                      className="grid h-11 w-11 place-items-center rounded-full bg-red-50 text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-100"
                      aria-label="Delete subscriber"
                    >
                      <FaTrash className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hidden">
        {subscribers.map((subscriber) => (
          <article key={subscriber.id} className="rounded-2xl border border-navy/10 bg-cream p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-extrabold text-navy">{subscriber.email}</p>
                <p className="mt-1 truncate text-sm font-bold text-warm">
                  {subscriber.fullName || subscriber.name || "No name"}
                </p>
              </div>
              <StatusBadge status={formatStatus(subscriber.status)} />
            </div>

            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="font-extrabold text-warm">Source</span>
                <span className="text-right font-bold text-navy">{subscriber.source || "-"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-extrabold text-warm">Date Subscribed</span>
                <span className="text-right font-bold text-navy">
                  {formatDate(subscriber.dateSubscribed || subscriber.createdAt)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDelete(subscriber)}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-red-50 px-4 text-xs font-extrabold uppercase tracking-[0.1em] text-red-700 transition hover:bg-red-100"
            >
              <FaTrash className="h-4 w-4" />
              Delete Subscriber
            </button>
          </article>
        ))}
      </div>
    </motion.section>
  );
}

function NewsletterPage() {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [subscribers, setSubscribers] = useState([]);
  const [success, setSuccess] = useState("");

  const loadSubscribers = async () => {
    try {
      setError("");
      setIsLoading(true);
      const response = await getNewsletterSubscribers();
      setSubscribers(response?.subscribers || []);
    } catch (requestError) {
      setError(requestError?.message || "Newsletter subscribers could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscribers();
  }, []);

  const filteredSubscribers = useMemo(
    () => filterSubscribers(subscribers, query, status),
    [query, status, subscribers],
  );
  const composeHref = useMemo(() => buildComposeHref(subscribers), [subscribers]);

  const handleDelete = async () => {
    if (!confirmDelete) return;

    try {
      await deleteNewsletterSubscriber(confirmDelete.id);
      setSubscribers((current) => current.filter((subscriber) => subscriber.id !== confirmDelete.id));
      setSuccess("Newsletter subscriber deleted successfully.");
      setConfirmDelete(null);
    } catch (requestError) {
      setError(requestError?.message || "Subscriber could not be deleted.");
    }
  };

  const handleExport = () => {
    const exported = exportCsv(
      `st-gabriel-newsletter-subscribers-${new Date().toISOString().slice(0, 10)}`,
      filteredSubscribers.map((subscriber) => ({
        Email: subscriber.email,
        "Full Name": subscriber.fullName || subscriber.name || "",
        Source: subscriber.source || "",
        Status: formatStatus(subscriber.status),
        "Date Subscribed": subscriber.dateSubscribed || subscriber.createdAt || "",
      })),
    );

    if (exported) {
      setSuccess("Newsletter CSV exported successfully.");
    }
  };

  if (isLoading) {
    return <LoadingSkeleton rows={7} />;
  }

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Email Ministry" title="Newsletter Subscribers">
        Manage parish newsletter subscribers, export mailing lists, and compose updates for the community.
      </PageHeader>

      {error ? (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-4 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-800 shadow-soft sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm font-extrabold leading-6">{error}</p>
          <button
            type="button"
            onClick={loadSubscribers}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-navy px-4 text-xs font-extrabold uppercase tracking-[0.12em] text-gold transition hover:bg-gold hover:text-navy"
          >
            <FaSyncAlt className="h-3.5 w-3.5" />
            Retry
          </button>
        </motion.div>
      ) : null}

      {success ? (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-extrabold leading-6 text-emerald-800 shadow-soft"
        >
          {success}
        </motion.div>
      ) : null}

      <NewsletterStats subscribers={subscribers} />

      <NewsletterFilters
        query={query}
        status={status}
        onQueryChange={setQuery}
        onStatusChange={setStatus}
        onClear={() => {
          setQuery("");
          setStatus("all");
        }}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-warm">
          Showing <span className="text-navy">{filteredSubscribers.length}</span> of{" "}
          <span className="text-navy">{subscribers.length}</span> subscribers
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <a
            href={composeHref}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-navy px-5 text-xs font-extrabold uppercase tracking-[0.14em] text-gold shadow-soft transition hover:-translate-y-0.5 hover:bg-gold hover:text-navy"
          >
            <FaPaperPlane className="h-4 w-4" />
            Compose Newsletter
          </a>
          <button
            type="button"
            onClick={handleExport}
            disabled={!filteredSubscribers.length}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gold px-5 text-xs font-extrabold uppercase tracking-[0.14em] text-navy shadow-soft transition hover:-translate-y-0.5 hover:bg-navy hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaDownload className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <NewsletterTable subscribers={filteredSubscribers} onDelete={setConfirmDelete} />

      <ConfirmModal
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Subscriber"
        message={`Delete ${confirmDelete?.email || "this subscriber"} from the newsletter list?`}
        confirmLabel="Delete Subscriber"
      />
    </div>
  );
}

export default NewsletterPage;
