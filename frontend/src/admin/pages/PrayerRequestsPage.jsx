import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FaArchive,
  FaCheckCircle,
  FaEye,
  FaLock,
  FaPrayingHands,
  FaSearch,
  FaSyncAlt,
  FaTrash,
  FaUnlock,
} from "react-icons/fa";
import AdminModal from "../components/AdminModal";
import ConfirmModal from "../components/ConfirmModal";
import EmptyState from "../components/EmptyState";
import LoadingSkeleton from "../components/LoadingSkeleton";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import {
  deletePrayerRequest,
  getPrayerRequest,
  getPrayerRequests,
  updatePrayerStatus,
} from "../services/prayerService";
import { cardReveal, fadeUp } from "../../utils/animations";

const categories = ["Healing", "Family", "Thanksgiving", "Guidance", "Loss", "Private Request", "Other"];
const statuses = ["pending", "prayed", "archived"];
const privacyOptions = ["All", "Private", "Public"];

const emptyFilters = {
  category: "All",
  privacy: "All",
  query: "",
  status: "All",
};

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function normalizePrivacy(value) {
  return Boolean(value === true || value === "Yes" || value === "Private");
}

function formatStatus(status) {
  if (!status) return "pending";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function filterPrayerRequests(requests, filters) {
  const query = filters.query.trim().toLowerCase();

  return requests.filter((request) => {
    const isPrivate = normalizePrivacy(request.isPrivate);
    const searchable = [request.name, request.contact, request.message, request.adminNotes]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (query && !searchable.includes(query)) return false;
    if (filters.category !== "All" && request.category !== filters.category) return false;
    if (filters.status !== "All" && request.status !== filters.status) return false;
    if (filters.privacy === "Private" && !isPrivate) return false;
    if (filters.privacy === "Public" && isPrivate) return false;

    return true;
  });
}

function PrayerStats({ requests }) {
  const pending = requests.filter((request) => request.status === "pending").length;
  const prayed = requests.filter((request) => request.status === "prayed").length;
  const archived = requests.filter((request) => request.status === "archived").length;
  const privateCount = requests.filter((request) => normalizePrivacy(request.isPrivate)).length;
  const cards = [
    { change: "All submitted intentions", icon: FaPrayingHands, label: "Total Requests", tone: "gold", value: requests.length },
    { change: "Awaiting prayer team", icon: FaPrayingHands, label: "Pending", tone: "navy", value: pending },
    { change: "Remembered in prayer", icon: FaCheckCircle, label: "Prayed", tone: "gold", value: prayed },
    { change: `${privateCount} private intentions`, icon: FaLock, label: "Archived", tone: "navy", value: archived },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <StatCard key={card.label} {...card} index={index} />
      ))}
    </div>
  );
}

function FilterField({ children, label }) {
  return (
    <label className="grid min-w-0 gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-warm">
      {label}
      {children}
    </label>
  );
}

function PrayerFilters({ filters, onChange, onClear }) {
  const updateFilter = (field) => (event) => {
    onChange((current) => ({ ...current, [field]: event.target.value }));
  };

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="rounded-3xl border border-navy/10 bg-white p-4 shadow-soft sm:p-5"
    >
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_auto] lg:items-end">
        <label className="relative block min-w-0">
          <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-warm">
            Search Requests
          </span>
          <FaSearch className="pointer-events-none absolute left-4 top-[2.8rem] h-4 w-4 text-gold" />
          <input
            value={filters.query}
            onChange={updateFilter("query")}
            placeholder="Search by name, contact, message, or notes..."
            className="min-h-12 w-full min-w-0 rounded-2xl border border-navy/10 bg-cream pl-11 pr-4 text-sm font-bold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
          />
        </label>

        <FilterField label="Category">
          <select
            value={filters.category}
            onChange={updateFilter("category")}
            className="min-h-12 w-full min-w-0 rounded-2xl border border-navy/10 bg-cream px-4 text-sm font-bold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
          >
            <option>All</option>
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Status">
          <select
            value={filters.status}
            onChange={updateFilter("status")}
            className="min-h-12 w-full min-w-0 rounded-2xl border border-navy/10 bg-cream px-4 text-sm font-bold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
          >
            <option>All</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {formatStatus(status)}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Privacy">
          <select
            value={filters.privacy}
            onChange={updateFilter("privacy")}
            className="min-h-12 w-full min-w-0 rounded-2xl border border-navy/10 bg-cream px-4 text-sm font-bold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
          >
            {privacyOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </FilterField>

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

function PrayerCard({ isUpdating, onArchive, onDelete, onPrayed, onView, request }) {
  const isPrivate = normalizePrivacy(request.isPrivate);

  return (
    <motion.article
      variants={cardReveal}
      initial="hidden"
      animate="visible"
      className="rounded-3xl border border-navy/10 bg-white p-4 shadow-soft transition hover:-translate-y-1 hover:border-gold/60 hover:shadow-premium sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold ${
                isPrivate ? "bg-navy text-gold" : "bg-cream text-navy"
              }`}
            >
              {isPrivate ? <FaLock className="h-3 w-3" /> : <FaUnlock className="h-3 w-3" />}
              {isPrivate ? "Private" : "Public"}
            </span>
            <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-extrabold text-gold">
              {request.category}
            </span>
            <StatusBadge status={formatStatus(request.status)} />
          </div>

          <h2 className="mt-4 truncate font-display text-3xl font-bold text-navy">{request.name}</h2>
          <p className="mt-1 text-sm font-bold text-warm">{request.contact}</p>
        </div>

        <p className="shrink-0 text-sm font-bold text-warm">{formatDateTime(request.createdAt)}</p>
      </div>

      <p className="mt-4 line-clamp-3 text-sm font-semibold leading-7 text-warm">{request.message}</p>

      {request.adminNotes ? (
        <div className="mt-4 rounded-2xl border border-gold/20 bg-gold/10 p-3 text-sm font-semibold leading-6 text-navy">
          <span className="font-extrabold text-gold">Admin note: </span>
          {request.adminNotes}
        </div>
      ) : null}

      <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={() => onView(request.id)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-navy/10 bg-cream px-4 text-xs font-extrabold uppercase tracking-[0.1em] text-navy transition hover:border-gold hover:text-gold"
        >
          <FaEye className="h-4 w-4" />
          View
        </button>
        <button
          type="button"
          disabled={isUpdating === request.id || request.status === "prayed"}
          onClick={() => onPrayed(request.id)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gold px-4 text-xs font-extrabold uppercase tracking-[0.1em] text-navy transition hover:bg-navy hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaCheckCircle className="h-4 w-4" />
          Mark Prayed
        </button>
        <button
          type="button"
          disabled={isUpdating === request.id || request.status === "archived"}
          onClick={() => onArchive(request.id)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-navy px-4 text-xs font-extrabold uppercase tracking-[0.1em] text-gold transition hover:bg-gold hover:text-navy disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaArchive className="h-4 w-4" />
          Archive
        </button>
        <button
          type="button"
          onClick={() => onDelete(request)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-red-50 px-4 text-xs font-extrabold uppercase tracking-[0.1em] text-red-700 transition hover:bg-red-100"
        >
          <FaTrash className="h-4 w-4" />
          Delete
        </button>
      </div>
    </motion.article>
  );
}

function DetailItem({ label, value, wide = false }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-warm">{label}</p>
      <div className="mt-2 rounded-2xl border border-navy/10 bg-cream p-3 text-sm font-bold leading-6 text-navy">
        {value || "-"}
      </div>
    </div>
  );
}

function PrayerDetailsModal({ isOpen, isSaving, onArchive, onClose, onNotesChange, onPrayed, onSaveNotes, prayer }) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setNotes(prayer?.adminNotes || "");
  }, [prayer]);

  const handleSaveNotes = () => {
    onNotesChange(notes);
    onSaveNotes(prayer.id, notes);
  };

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title="Prayer Request Details">
      {prayer ? (
        <div className="grid gap-5 p-5">
          <div className="rounded-3xl bg-navy p-5 text-white">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-gold">
                {normalizePrivacy(prayer.isPrivate) ? <FaLock className="h-3 w-3" /> : <FaUnlock className="h-3 w-3" />}
                {normalizePrivacy(prayer.isPrivate) ? "Private Intention" : "Public Request"}
              </span>
              <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-extrabold text-gold">{prayer.category}</span>
              <StatusBadge status={formatStatus(prayer.status)} />
            </div>
            <h3 className="mt-4 font-display text-4xl font-bold">{prayer.name}</h3>
            <p className="mt-2 text-sm font-semibold text-white/65">{prayer.contact}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <DetailItem label="Submitted" value={formatDateTime(prayer.createdAt)} />
            <DetailItem label="Last Updated" value={formatDateTime(prayer.updatedAt)} />
            <DetailItem label="Prayer Message" value={prayer.message} wide />
          </div>

          <label className="grid gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-warm">
            Admin Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              placeholder="Add confidential pastoral notes for the admin team..."
              className="w-full resize-none rounded-2xl border border-navy/10 bg-cream px-4 py-3 text-sm font-semibold normal-case leading-7 tracking-normal text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
            />
          </label>

          <div className="grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveNotes}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-navy/10 bg-white px-5 text-xs font-extrabold uppercase tracking-[0.12em] text-navy transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save Notes
            </button>
            <button
              type="button"
              disabled={isSaving || prayer.status === "prayed"}
              onClick={() => onPrayed(prayer.id, notes)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gold px-5 text-xs font-extrabold uppercase tracking-[0.12em] text-navy transition hover:bg-navy hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaCheckCircle className="h-4 w-4" />
              Mark Prayed
            </button>
            <button
              type="button"
              disabled={isSaving || prayer.status === "archived"}
              onClick={() => onArchive(prayer.id, notes)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-navy px-5 text-xs font-extrabold uppercase tracking-[0.12em] text-gold transition hover:bg-gold hover:text-navy disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaArchive className="h-4 w-4" />
              Archive
            </button>
          </div>
        </div>
      ) : (
        <div className="p-5">
          <LoadingSkeleton rows={2} />
        </div>
      )}
    </AdminModal>
  );
}

function PrayerRequestsPage() {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [detailPrayer, setDetailPrayer] = useState(null);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(emptyFilters);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState("");
  const [requests, setRequests] = useState([]);
  const [success, setSuccess] = useState("");

  const loadRequests = async () => {
    try {
      setError("");
      setIsLoading(true);
      const response = await getPrayerRequests();
      setRequests(response?.prayers || []);
    } catch (requestError) {
      setError(requestError?.message || "Prayer requests could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = useMemo(() => filterPrayerRequests(requests, filters), [filters, requests]);

  const syncPrayer = (updatedPrayer) => {
    setRequests((current) => current.map((request) => (request.id === updatedPrayer.id ? updatedPrayer : request)));
    setDetailPrayer((current) => (current?.id === updatedPrayer.id ? updatedPrayer : current));
  };

  const handleView = async (id) => {
    setIsDetailOpen(true);
    setDetailPrayer(null);

    try {
      const response = await getPrayerRequest(id);
      setDetailPrayer(response?.prayer || response);
    } catch (requestError) {
      setIsDetailOpen(false);
      setError(requestError?.message || "Prayer request details could not be loaded.");
    }
  };

  const handleStatusUpdate = async (id, status, adminNotes) => {
    try {
      setIsUpdating(id);
      const response = await updatePrayerStatus(id, { adminNotes, status });
      syncPrayer(response?.prayer || response);
      setSuccess(`Prayer request marked as ${formatStatus(status)}.`);
    } catch (requestError) {
      setError(requestError?.message || "Prayer request could not be updated.");
    } finally {
      setIsUpdating("");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;

    try {
      await deletePrayerRequest(confirmDelete.id);
      setRequests((current) => current.filter((request) => request.id !== confirmDelete.id));
      setSuccess("Prayer request deleted successfully.");
      setConfirmDelete(null);
    } catch (requestError) {
      setError(requestError?.message || "Prayer request could not be deleted.");
    }
  };

  if (isLoading) {
    return <LoadingSkeleton rows={7} />;
  }

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Pastoral Care" title="Prayer Requests">
        Review parish intentions with privacy, reverence, and care. Private requests are marked clearly for pastoral discretion.
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
            onClick={loadRequests}
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

      <PrayerStats requests={requests} />
      <PrayerFilters filters={filters} onChange={setFilters} onClear={() => setFilters(emptyFilters)} />

      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-warm">
          Showing <span className="text-navy">{filteredRequests.length}</span> of{" "}
          <span className="text-navy">{requests.length}</span> prayer requests
        </p>
        <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-warm">
          <FaLock className="text-gold" />
          Private intentions require discretion
        </p>
      </div>

      {filteredRequests.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredRequests.map((request) => (
            <PrayerCard
              key={request.id}
              request={request}
              isUpdating={isUpdating}
              onArchive={(id) => handleStatusUpdate(id, "archived")}
              onDelete={setConfirmDelete}
              onPrayed={(id) => handleStatusUpdate(id, "prayed")}
              onView={handleView}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No prayer requests found" message="Try changing the filters or search text." />
      )}

      <PrayerDetailsModal
        prayer={detailPrayer}
        isOpen={isDetailOpen}
        isSaving={Boolean(isUpdating)}
        onArchive={(id, notes) => handleStatusUpdate(id, "archived", notes)}
        onClose={() => setIsDetailOpen(false)}
        onNotesChange={(notes) => setDetailPrayer((current) => (current ? { ...current, adminNotes: notes } : current))}
        onPrayed={(id, notes) => handleStatusUpdate(id, "prayed", notes)}
        onSaveNotes={(id, notes) => handleStatusUpdate(id, detailPrayer?.status || "pending", notes)}
      />

      <ConfirmModal
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Prayer Request"
        message={`Delete the prayer request from ${confirmDelete?.name || "this parishioner"}? This should only be done when the record is no longer needed.`}
        confirmLabel="Delete Request"
      />
    </div>
  );
}

export default PrayerRequestsPage;
