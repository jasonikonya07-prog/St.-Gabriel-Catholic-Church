import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FaBell,
  FaEdit,
  FaEye,
  FaEyeSlash,
  FaNewspaper,
  FaPlus,
  FaSearch,
  FaSyncAlt,
  FaTrash,
} from "react-icons/fa";
import AdminModal from "../components/AdminModal";
import ConfirmModal from "../components/ConfirmModal";
import EmptyState from "../components/EmptyState";
import LoadingSkeleton from "../components/LoadingSkeleton";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  publishAnnouncement,
  updateAnnouncement,
} from "../services/announcementService";
import { cardReveal, fadeUp } from "../../utils/animations";

const categories = ["Important", "Mass Update", "Youth", "Charity", "Parish News"];
const publishFilters = ["all", "published", "draft"];

const emptyAnnouncement = {
  category: "Parish News",
  fullContent: "",
  imageUrl: "",
  published: false,
  summary: "",
  title: "",
};

function formatDate(value) {
  if (!value) return "Not posted";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function filterAnnouncements(announcements, filters) {
  const query = filters.query.trim().toLowerCase();

  return announcements.filter((announcement) => {
    const searchable = [announcement.title, announcement.summary, announcement.fullContent, announcement.category]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (query && !searchable.includes(query)) return false;
    if (filters.category !== "all" && announcement.category !== filters.category) return false;
    if (filters.publishStatus === "published" && !announcement.published) return false;
    if (filters.publishStatus === "draft" && announcement.published) return false;

    return true;
  });
}

function sortAnnouncements(announcements) {
  return [...announcements].sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();

    return dateB - dateA;
  });
}

function AnnouncementStats({ announcements }) {
  const published = announcements.filter((announcement) => announcement.published).length;
  const drafts = announcements.length - published;
  const important = announcements.filter((announcement) => announcement.category === "Important").length;
  const massUpdates = announcements.filter((announcement) => announcement.category === "Mass Update").length;
  const cards = [
    { change: "All parish notices", icon: FaBell, label: "Announcements", tone: "gold", value: announcements.length },
    { change: "Visible on website", icon: FaEye, label: "Published", tone: "navy", value: published },
    { change: "Needs review", icon: FaEyeSlash, label: "Drafts", tone: "gold", value: drafts },
    { change: `${massUpdates} mass updates`, icon: FaNewspaper, label: "Important", tone: "navy", value: important },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <StatCard key={card.label} {...card} index={index} />
      ))}
    </div>
  );
}

function AnnouncementFilters({ filters, onChange, onClear }) {
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
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:items-center">
        <label className="relative block min-w-0">
          <FaSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
          <input
            value={filters.query}
            onChange={updateFilter("query")}
            placeholder="Search title, summary, content, or category..."
            className="min-h-12 w-full min-w-0 rounded-2xl border border-navy/10 bg-cream pl-11 pr-4 text-sm font-bold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
          />
        </label>

        <select
          value={filters.category}
          onChange={updateFilter("category")}
          className="min-h-12 w-full min-w-0 rounded-2xl border border-navy/10 bg-cream px-4 text-sm font-bold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>

        <select
          value={filters.publishStatus}
          onChange={updateFilter("publishStatus")}
          className="min-h-12 w-full min-w-0 rounded-2xl border border-navy/10 bg-cream px-4 text-sm font-bold capitalize text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
        >
          {publishFilters.map((filter) => (
            <option key={filter} value={filter}>
              {filter === "all" ? "Published and Draft" : filter}
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

function AnnouncementFormModal({ announcement, isOpen, isSaving, onClose, onSubmit }) {
  const [values, setValues] = useState(emptyAnnouncement);

  useEffect(() => {
    setValues(announcement ? { ...emptyAnnouncement, ...announcement } : emptyAnnouncement);
  }, [announcement, isOpen]);

  const updateValue = (field) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title={announcement?.id ? "Edit Announcement" : "Create Announcement"}>
      <form onSubmit={handleSubmit} className="grid gap-5 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-navy sm:col-span-2">
            Title
            <input
              required
              value={values.title}
              onChange={updateValue("title")}
              className="min-h-12 rounded-2xl border border-navy/10 bg-cream px-4 text-sm font-semibold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-navy">
            Category
            <select
              value={values.category}
              onChange={updateValue("category")}
              className="min-h-12 rounded-2xl border border-navy/10 bg-cream px-4 text-sm font-semibold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-bold text-navy">
            Image URL
            <input
              value={values.imageUrl}
              onChange={updateValue("imageUrl")}
              className="min-h-12 rounded-2xl border border-navy/10 bg-cream px-4 text-sm font-semibold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-navy sm:col-span-2">
            Summary
            <textarea
              required
              rows={3}
              value={values.summary}
              onChange={updateValue("summary")}
              className="resize-none rounded-2xl border border-navy/10 bg-cream px-4 py-3 text-sm font-semibold leading-7 text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-navy sm:col-span-2">
            Full Content
            <textarea
              required
              rows={6}
              value={values.fullContent}
              onChange={updateValue("fullContent")}
              className="resize-none rounded-2xl border border-navy/10 bg-cream px-4 py-3 text-sm font-semibold leading-7 text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
            />
          </label>
        </div>

        <label className="flex items-center justify-between gap-4 rounded-3xl border border-navy/10 bg-cream px-4 py-4 text-sm font-extrabold text-navy">
          Published
          <input type="checkbox" checked={values.published} onChange={updateValue("published")} className="h-5 w-5 accent-gold" />
        </label>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-navy/10 bg-white px-5 text-sm font-extrabold uppercase tracking-[0.1em] text-navy transition hover:border-gold hover:text-gold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-gold px-5 text-sm font-extrabold uppercase tracking-[0.1em] text-navy shadow-soft transition hover:bg-navy hover:text-gold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save Announcement"}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}

function AnnouncementCard({ announcement, isUpdating, onDelete, onEdit, onPublishToggle }) {
  return (
    <motion.article
      variants={cardReveal}
      initial="hidden"
      animate="visible"
      className="overflow-hidden rounded-3xl border border-navy/10 bg-white shadow-soft transition hover:-translate-y-1 hover:border-gold/60 hover:shadow-premium"
    >
      {announcement.imageUrl ? (
        <div
          className="h-44 bg-cover bg-center"
          style={{ backgroundImage: `linear-gradient(rgba(7,26,45,.18), rgba(7,26,45,.35)), url(${announcement.imageUrl})` }}
        />
      ) : null}

      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-extrabold text-gold">
            {announcement.category}
          </span>
          <StatusBadge status={announcement.published ? "Published" : "Draft"} />
          <span className="rounded-full bg-cream px-3 py-1 text-xs font-extrabold text-warm">
            Updated {formatDate(announcement.updatedAt || announcement.createdAt)}
          </span>
        </div>

        <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-navy">{announcement.title}</h2>
        <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-warm">{announcement.summary}</p>
        <p className="mt-3 line-clamp-3 text-sm font-medium leading-7 text-warm">{announcement.fullContent}</p>

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => onEdit(announcement)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-navy/10 bg-cream px-4 text-xs font-extrabold uppercase tracking-[0.1em] text-navy transition hover:border-gold hover:text-gold"
          >
            <FaEdit className="h-4 w-4" />
            Edit
          </button>
          <button
            type="button"
            disabled={isUpdating === announcement.id}
            onClick={() => onPublishToggle(announcement)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gold px-4 text-xs font-extrabold uppercase tracking-[0.1em] text-navy transition hover:bg-navy hover:text-gold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {announcement.published ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
            {announcement.published ? "Unpublish" : "Publish"}
          </button>
          <button
            type="button"
            onClick={() => onDelete(announcement)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-red-50 px-4 text-xs font-extrabold uppercase tracking-[0.1em] text-red-700 transition hover:bg-red-100"
          >
            <FaTrash className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function AnnouncementsManager() {
  const [announcements, setAnnouncements] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ category: "all", publishStatus: "all", query: "" });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState("");
  const [success, setSuccess] = useState("");

  const loadAnnouncements = async () => {
    try {
      setError("");
      setIsLoading(true);
      const response = await getAnnouncements();
      setAnnouncements(sortAnnouncements(response?.announcements || []));
    } catch (requestError) {
      setError(requestError?.message || "Announcements could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const filteredAnnouncements = useMemo(
    () => sortAnnouncements(filterAnnouncements(announcements, filters)),
    [announcements, filters],
  );

  const openCreate = () => {
    setEditingAnnouncement(null);
    setSuccess("");
    setIsFormOpen(true);
  };

  const handleSubmit = async (values) => {
    try {
      setError("");
      setIsSaving(true);
      const response = values.id ? await updateAnnouncement(values.id, values) : await createAnnouncement(values);
      const savedAnnouncement = response?.announcement || response;

      setAnnouncements((current) => {
        const exists = current.some((announcement) => announcement.id === savedAnnouncement.id);
        const nextAnnouncements = exists
          ? current.map((announcement) => (announcement.id === savedAnnouncement.id ? savedAnnouncement : announcement))
          : [savedAnnouncement, ...current];

        return sortAnnouncements(nextAnnouncements);
      });
      setIsFormOpen(false);
      setEditingAnnouncement(null);
      setSuccess(`${values.id ? "Updated" : "Created"} announcement successfully.`);
    } catch (requestError) {
      setError(requestError?.message || "Announcement could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishToggle = async (announcement) => {
    try {
      setIsUpdating(announcement.id);
      const response = await publishAnnouncement(announcement.id, !announcement.published);
      const updatedAnnouncement = response?.announcement || response;
      setAnnouncements((current) =>
        sortAnnouncements(current.map((item) => (item.id === updatedAnnouncement.id ? updatedAnnouncement : item))),
      );
      setSuccess(`${updatedAnnouncement.title} is now ${updatedAnnouncement.published ? "published" : "unpublished"}.`);
    } catch (requestError) {
      setError(requestError?.message || "Announcement publish status could not be updated.");
    } finally {
      setIsUpdating("");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;

    try {
      await deleteAnnouncement(confirmDelete.id);
      setAnnouncements((current) => current.filter((announcement) => announcement.id !== confirmDelete.id));
      setSuccess("Announcement deleted successfully.");
      setConfirmDelete(null);
    } catch (requestError) {
      setError(requestError?.message || "Announcement could not be deleted.");
    }
  };

  if (isLoading) {
    return <LoadingSkeleton rows={7} />;
  }

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Content Desk" title="Announcements Manager" onAction={openCreate} actionLabel="Create Announcement">
        Create, edit, publish, and organize parish news with a clean premium content workflow.
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
            onClick={loadAnnouncements}
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

      <AnnouncementStats announcements={announcements} />
      <AnnouncementFilters
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters({ category: "all", publishStatus: "all", query: "" })}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-warm">
          Showing <span className="text-navy">{filteredAnnouncements.length}</span> of{" "}
          <span className="text-navy">{announcements.length}</span> announcements
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gold px-5 text-xs font-extrabold uppercase tracking-[0.14em] text-navy shadow-soft transition hover:-translate-y-0.5 hover:bg-navy hover:text-gold"
        >
          <FaPlus className="h-4 w-4" />
          Create Announcement
        </button>
      </div>

      {filteredAnnouncements.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredAnnouncements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              isUpdating={isUpdating}
              onDelete={setConfirmDelete}
              onEdit={(selectedAnnouncement) => {
                setEditingAnnouncement(selectedAnnouncement);
                setSuccess("");
                setIsFormOpen(true);
              }}
              onPublishToggle={handlePublishToggle}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No announcements found" message="Try changing filters or create a new parish announcement." />
      )}

      <AnnouncementFormModal
        announcement={editingAnnouncement}
        isOpen={isFormOpen}
        isSaving={isSaving}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmModal
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Announcement"
        message={`Delete ${confirmDelete?.title || "this announcement"} from the parish news desk?`}
        confirmLabel="Delete Announcement"
      />
    </div>
  );
}

export default AnnouncementsManager;
