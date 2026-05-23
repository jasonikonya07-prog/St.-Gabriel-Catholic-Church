import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FaChevronLeft,
  FaChevronRight,
  FaSave,
  FaSearch,
  FaSyncAlt,
  FaUserCheck,
  FaUserShield,
  FaUsers,
} from "react-icons/fa";
import EmptyState from "../components/EmptyState";
import LoadingSkeleton from "../components/LoadingSkeleton";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { formatDateTime, formatStatus } from "../utils/formatters";
import { getAdminUsers, updateAdminUser } from "../../services/adminUserService";
import { cardReveal, fadeUp } from "../../utils/animations";

const fallbackPagination = {
  limit: 20,
  page: 1,
  pages: 1,
  total: 0,
};

const roleOptions = [
  { label: "Parish Member", value: "user" },
  { label: "Admin", value: "admin" },
  { label: "Editor", value: "editor" },
];

function normalizeRows(response) {
  return response?.users || response?.data?.users || [];
}

function normalizePagination(response, rows) {
  return {
    ...fallbackPagination,
    total: rows.length,
    ...(response?.data?.pagination || response?.pagination || {}),
  };
}

function buildDrafts(users) {
  return Object.fromEntries(
    users.map((user) => [
      user.id,
      {
        isActive: user.isActive !== false,
        role: user.role || "user",
      },
    ]),
  );
}

function getLatestLogin(user) {
  const dates = [user.lastLogin, user.adminAccess?.lastLogin]
    .map((value) => {
      const date = value ? new Date(value) : null;
      return date && !Number.isNaN(date.getTime()) ? date : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.getTime() - a.getTime());

  return dates[0]?.toISOString() || user.lastLogin;
}

function MessageBanner({ message, type = "success" }) {
  if (!message) return null;

  const isError = type === "error";

  return (
    <motion.div
      animate="visible"
      className={`rounded-3xl border p-4 text-sm font-extrabold leading-6 shadow-soft ${
        isError ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
      initial="hidden"
      role={isError ? "alert" : "status"}
      variants={fadeUp}
    >
      {message}
    </motion.div>
  );
}

function RoleBadge({ role }) {
  const value = role || "user";
  const isElevated = value === "admin" || value === "editor";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-[0.1em] ring-1 ring-inset ${
        isElevated ? "bg-gold/12 text-gold ring-gold/25" : "bg-navy/10 text-navy ring-navy/10"
      }`}
    >
      {isElevated ? <FaUserShield className="h-3.5 w-3.5" /> : <FaUsers className="h-3.5 w-3.5" />}
      {value === "user" ? "Member" : formatStatus(value)}
    </span>
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
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,14rem)_minmax(0,14rem)_auto] xl:items-center">
        <label className="relative block min-w-0">
          <FaSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
          <input
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value })}
            placeholder="Search by name, email, or phone..."
            className="min-h-12 w-full min-w-0 rounded-2xl border border-navy/10 bg-cream pl-11 pr-4 text-sm font-bold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
          />
        </label>

        <select
          value={filters.role}
          onChange={(event) => onChange({ role: event.target.value })}
          className="min-h-12 w-full min-w-0 rounded-2xl border border-navy/10 bg-cream px-4 text-sm font-bold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
        >
          <option value="all">All Roles</option>
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(event) => onChange({ status: event.target.value })}
          className="min-h-12 w-full min-w-0 rounded-2xl border border-navy/10 bg-cream px-4 text-sm font-bold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button
          type="button"
          onClick={onClear}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-navy/10 bg-cream px-5 text-xs font-extrabold uppercase tracking-[0.12em] text-navy transition hover:border-gold hover:text-gold xl:w-auto"
        >
          Clear
        </button>
      </div>
    </motion.section>
  );
}

function PaginationControls({ pagination, onPageChange }) {
  const currentPage = Number(pagination.page || 1);
  const totalPages = Math.max(Number(pagination.pages || 1), 1);
  const canGoBack = currentPage > 1;
  const canGoForward = currentPage < totalPages;

  return (
    <div className="flex flex-col gap-3 border-t border-navy/10 bg-cream px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-sm font-bold text-warm">
        Page <span className="text-navy">{currentPage}</span> of <span className="text-navy">{totalPages}</span>
        <span className="mx-2 text-navy/30">|</span>
        <span className="text-navy">{pagination.total || 0}</span> users
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

function UserControls({ draft, isSaving, onChange, onSave, user }) {
  return (
    <div className="grid gap-3 lg:grid-cols-[11rem_9rem_auto] lg:items-center">
      <select
        value={draft?.role || user.role || "user"}
        onChange={(event) => onChange(user.id, { role: event.target.value })}
        className="min-h-11 rounded-2xl border border-navy/10 bg-cream px-3 text-sm font-bold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
      >
        {roleOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        aria-pressed={draft?.isActive !== false}
        onClick={() => onChange(user.id, { isActive: !(draft?.isActive !== false) })}
        className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 text-xs font-extrabold uppercase tracking-[0.12em] transition ${
          draft?.isActive !== false ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" : "bg-red-50 text-red-700 ring-1 ring-red-100"
        }`}
      >
        {draft?.isActive !== false ? "Active" : "Inactive"}
      </button>

      <button
        type="button"
        disabled={isSaving}
        onClick={() => onSave(user)}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gold px-4 text-xs font-extrabold uppercase tracking-[0.12em] text-navy transition hover:bg-navy hover:text-gold disabled:cursor-not-allowed disabled:opacity-60"
      >
        <FaSave className="h-3.5 w-3.5" />
        {isSaving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

function UsersTable({ drafts, onDraftChange, onPageChange, onSave, pagination, savingId, users }) {
  if (!users.length) {
    return <EmptyState title="No users found" message="Registered parish website users will appear here." />;
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
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-gold">Registered Website Users</p>
          <p className="mt-1 text-sm font-semibold text-white/65">Promote members to admin or editor access when needed.</p>
        </div>
        <FaUserCheck className="hidden h-6 w-6 text-gold sm:block" />
      </div>

      <div className="overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[1180px] text-left">
          <thead className="bg-cream text-[10px] uppercase tracking-[0.14em] text-warm">
            <tr>
              {["Joined", "User", "Phone", "Role", "Status", "Last Login", "Admin Controls"].map((column) => (
                <th key={column} className="px-5 py-4 font-extrabold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/10">
            {users.map((user) => (
              <tr key={user.id} className="transition hover:bg-cream/70">
                <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-warm">{formatDateTime(user.createdAt)}</td>
                <td className="px-5 py-4">
                  <p className="font-extrabold text-navy">{user.fullName}</p>
                  <p className="mt-1 text-xs font-bold text-warm">{user.email}</p>
                  {user.adminAccess?.isActive ? (
                    <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.12em] text-gold">
                      Admin login synced
                    </p>
                  ) : null}
                </td>
                <td className="px-5 py-4 text-sm font-bold text-navy">{user.phone || "N/A"}</td>
                <td className="px-5 py-4">
                  <RoleBadge role={user.role} />
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={user.isActive ? "Active" : "Inactive"} />
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-warm">{formatDateTime(getLatestLogin(user))}</td>
                <td className="px-5 py-4">
                  <UserControls
                    draft={drafts[user.id]}
                    isSaving={savingId === user.id}
                    onChange={onDraftChange}
                    onSave={onSave}
                    user={user}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hidden">
        {users.map((user) => (
          <article key={user.id} className="rounded-2xl border border-navy/10 bg-cream p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-extrabold text-navy">{user.fullName}</p>
                <p className="mt-1 truncate text-sm font-bold text-warm">{user.email}</p>
              </div>
              <RoleBadge role={user.role} />
            </div>

            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="font-extrabold text-warm">Phone</span>
                <span className="text-right font-bold text-navy">{user.phone || "N/A"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-extrabold text-warm">Status</span>
                <span className="text-right font-bold text-navy">{user.isActive ? "Active" : "Inactive"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-extrabold text-warm">Joined</span>
                <span className="text-right font-bold text-navy">{formatDateTime(user.createdAt)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-extrabold text-warm">Last Login</span>
                <span className="text-right font-bold text-navy">{formatDateTime(getLatestLogin(user))}</span>
              </div>
              {user.adminAccess?.isActive ? (
                <p className="rounded-xl border border-gold/20 bg-gold/10 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-gold">
                  Admin login synced
                </p>
              ) : null}
            </div>

            <div className="mt-4">
              <UserControls
                draft={drafts[user.id]}
                isSaving={savingId === user.id}
                onChange={onDraftChange}
                onSave={onSave}
                user={user}
              />
            </div>
          </article>
        ))}
      </div>

      <PaginationControls pagination={pagination} onPageChange={onPageChange} />
    </motion.section>
  );
}

function UsersManager() {
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ role: "all", search: "", status: "all" });
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(fallbackPagination);
  const [savingId, setSavingId] = useState("");
  const [success, setSuccess] = useState("");
  const [users, setUsers] = useState([]);

  const queryParams = useMemo(
    () => ({
      limit: 20,
      page,
      ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
      ...(filters.role !== "all" ? { role: filters.role } : {}),
      ...(filters.status !== "all" ? { status: filters.status } : {}),
    }),
    [filters.role, filters.search, filters.status, page],
  );

  const loadUsers = useCallback(async () => {
    try {
      setError("");
      setIsLoading(true);
      const response = await getAdminUsers(queryParams);
      const rows = normalizeRows(response);
      setUsers(rows);
      setDrafts(buildDrafts(rows));
      setPagination(normalizePagination(response, rows));
    } catch (requestError) {
      setError(requestError?.message || "Users could not be loaded.");
      setUsers([]);
      setPagination(fallbackPagination);
    } finally {
      setIsLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const updateFilters = (patch) => {
    setPage(1);
    setFilters((current) => ({ ...current, ...patch }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters({ role: "all", search: "", status: "all" });
  };

  const updateDraft = (id, patch) => {
    setSuccess("");
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...(current[id] || {}),
        ...patch,
      },
    }));
  };

  const saveUser = async (user) => {
    const draft = drafts[user.id] || {};

    try {
      setError("");
      setSuccess("");
      setSavingId(user.id);
      const response = await updateAdminUser(user.id, {
        isActive: draft.isActive !== false,
        role: draft.role || user.role || "user",
      });
      const updatedUser = response?.user || response?.data?.user;

      if (updatedUser) {
        setUsers((current) => current.map((item) => (item.id === updatedUser.id ? updatedUser : item)));
        setDrafts((current) => ({ ...current, [updatedUser.id]: { isActive: updatedUser.isActive !== false, role: updatedUser.role } }));
      }

      setSuccess(response?.message || "User updated successfully.");
    } catch (requestError) {
      setError(requestError?.message || "User could not be updated.");
    } finally {
      setSavingId("");
    }
  };

  if (isLoading && !users.length) return <LoadingSkeleton rows={8} />;

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Parish Accounts" title="Users" onAction={loadUsers} actionIcon={FaSyncAlt} actionLabel="Refresh">
        View registered website users, activate accounts, and sync admin access for trusted parish team members.
      </PageHeader>

      <MessageBanner message={error} type="error" />
      <MessageBanner message={success} />

      <FilterBar filters={filters} onChange={updateFilters} onClear={clearFilters} />

      {isLoading ? (
        <LoadingSkeleton rows={5} />
      ) : (
        <UsersTable
          drafts={drafts}
          onDraftChange={updateDraft}
          onPageChange={setPage}
          onSave={saveUser}
          pagination={pagination}
          savingId={savingId}
          users={users}
        />
      )}
    </div>
  );
}

export default UsersManager;
