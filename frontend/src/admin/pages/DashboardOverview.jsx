import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FaBell,
  FaCalendarCheck,
  FaDonate,
  FaEnvelope,
  FaExclamationTriangle,
  FaPrayingHands,
  FaSyncAlt,
  FaUsers,
} from "react-icons/fa";
import EmptyState from "../components/EmptyState";
import LoadingSkeleton from "../components/LoadingSkeleton";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { getDashboardStats } from "../services/dashboardService";
import { formatCurrency, formatDate } from "../utils/formatters";
import { cardReveal, fadeUp } from "../../utils/animations";

const statConfig = [
  { key: "totalDonationsAmount", label: "Total Donations", icon: FaDonate, format: "currency", tone: "gold" },
  { key: "completedDonationsAmount", label: "Completed Giving", icon: FaDonate, format: "currency", tone: "navy" },
  { key: "pendingDonationsAmount", label: "Pending Giving", icon: FaExclamationTriangle, format: "currency", tone: "gold" },
  { key: "totalPrayerRequests", label: "Prayer Requests", icon: FaPrayingHands, format: "number", tone: "navy" },
  { key: "pendingPrayerRequests", label: "Pending Prayers", icon: FaPrayingHands, format: "number", tone: "gold" },
  { key: "totalContactMessages", label: "Contact Messages", icon: FaEnvelope, format: "number", tone: "gold" },
  { key: "unreadContactMessages", label: "Unread Messages", icon: FaEnvelope, format: "number", tone: "navy" },
  { key: "totalNewsletterSubscribers", label: "Newsletter Subscribers", icon: FaUsers, format: "number", tone: "gold" },
  { key: "upcomingEventsCount", label: "Upcoming Events", icon: FaCalendarCheck, format: "number", tone: "navy" },
  { key: "publishedAnnouncementsCount", label: "Published Announcements", icon: FaBell, format: "number", tone: "gold" },
];

function formatNumber(value) {
  return new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(Number(value || 0));
}

function formatStatValue(value, format) {
  if (format === "currency") return formatCurrency(value);
  return formatNumber(value);
}

function ChartCard({ children, eyebrow, title }) {
  return (
    <motion.section
      variants={cardReveal}
      initial="hidden"
      animate="visible"
      className="min-w-0 overflow-hidden rounded-3xl border border-navy/10 bg-white p-4 shadow-soft sm:p-5"
    >
      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-gold">{eyebrow}</p>
      <h2 className="mt-1 font-display text-2xl font-bold text-navy sm:text-3xl">{title}</h2>
      <div className="mt-5 h-72 min-w-0 sm:h-80">{children}</div>
    </motion.section>
  );
}

function RecentCard({ columns, emptyMessage, items = [], renderItem, title }) {
  return (
    <motion.section
      variants={cardReveal}
      initial="hidden"
      animate="visible"
      className="min-w-0 overflow-hidden rounded-3xl border border-navy/10 bg-white shadow-soft"
    >
      <div className="border-b border-navy/10 p-4 sm:p-5">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-gold">Recent</p>
        <h3 className="mt-1 font-display text-2xl font-bold text-navy">{title}</h3>
      </div>

      {items.length ? (
        <>
          {columns?.length ? (
            <div className="hidden grid-cols-[1.2fr_1fr_0.8fr] gap-4 border-b border-navy/10 bg-cream px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-warm md:grid">
              {columns.map((column) => (
                <span key={column}>{column}</span>
              ))}
            </div>
          ) : null}
          <div className="divide-y divide-navy/10">{items.map(renderItem)}</div>
        </>
      ) : (
        <div className="p-5">
          <EmptyState title="No records yet" message={emptyMessage} />
        </div>
      )}
    </motion.section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-6">
      <LoadingSkeleton rows={2} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-navy/10 bg-white p-5 shadow-soft">
            <div className="h-3 w-24 animate-pulse rounded-full bg-cream" />
            <div className="mt-5 h-9 w-32 animate-pulse rounded-full bg-cream" />
            <div className="mt-5 h-3 w-20 animate-pulse rounded-full bg-cream" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-96 rounded-3xl border border-navy/10 bg-white p-5 shadow-soft">
            <div className="h-4 w-40 animate-pulse rounded-full bg-cream" />
            <div className="mt-6 h-72 animate-pulse rounded-2xl bg-cream" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardOverview() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await getDashboardStats();
      setDashboard(response);
    } catch (requestError) {
      setError(requestError?.message || "Dashboard data could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const statCards = useMemo(() => {
    const stats = dashboard?.stats || dashboard?.data?.stats || {};
    return statConfig.map((item) => ({
      ...item,
      change: item.key.includes("Donations") ? "Giving records" : "Live parish data",
      value: formatStatValue(stats[item.key], item.format),
    }));
  }, [dashboard]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="grid gap-6">
        <PageHeader eyebrow="Command Center" title="Dashboard Overview">
          Monitor parish giving, pastoral care, communication, and content activity from one calm workspace.
        </PageHeader>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-soft"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold">Dashboard unavailable</h2>
              <p className="mt-2 text-sm font-bold leading-6">{error}</p>
            </div>
            <button
              type="button"
              onClick={loadDashboard}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-navy px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-gold transition hover:bg-gold hover:text-navy"
            >
              <FaSyncAlt className="h-4 w-4" />
              Retry
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const charts = dashboard?.charts || {};
  const monthlyDonations = charts.monthlyDonationsTotal || dashboard?.data?.monthlyDonationsTotal || [];
  const recent = dashboard?.recent || {};

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Command Center" title="Dashboard Overview">
        Monitor parish giving, pastoral care, communication, and content activity from one calm workspace.
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((stat, index) => (
          <StatCard key={stat.key} {...stat} index={index} />
        ))}
      </div>

      <div className="grid gap-6">
        <ChartCard eyebrow="Giving Trend" title="Monthly Donations">
          {monthlyDonations.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyDonations} margin={{ bottom: 8, left: 0, right: 16, top: 8 }}>
                <CartesianGrid stroke="#E8E0CF" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#6B7280" tickLine={false} />
                <YAxis stroke="#6B7280" tickFormatter={(value) => `${Math.round(value / 1000)}K`} width={44} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="total" name="Donations" stroke="#C9A227" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No donation trend yet" message="Monthly donation data will appear here once records are available." />
          )}
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <RecentCard
          title="Recent Donations"
          columns={["Donor", "Purpose", "Amount"]}
          items={recent.donations}
          emptyMessage="Recent donations will appear here."
          renderItem={(item) => (
            <div key={item.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1.2fr_1fr_0.8fr] md:items-center">
              <div>
                <p className="font-extrabold text-navy">{item.donorName || "Anonymous donor"}</p>
                <p className="mt-1 text-xs font-bold text-warm">{formatDate(item.createdAt)}</p>
              </div>
              <p className="text-sm font-bold text-warm">{item.purpose}</p>
              <div className="flex items-center justify-between gap-3 md:justify-end">
                <p className="font-display text-2xl font-bold text-navy">{formatCurrency(item.amount)}</p>
                <StatusBadge status={item.status} />
              </div>
            </div>
          )}
        />

        <RecentCard
          title="Recent Prayer Requests"
          columns={["Name", "Category", "Status"]}
          items={recent.prayerRequests}
          emptyMessage="Prayer requests submitted from the website will appear here."
          renderItem={(item) => (
            <div key={item.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1.2fr_1fr_0.8fr] md:items-center">
              <div>
                <p className="font-extrabold text-navy">{item.fullName}</p>
                <p className="mt-1 line-clamp-1 text-xs font-bold text-warm">{item.message}</p>
              </div>
              <p className="text-sm font-bold text-warm">{item.category}</p>
              <StatusBadge status={item.status} />
            </div>
          )}
        />

        <RecentCard
          title="Recent Contact Messages"
          columns={["Sender", "Subject", "Status"]}
          items={recent.contactMessages}
          emptyMessage="New contact messages will appear here."
          renderItem={(item) => (
            <div key={item.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1.2fr_1fr_0.8fr] md:items-center">
              <div>
                <p className="font-extrabold text-navy">{item.fullName}</p>
                <p className="mt-1 text-xs font-bold text-warm">{item.email}</p>
              </div>
              <p className="text-sm font-bold text-warm">{item.subject}</p>
              <StatusBadge status={item.status} />
            </div>
          )}
        />

      </div>
    </div>
  );
}

export default DashboardOverview;
