import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FaCalendarAlt,
  FaDownload,
  FaEye,
  FaFilter,
  FaMoneyBillWave,
  FaPhoneAlt,
  FaReceipt,
  FaSearch,
  FaShieldAlt,
  FaSyncAlt,
  FaTrash,
  FaTimes,
} from "react-icons/fa";
import AdminModal from "../components/AdminModal";
import ConfirmModal from "../components/ConfirmModal";
import EmptyState from "../components/EmptyState";
import LoadingSkeleton from "../components/LoadingSkeleton";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { exportCsv } from "../utils/exportCsv";
import {
  deleteAdminDonation,
  getAdminDonation,
  getAdminDonations,
  getAdminDonationStats,
  updateDonationStatus,
} from "../services/donationService";
import { cardReveal, fadeUp } from "../../utils/animations";

const givingPurposes = [
  "Tithe",
  "Church Development",
  "Charity",
  "Youth Ministry",
  "Mass Offering",
  "Other",
];

const statusOptions = ["completed", "pending", "failed", "cancelled"];
const paymentMethods = ["M-Pesa", "Card", "Bank Transfer"];

const emptyFilters = {
  dateFrom: "",
  dateTo: "",
  method: "All",
  purpose: "All",
  query: "",
  status: "All",
};

function formatKsh(value) {
  return `KSh ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(Number(value || 0))}`;
}

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

function getDonationDateValue(donation) {
  return String(donation.date || donation.createdAt || "").slice(0, 10);
}

function filterDonations(donations, filters) {
  const query = filters.query.trim().toLowerCase();

  return donations.filter((donation) => {
    const searchable = [
      donation.donorName,
      donation.phone,
      donation.referenceNumber,
      donation.mpesaReceipt,
      donation.email,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const donationDate = getDonationDateValue(donation);

    if (query && !searchable.includes(query)) return false;
    if (filters.status !== "All" && donation.status?.toLowerCase() !== filters.status) return false;
    if (filters.purpose !== "All" && donation.purpose !== filters.purpose) return false;
    if (filters.method !== "All" && donation.paymentMethod !== filters.method) return false;
    if (filters.dateFrom && donationDate < filters.dateFrom) return false;
    if (filters.dateTo && donationDate > filters.dateTo) return false;

    return true;
  });
}

function DonationStats({ stats }) {
  const cards = [
    {
      change: `${stats?.totalCount || 0} donation records`,
      icon: FaMoneyBillWave,
      label: "Total Donations",
      tone: "gold",
      value: formatKsh(stats?.totalAmount),
    },
    {
      change: `${stats?.totalCount || 0} records`,
      icon: FaCalendarAlt,
      label: "Donation Records",
      tone: "navy",
      value: stats?.totalCount || 0,
    },
    {
      change: `${stats?.pendingCount || 0} waiting review`,
      icon: FaShieldAlt,
      label: "Pending Donations",
      tone: "gold",
      value: formatKsh(stats?.pendingAmount),
    },
    {
      change: `${stats?.completedCount || 0} completed gifts`,
      icon: FaReceipt,
      label: "Completed",
      tone: "navy",
      value: formatKsh(stats?.completedAmount),
    },
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

function DonationsFilters({ filters, onChange, onClear }) {
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
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="inline-flex max-w-full flex-wrap items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-gold sm:tracking-[0.2em]">
            <FaFilter />
            Donation Filters
          </p>
          <p className="mt-1 break-words text-sm font-semibold text-warm">
            Search by donor, phone, reference number, or M-Pesa receipt.
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-navy/10 bg-cream px-4 text-xs font-extrabold uppercase tracking-[0.12em] text-navy transition hover:border-gold hover:text-gold lg:w-auto"
        >
          <FaTimes className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <label className="relative block min-w-0 md:col-span-2 xl:col-span-2">
          <FaSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
          <input
            value={filters.query}
            onChange={updateFilter("query")}
            placeholder="Search donor, phone, reference, receipt..."
            className="min-h-12 w-full min-w-0 rounded-2xl border border-navy/10 bg-cream pl-11 pr-4 text-sm font-bold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
          />
        </label>

        <FilterField label="Status">
          <select
            value={filters.status}
            onChange={updateFilter("status")}
            className="min-h-12 w-full min-w-0 rounded-2xl border border-navy/10 bg-cream px-4 text-sm font-bold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
          >
            <option>All</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Purpose">
          <select
            value={filters.purpose}
            onChange={updateFilter("purpose")}
            className="min-h-12 w-full min-w-0 rounded-2xl border border-navy/10 bg-cream px-4 text-sm font-bold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
          >
            <option>All</option>
            {givingPurposes.map((purpose) => (
              <option key={purpose}>{purpose}</option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Method">
          <select
            value={filters.method}
            onChange={updateFilter("method")}
            className="min-h-12 w-full min-w-0 rounded-2xl border border-navy/10 bg-cream px-4 text-sm font-bold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
          >
            <option>All</option>
            {paymentMethods.map((method) => (
              <option key={method}>{method}</option>
            ))}
          </select>
        </FilterField>

        <FilterField label="From">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={updateFilter("dateFrom")}
            className="min-h-12 w-full min-w-0 rounded-2xl border border-navy/10 bg-cream px-4 text-sm font-bold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
          />
        </FilterField>

        <FilterField label="To">
          <input
            type="date"
            value={filters.dateTo}
            onChange={updateFilter("dateTo")}
            className="min-h-12 w-full min-w-0 rounded-2xl border border-navy/10 bg-cream px-4 text-sm font-bold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
          />
        </FilterField>
      </div>
    </motion.section>
  );
}

function StatusSelect({ donation, disabled, onChange }) {
  return (
    <select
      aria-label={`Update status for ${donation.donorName}`}
      disabled={disabled}
      value={donation.status}
      onChange={(event) => onChange(donation.id, event.target.value)}
      className="min-h-11 rounded-full border border-navy/10 bg-cream px-3 text-xs font-extrabold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {statusOptions.map((status) => (
        <option key={status} value={status}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </option>
      ))}
    </select>
  );
}

function DonationsTable({ donations, isUpdating, onDelete, onStatusChange, onView }) {
  if (!donations.length) {
    return <EmptyState title="No donations found" message="Try adjusting your filters or date range." />;
  }

  return (
    <motion.section
      variants={cardReveal}
      initial="hidden"
      animate="visible"
      className="overflow-hidden rounded-3xl border border-navy/10 bg-white shadow-soft"
    >
      <div className="border-b border-navy/10 p-4 sm:p-5">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-gold">Donation Records</p>
        <p className="mt-1 text-sm font-semibold text-warm">{donations.length} visible donations</p>
      </div>

      <div className="overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[1180px] text-left">
          <thead className="bg-cream text-[10px] uppercase tracking-[0.14em] text-warm">
            <tr>
              {[
                "Donor Name",
                "Phone",
                "Amount",
                "Purpose",
                "Payment Method",
                "Status",
                "Reference Number",
                "M-Pesa Receipt",
                "Date",
                "Actions",
              ].map((column) => (
                <th key={column} className="px-4 py-4 font-extrabold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/10">
            {donations.map((donation) => (
              <tr key={donation.id} className="transition hover:bg-cream/50">
                <td className="px-4 py-4">
                  <p className="font-extrabold text-navy">{donation.donorName}</p>
                  <p className="mt-1 text-xs font-bold text-warm">{donation.email || "No email"}</p>
                </td>
                <td className="px-4 py-4 text-sm font-bold text-navy">{donation.phone}</td>
                <td className="px-4 py-4 font-display text-xl font-bold text-navy">{formatKsh(donation.amount)}</td>
                <td className="px-4 py-4 text-sm font-bold text-warm">{donation.purpose}</td>
                <td className="px-4 py-4 text-sm font-bold text-navy">{donation.paymentMethod}</td>
                <td className="px-4 py-4">
                  <StatusBadge status={donation.status} />
                </td>
                <td className="px-4 py-4 text-xs font-extrabold text-navy">{donation.referenceNumber}</td>
                <td className="px-4 py-4 text-xs font-extrabold text-navy">{donation.mpesaReceipt || "-"}</td>
                <td className="px-4 py-4 text-sm font-bold text-warm">{formatDateTime(donation.date || donation.createdAt)}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <StatusSelect donation={donation} disabled={isUpdating === donation.id} onChange={onStatusChange} />
                    <button
                      type="button"
                      onClick={() => onView(donation.id)}
                      className="grid h-11 w-11 place-items-center rounded-full bg-navy text-gold transition hover:bg-gold hover:text-navy focus:outline-none focus:ring-4 focus:ring-gold/20"
                      aria-label="View donation details"
                    >
                      <FaEye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(donation)}
                      className="grid h-11 w-11 place-items-center rounded-full bg-red-50 text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-100"
                      aria-label="Delete donation"
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
        {donations.map((donation) => (
          <article key={donation.id} className="rounded-2xl border border-navy/10 bg-cream p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-extrabold text-navy">{donation.donorName}</p>
                <p className="mt-1 flex items-center gap-2 text-xs font-bold text-warm">
                  <FaPhoneAlt className="text-gold" />
                  {donation.phone}
                </p>
              </div>
              <StatusBadge status={donation.status} />
            </div>

            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="font-extrabold text-warm">Amount</span>
                <span className="font-display text-xl font-bold text-navy">{formatKsh(donation.amount)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-extrabold text-warm">Purpose</span>
                <span className="text-right font-bold text-navy">{donation.purpose}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-extrabold text-warm">Method</span>
                <span className="text-right font-bold text-navy">{donation.paymentMethod}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-extrabold text-warm">Reference</span>
                <span className="text-right text-xs font-extrabold text-navy">{donation.referenceNumber}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-extrabold text-warm">M-Pesa Receipt</span>
                <span className="text-right text-xs font-extrabold text-navy">{donation.mpesaReceipt || "-"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-extrabold text-warm">Date</span>
                <span className="text-right font-bold text-navy">{formatDateTime(donation.date || donation.createdAt)}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <StatusSelect donation={donation} disabled={isUpdating === donation.id} onChange={onStatusChange} />
              <button
                type="button"
                onClick={() => onView(donation.id)}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-navy px-4 text-xs font-extrabold uppercase tracking-[0.12em] text-gold transition hover:bg-gold hover:text-navy"
              >
                <FaEye className="h-4 w-4" />
                View Details
              </button>
              <button
                type="button"
                onClick={() => onDelete(donation)}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-red-50 px-4 text-xs font-extrabold uppercase tracking-[0.12em] text-red-700 transition hover:bg-red-100"
              >
                <FaTrash className="h-4 w-4" />
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </motion.section>
  );
}

function DetailItem({ label, value, wide = false }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-warm">{label}</p>
      <div className="mt-2 rounded-2xl border border-navy/10 bg-cream p-3 text-sm font-bold text-navy">{value || "-"}</div>
    </div>
  );
}

function DonationDetailsModal({ donation, isOpen, isUpdating, onClose, onStatusChange }) {
  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title="Donation Details">
      {donation ? (
        <div className="grid gap-5 p-5">
          <div className="rounded-3xl bg-navy p-5 text-white">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-gold">Offering Summary</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="font-display text-4xl font-bold">{formatKsh(donation.amount)}</h3>
                <p className="mt-1 text-sm font-semibold text-white/65">{donation.purpose}</p>
              </div>
              <StatusBadge status={donation.status} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <DetailItem label="Donor Name" value={donation.donorName} />
            <DetailItem label="Phone" value={donation.phone} />
            <DetailItem label="Email" value={donation.email} />
            <DetailItem label="Payment Method" value={donation.paymentMethod} />
            <DetailItem label="Reference Number" value={donation.referenceNumber} />
            <DetailItem label="M-Pesa Receipt" value={donation.mpesaReceipt} />
            <DetailItem label="Date" value={formatDateTime(donation.date || donation.createdAt)} />
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-warm">Update Status</p>
              <div className="mt-2">
                <StatusSelect donation={donation} disabled={isUpdating === donation.id} onChange={onStatusChange} />
              </div>
            </div>
            <DetailItem label="Message / Intention" value={donation.message} wide />
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

function DonationsPage() {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [donations, setDonations] = useState([]);
  const [detailDonation, setDetailDonation] = useState(null);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(emptyFilters);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState("");
  const [stats, setStats] = useState(null);
  const [success, setSuccess] = useState("");

  const loadDonations = async () => {
    try {
      setError("");
      setIsLoading(true);
      const [donationsResponse, statsResponse] = await Promise.all([getAdminDonations(), getAdminDonationStats()]);
      setDonations(donationsResponse?.donations || []);
      setStats(statsResponse?.stats || statsResponse || null);
    } catch (requestError) {
      setError(requestError?.message || "Donation records could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, []);

  const filteredDonations = useMemo(() => filterDonations(donations, filters), [donations, filters]);

  const handleView = async (donationId) => {
    setIsDetailOpen(true);
    setDetailDonation(null);

    try {
      const response = await getAdminDonation(donationId);
      setDetailDonation(response?.donation || response);
    } catch (requestError) {
      setError(requestError?.message || "Donation details could not be loaded.");
      setIsDetailOpen(false);
    }
  };

  const handleStatusChange = async (donationId, status) => {
    try {
      setIsUpdating(donationId);
      const response = await updateDonationStatus(donationId, status);
      const updatedDonation = response?.donation || response;

      setDonations((current) =>
        current.map((donation) => (donation.id === donationId ? { ...donation, ...updatedDonation } : donation)),
      );
      setDetailDonation((current) => (current?.id === donationId ? { ...current, ...updatedDonation } : current));

      const statsResponse = await getAdminDonationStats();
      setStats(statsResponse?.stats || statsResponse || null);
      setSuccess(`Donation status updated to ${status}.`);
    } catch (requestError) {
      setError(requestError?.message || "Donation status could not be updated.");
    } finally {
      setIsUpdating("");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;

    try {
      await deleteAdminDonation(confirmDelete.id);
      setDonations((current) => current.filter((donation) => donation.id !== confirmDelete.id));
      setDetailDonation((current) => (current?.id === confirmDelete.id ? null : current));
      setIsDetailOpen(false);
      setSuccess("Donation record deleted successfully.");
      setConfirmDelete(null);

      const statsResponse = await getAdminDonationStats();
      setStats(statsResponse?.stats || statsResponse || null);
    } catch (requestError) {
      setError(requestError?.message || "Donation record could not be deleted.");
    }
  };

  const handleExport = () => {
    const exported = exportCsv(
      `st-gabriel-donations-${new Date().toISOString().slice(0, 10)}`,
      filteredDonations.map((donation) => ({
        "Donor Name": donation.donorName,
        Phone: donation.phone,
        Amount: donation.amount,
        Purpose: donation.purpose,
        "Payment Method": donation.paymentMethod,
        Status: donation.status,
        "Reference Number": donation.referenceNumber,
        "M-Pesa Receipt": donation.mpesaReceipt,
        Date: donation.date || donation.createdAt,
      })),
    );

    if (exported) {
      setSuccess("Donations CSV exported successfully.");
    }
  };

  if (isLoading) {
    return <LoadingSkeleton rows={7} />;
  }

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Stewardship" title="Donations, Tithe & Offerings">
        Manage tithe, offerings, payment confirmations, M-Pesa receipts, and donor records with a clean financial workflow.
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
            onClick={loadDonations}
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

      <DonationStats stats={stats} />

      <DonationsFilters filters={filters} onChange={setFilters} onClear={() => setFilters(emptyFilters)} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-warm">
          Showing <span className="text-navy">{filteredDonations.length}</span> of{" "}
          <span className="text-navy">{donations.length}</span> donations
        </p>
        <button
          type="button"
          onClick={handleExport}
          disabled={!filteredDonations.length}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gold px-5 text-xs font-extrabold uppercase tracking-[0.14em] text-navy shadow-soft transition hover:-translate-y-0.5 hover:bg-navy hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaDownload className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <DonationsTable
        donations={filteredDonations}
        isUpdating={isUpdating}
        onDelete={setConfirmDelete}
        onStatusChange={handleStatusChange}
        onView={handleView}
      />

      <DonationDetailsModal
        donation={detailDonation}
        isOpen={isDetailOpen}
        isUpdating={isUpdating}
        onClose={() => setIsDetailOpen(false)}
        onStatusChange={handleStatusChange}
      />

      <ConfirmModal
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Donation"
        message={`Delete the ${formatKsh(confirmDelete?.amount)} donation from ${confirmDelete?.donorName || "this donor"}?`}
        confirmLabel="Delete Donation"
      />
    </div>
  );
}

export default DonationsPage;
