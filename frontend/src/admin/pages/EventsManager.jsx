import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FaCalendarAlt,
  FaEdit,
  FaEye,
  FaEyeSlash,
  FaMapMarkerAlt,
  FaPlus,
  FaSearch,
  FaStar,
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
import { createEvent, deleteEvent, getEvents, publishEvent, updateEvent } from "../services/eventService";
import { cardReveal, fadeUp } from "../../utils/animations";

const categories = ["Mass", "Youth", "Charity", "Bible Study", "Parish", "Special"];
const publishFilters = ["all", "published", "draft"];

const emptyEvent = {
  category: "Parish",
  date: "",
  description: "",
  endTime: "",
  featured: false,
  imageUrl: "",
  location: "",
  published: false,
  startTime: "",
  title: "",
};

function formatDate(value) {
  if (!value) return "Date not set";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDay(value) {
  if (!value) return "--";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "--";

  return new Intl.DateTimeFormat("en-KE", { day: "2-digit" }).format(date);
}

function formatMonth(value) {
  if (!value) return "TBD";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "TBD";

  return new Intl.DateTimeFormat("en-KE", { month: "short" }).format(date);
}

function formatTimeRange(event) {
  if (!event.startTime && !event.endTime) return "Time not set";
  if (event.startTime && event.endTime) return `${event.startTime} - ${event.endTime}`;
  return event.startTime || event.endTime;
}

function filterEvents(events, filters) {
  const query = filters.query.trim().toLowerCase();

  return events.filter((event) => {
    const searchable = [event.title, event.description, event.location, event.category]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (query && !searchable.includes(query)) return false;
    if (filters.category !== "all" && event.category !== filters.category) return false;
    if (filters.publishStatus === "published" && !event.published) return false;
    if (filters.publishStatus === "draft" && event.published) return false;

    return true;
  });
}

function sortEvents(events) {
  return [...events].sort((a, b) => {
    const dateA = new Date(`${a.date || "2999-12-31"}T${a.startTime || "23:59"}`).getTime();
    const dateB = new Date(`${b.date || "2999-12-31"}T${b.startTime || "23:59"}`).getTime();

    return dateA - dateB;
  });
}

function EventStats({ events }) {
  const published = events.filter((event) => event.published).length;
  const drafts = events.length - published;
  const featured = events.filter((event) => event.featured).length;
  const upcoming = events.filter((event) => event.date && new Date(`${event.date}T23:59:59`) >= new Date()).length;
  const cards = [
    { change: "Calendar records", icon: FaCalendarAlt, label: "Total Events", tone: "gold", value: events.length },
    { change: "Visible on website", icon: FaEye, label: "Published", tone: "navy", value: published },
    { change: "Not visible yet", icon: FaEyeSlash, label: "Drafts", tone: "gold", value: drafts },
    { change: `${featured} highlighted`, icon: FaStar, label: "Upcoming", tone: "navy", value: upcoming },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <StatCard key={card.label} {...card} index={index} />
      ))}
    </div>
  );
}

function EventFilters({ filters, onChange, onClear }) {
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
            placeholder="Search events by title, description, location..."
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

function EventFormModal({ event, isOpen, isSaving, onClose, onSubmit }) {
  const [values, setValues] = useState(emptyEvent);

  useEffect(() => {
    setValues(event ? { ...emptyEvent, ...event } : emptyEvent);
  }, [event, isOpen]);

  const updateValue = (field) => (inputEvent) => {
    const value = inputEvent.target.type === "checkbox" ? inputEvent.target.checked : inputEvent.target.value;
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (submitEvent) => {
    submitEvent.preventDefault();
    onSubmit(values);
  };

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title={event?.id ? "Edit Event" : "Create Event"}>
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

          <label className="grid gap-2 text-sm font-bold text-navy sm:col-span-2">
            Description
            <textarea
              required
              rows={4}
              value={values.description}
              onChange={updateValue("description")}
              className="resize-none rounded-2xl border border-navy/10 bg-cream px-4 py-3 text-sm font-semibold leading-7 text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-navy">
            Date
            <input
              required
              type="date"
              value={values.date}
              onChange={updateValue("date")}
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
            Start Time
            <input
              type="time"
              value={values.startTime}
              onChange={updateValue("startTime")}
              className="min-h-12 rounded-2xl border border-navy/10 bg-cream px-4 text-sm font-semibold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-navy">
            End Time
            <input
              type="time"
              value={values.endTime}
              onChange={updateValue("endTime")}
              className="min-h-12 rounded-2xl border border-navy/10 bg-cream px-4 text-sm font-semibold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-navy">
            Location
            <input
              required
              value={values.location}
              onChange={updateValue("location")}
              className="min-h-12 rounded-2xl border border-navy/10 bg-cream px-4 text-sm font-semibold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-navy">
            Image URL
            <input
              value={values.imageUrl}
              onChange={updateValue("imageUrl")}
              className="min-h-12 rounded-2xl border border-navy/10 bg-cream px-4 text-sm font-semibold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
            />
          </label>
        </div>

        <div className="grid gap-3 rounded-3xl border border-navy/10 bg-cream p-4 sm:grid-cols-2">
          <label className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-navy">
            Featured
            <input type="checkbox" checked={values.featured} onChange={updateValue("featured")} className="h-5 w-5 accent-gold" />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-navy">
            Published
            <input type="checkbox" checked={values.published} onChange={updateValue("published")} className="h-5 w-5 accent-gold" />
          </label>
        </div>

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
            {isSaving ? "Saving..." : "Save Event"}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}

function EventCard({ event, isUpdating, onDelete, onEdit, onPublishToggle }) {
  return (
    <motion.article
      variants={cardReveal}
      initial="hidden"
      animate="visible"
      className="overflow-hidden rounded-3xl border border-navy/10 bg-white shadow-soft transition hover:-translate-y-1 hover:border-gold/60 hover:shadow-premium"
    >
      <div className="grid sm:grid-cols-[8rem_1fr]">
        <div className="grid min-h-32 place-items-center bg-navy p-5 text-center text-gold">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em]">{formatMonth(event.date)}</p>
            <p className="font-display text-5xl font-bold leading-none">{formatDay(event.date)}</p>
          </div>
        </div>

        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-extrabold text-gold">{event.category}</span>
            <StatusBadge status={event.published ? "Published" : "Draft"} />
            {event.featured ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-navy px-3 py-1 text-xs font-extrabold text-gold">
                <FaStar className="h-3 w-3" />
                Featured
              </span>
            ) : null}
          </div>

          <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-navy">{event.title}</h2>
          <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-warm">{event.description}</p>

          <div className="mt-4 grid gap-2 text-sm font-bold text-warm sm:grid-cols-2">
            <span className="inline-flex items-center gap-2">
              <FaCalendarAlt className="text-gold" />
              {formatDate(event.date)} - {formatTimeRange(event)}
            </span>
            <span className="inline-flex items-center gap-2">
              <FaMapMarkerAlt className="text-gold" />
              {event.location}
            </span>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => onEdit(event)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-navy/10 bg-cream px-4 text-xs font-extrabold uppercase tracking-[0.1em] text-navy transition hover:border-gold hover:text-gold"
            >
              <FaEdit className="h-4 w-4" />
              Edit
            </button>
            <button
              type="button"
              disabled={isUpdating === event.id}
              onClick={() => onPublishToggle(event)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gold px-4 text-xs font-extrabold uppercase tracking-[0.1em] text-navy transition hover:bg-navy hover:text-gold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {event.published ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
              {event.published ? "Unpublish" : "Publish"}
            </button>
            <button
              type="button"
              onClick={() => onDelete(event)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-red-50 px-4 text-xs font-extrabold uppercase tracking-[0.1em] text-red-700 transition hover:bg-red-100"
            >
              <FaTrash className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function EventsManager() {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [error, setError] = useState("");
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({ category: "all", publishStatus: "all", query: "" });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState("");
  const [success, setSuccess] = useState("");

  const loadEvents = async () => {
    try {
      setError("");
      setIsLoading(true);
      const response = await getEvents();
      setEvents(sortEvents(response?.events || []));
    } catch (requestError) {
      setError(requestError?.message || "Events could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const filteredEvents = useMemo(() => sortEvents(filterEvents(events, filters)), [events, filters]);

  const openCreate = () => {
    setEditingEvent(null);
    setSuccess("");
    setIsFormOpen(true);
  };

  const handleSubmit = async (values) => {
    try {
      setError("");
      setIsSaving(true);
      const response = values.id ? await updateEvent(values.id, values) : await createEvent(values);
      const savedEvent = response?.event || response;

      setEvents((current) => {
        const exists = current.some((event) => event.id === savedEvent.id);
        const nextEvents = exists
          ? current.map((event) => (event.id === savedEvent.id ? savedEvent : event))
          : [savedEvent, ...current];

        return sortEvents(nextEvents);
      });
      setIsFormOpen(false);
      setEditingEvent(null);
      setSuccess(`${values.id ? "Updated" : "Created"} event successfully.`);
    } catch (requestError) {
      setError(requestError?.message || "Event could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishToggle = async (event) => {
    try {
      setIsUpdating(event.id);
      const response = await publishEvent(event.id, !event.published);
      const updatedEvent = response?.event || response;
      setEvents((current) => sortEvents(current.map((item) => (item.id === updatedEvent.id ? updatedEvent : item))));
      setSuccess(`${updatedEvent.title} is now ${updatedEvent.published ? "published" : "unpublished"}.`);
    } catch (requestError) {
      setError(requestError?.message || "Event publish status could not be updated.");
    } finally {
      setIsUpdating("");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;

    try {
      await deleteEvent(confirmDelete.id);
      setEvents((current) => current.filter((event) => event.id !== confirmDelete.id));
      setSuccess("Event deleted successfully.");
      setConfirmDelete(null);
    } catch (requestError) {
      setError(requestError?.message || "Event could not be deleted.");
    }
  };

  if (isLoading) {
    return <LoadingSkeleton rows={7} />;
  }

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Church Calendar" title="Events Manager" onAction={openCreate} actionLabel="Create Event">
        Create, schedule, publish, and feature parish events in a clean calendar-friendly workflow.
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
            onClick={loadEvents}
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

      <EventStats events={events} />
      <EventFilters
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters({ category: "all", publishStatus: "all", query: "" })}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-warm">
          Showing <span className="text-navy">{filteredEvents.length}</span> of{" "}
          <span className="text-navy">{events.length}</span> events
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gold px-5 text-xs font-extrabold uppercase tracking-[0.14em] text-navy shadow-soft transition hover:-translate-y-0.5 hover:bg-navy hover:text-gold"
        >
          <FaPlus className="h-4 w-4" />
          Create Event
        </button>
      </div>

      {filteredEvents.length ? (
        <div className="grid gap-4">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isUpdating={isUpdating}
              onDelete={setConfirmDelete}
              onEdit={(selectedEvent) => {
                setEditingEvent(selectedEvent);
                setSuccess("");
                setIsFormOpen(true);
              }}
              onPublishToggle={handlePublishToggle}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No events found" message="Try changing the filters or create a new parish event." />
      )}

      <EventFormModal
        event={editingEvent}
        isOpen={isFormOpen}
        isSaving={isSaving}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmModal
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Event"
        message={`Delete ${confirmDelete?.title || "this event"} from the church calendar?`}
        confirmLabel="Delete Event"
      />
    </div>
  );
}

export default EventsManager;
