import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FaEnvelope,
  FaEnvelopeOpenText,
  FaEye,
  FaPaperPlane,
  FaReply,
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
  deleteContactMessage,
  getContactMessage,
  getContactMessages,
  updateContactMessageStatus,
} from "../services/contactService";
import { cardReveal, fadeUp } from "../../utils/animations";

const statusOptions = ["all", "unread", "read", "replied"];

function formatStatus(status) {
  if (!status) return "Unread";
  return status.charAt(0).toUpperCase() + status.slice(1);
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

function buildMailto(message) {
  const subject = encodeURIComponent(`Re: ${message?.subject || "Message to St. Gabriel Catholic Church"}`);
  const body = encodeURIComponent(
    `Hello ${message?.sender || message?.name || ""},\n\nThank you for contacting St. Gabriel Catholic Church.\n\n`,
  );

  return `mailto:${message?.email || ""}?subject=${subject}&body=${body}`;
}

function filterMessages(messages, query, status) {
  const loweredQuery = query.trim().toLowerCase();

  return messages.filter((message) => {
    const searchable = [message.sender, message.name, message.email, message.phone, message.subject, message.message]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (loweredQuery && !searchable.includes(loweredQuery)) return false;
    if (status !== "all" && message.status !== status) return false;

    return true;
  });
}

function ContactStats({ messages }) {
  const unread = messages.filter((message) => message.status === "unread").length;
  const read = messages.filter((message) => message.status === "read").length;
  const replied = messages.filter((message) => message.status === "replied").length;
  const cards = [
    { change: "All contact submissions", icon: FaEnvelope, label: "Total Messages", tone: "gold", value: messages.length },
    { change: "Need attention", icon: FaEnvelope, label: "Unread", tone: "navy", value: unread },
    { change: "Opened by admin", icon: FaEnvelopeOpenText, label: "Read", tone: "gold", value: read },
    { change: "Responses sent", icon: FaReply, label: "Replied", tone: "navy", value: replied },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <StatCard key={card.label} {...card} index={index} />
      ))}
    </div>
  );
}

function InboxFilters({ query, status, onQueryChange, onStatusChange, onClear }) {
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
            placeholder="Search sender, email, phone, subject, or message..."
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
              {option === "all" ? "All Statuses" : formatStatus(option)}
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

function StatusActionButton({ children, disabled, icon: Icon, onClick, tone = "navy" }) {
  const toneClass =
    tone === "gold"
      ? "bg-gold text-navy hover:bg-navy hover:text-gold"
      : "bg-navy text-gold hover:bg-gold hover:text-navy";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-xs font-extrabold uppercase tracking-[0.1em] transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function ContactMessagesTable({ isUpdating, messages, onDelete, onStatusChange, onView }) {
  if (!messages.length) {
    return <EmptyState title="No messages found" message="Try changing the search text or inbox filter." />;
  }

  return (
    <motion.section
      variants={cardReveal}
      initial="hidden"
      animate="visible"
      className="overflow-hidden rounded-3xl border border-navy/10 bg-white shadow-soft"
    >
      <div className="border-b border-navy/10 p-4 sm:p-5">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-gold">Inbox</p>
        <p className="mt-1 text-sm font-semibold text-warm">{messages.length} visible messages</p>
      </div>

      <div className="overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[1080px] text-left">
          <thead className="bg-cream text-[10px] uppercase tracking-[0.14em] text-warm">
            <tr>
              {["Sender", "Email", "Phone", "Subject", "Status", "Date", "Actions"].map((column) => (
                <th key={column} className="px-4 py-4 font-extrabold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/10">
            {messages.map((message) => {
              const isUnread = message.status === "unread";

              return (
                <tr key={message.id} className={`transition hover:bg-cream/70 ${isUnread ? "bg-gold/10" : "bg-white"}`}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {isUnread ? <span className="h-2.5 w-2.5 rounded-full bg-gold" /> : <span className="h-2.5 w-2.5 rounded-full bg-navy/15" />}
                      <div>
                        <p className={`font-extrabold ${isUnread ? "text-navy" : "text-navy/80"}`}>{message.sender}</p>
                        <p className="mt-1 text-xs font-bold text-warm">From website contact form</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-navy">{message.email}</td>
                  <td className="px-4 py-4 text-sm font-bold text-warm">{message.phone || "-"}</td>
                  <td className="px-4 py-4">
                    <p className={`max-w-xs truncate text-sm ${isUnread ? "font-extrabold text-navy" : "font-bold text-warm"}`}>
                      {message.subject}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={formatStatus(message.status)} />
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-warm">{formatDateTime(message.createdAt)}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onView(message.id)}
                        className="grid h-11 w-11 place-items-center rounded-full bg-cream text-navy transition hover:bg-gold focus:outline-none focus:ring-4 focus:ring-gold/20"
                        aria-label="View message"
                      >
                        <FaEye className="h-4 w-4" />
                      </button>
                      <a
                        href={buildMailto(message)}
                        onClick={() => onStatusChange(message.id, "replied")}
                        className="grid h-11 w-11 place-items-center rounded-full bg-navy text-gold transition hover:bg-gold hover:text-navy focus:outline-none focus:ring-4 focus:ring-gold/20"
                        aria-label="Reply by email"
                      >
                        <FaPaperPlane className="h-4 w-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => onDelete(message)}
                        className="grid h-11 w-11 place-items-center rounded-full bg-red-50 text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-100"
                        aria-label="Delete message"
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={isUpdating === message.id || message.status === "read"}
                        onClick={() => onStatusChange(message.id, "read")}
                        className="rounded-full border border-navy/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-navy transition hover:border-gold hover:text-gold disabled:opacity-45"
                      >
                        Read
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating === message.id || message.status === "replied"}
                        onClick={() => onStatusChange(message.id, "replied")}
                        className="rounded-full border border-gold/40 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-gold transition hover:bg-gold hover:text-navy disabled:opacity-45"
                      >
                        Replied
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="hidden">
        {messages.map((message) => {
          const isUnread = message.status === "unread";

          return (
            <article
              key={message.id}
              className={`rounded-2xl border p-4 ${isUnread ? "border-gold/45 bg-gold/10" : "border-navy/10 bg-cream"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {isUnread ? <span className="h-2.5 w-2.5 rounded-full bg-gold" /> : null}
                    <p className="truncate font-extrabold text-navy">{message.sender}</p>
                  </div>
                  <p className="mt-1 truncate text-xs font-bold text-warm">{message.email}</p>
                </div>
                <StatusBadge status={formatStatus(message.status)} />
              </div>

              <p className="mt-4 font-extrabold text-navy">{message.subject}</p>
              <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-warm">{message.message}</p>

              <div className="mt-4 grid gap-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="font-extrabold text-warm">Phone</span>
                  <span className="text-right font-bold text-navy">{message.phone || "-"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="font-extrabold text-warm">Date</span>
                  <span className="text-right font-bold text-navy">{formatDateTime(message.createdAt)}</span>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <StatusActionButton icon={FaEye} onClick={() => onView(message.id)} tone="gold">
                  View
                </StatusActionButton>
                <a
                  href={buildMailto(message)}
                  onClick={() => onStatusChange(message.id, "replied")}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-navy px-4 text-xs font-extrabold uppercase tracking-[0.1em] text-gold transition hover:bg-gold hover:text-navy"
                >
                  <FaPaperPlane className="h-4 w-4" />
                  Reply
                </a>
                <StatusActionButton
                  disabled={isUpdating === message.id || message.status === "read"}
                  icon={FaEnvelopeOpenText}
                  onClick={() => onStatusChange(message.id, "read")}
                >
                  Mark Read
                </StatusActionButton>
                <button
                  type="button"
                  onClick={() => onDelete(message)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-red-50 px-4 text-xs font-extrabold uppercase tracking-[0.1em] text-red-700 transition hover:bg-red-100"
                >
                  <FaTrash className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </motion.section>
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

function MessageModal({ isOpen, isUpdating, message, onClose, onStatusChange }) {
  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title="Contact Message">
      {message ? (
        <div className="grid gap-5 p-5">
          <div className="rounded-3xl bg-navy p-5 text-white">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={formatStatus(message.status)} />
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-gold">
                {formatDateTime(message.createdAt)}
              </span>
            </div>
            <h3 className="mt-4 font-display text-4xl font-bold">{message.subject}</h3>
            <p className="mt-2 text-sm font-semibold text-white/65">
              From {message.sender} - {message.email}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <DetailItem label="Sender" value={message.sender} />
            <DetailItem label="Email" value={message.email} />
            <DetailItem label="Phone" value={message.phone} />
            <DetailItem label="Status" value={<StatusBadge status={formatStatus(message.status)} />} />
            <DetailItem label="Full Message" value={message.message} wide />
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <StatusActionButton
              disabled={isUpdating === message.id || message.status === "read"}
              icon={FaEnvelopeOpenText}
              onClick={() => onStatusChange(message.id, "read")}
              tone="gold"
            >
              Mark Read
            </StatusActionButton>
            <StatusActionButton
              disabled={isUpdating === message.id || message.status === "replied"}
              icon={FaReply}
              onClick={() => onStatusChange(message.id, "replied")}
            >
              Mark Replied
            </StatusActionButton>
            <a
              href={buildMailto(message)}
              onClick={() => onStatusChange(message.id, "replied")}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-gold/35 bg-white px-4 text-xs font-extrabold uppercase tracking-[0.1em] text-navy transition hover:border-gold hover:text-gold"
            >
              <FaPaperPlane className="h-4 w-4" />
              Reply Email
            </a>
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

function ContactMessagesPage() {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [detailMessage, setDetailMessage] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState("");
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [success, setSuccess] = useState("");

  const loadMessages = async () => {
    try {
      setError("");
      setIsLoading(true);
      const response = await getContactMessages();
      setMessages(response?.messages || []);
    } catch (requestError) {
      setError(requestError?.message || "Contact messages could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const filteredMessages = useMemo(() => filterMessages(messages, query, status), [messages, query, status]);

  const syncMessage = (updatedMessage) => {
    setMessages((current) => current.map((message) => (message.id === updatedMessage.id ? updatedMessage : message)));
    setDetailMessage((current) => (current?.id === updatedMessage.id ? updatedMessage : current));
  };

  const handleView = async (id) => {
    setIsModalOpen(true);
    setDetailMessage(null);

    try {
      const response = await getContactMessage(id);
      setDetailMessage(response?.message || response);
    } catch (requestError) {
      setIsModalOpen(false);
      setError(requestError?.message || "Contact message could not be opened.");
    }
  };

  const handleStatusChange = async (id, nextStatus) => {
    try {
      setIsUpdating(id);
      const response = await updateContactMessageStatus(id, nextStatus);
      syncMessage(response?.message || response);
      setSuccess(`Message marked as ${formatStatus(nextStatus)}.`);
    } catch (requestError) {
      setError(requestError?.message || "Message status could not be updated.");
    } finally {
      setIsUpdating("");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;

    try {
      await deleteContactMessage(confirmDelete.id);
      setMessages((current) => current.filter((message) => message.id !== confirmDelete.id));
      setSuccess("Contact message deleted successfully.");
      setConfirmDelete(null);
    } catch (requestError) {
      setError(requestError?.message || "Contact message could not be deleted.");
    }
  };

  if (isLoading) {
    return <LoadingSkeleton rows={7} />;
  }

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Parish Inbox" title="Contact Messages">
        Review website inquiries, mark replies, and respond by email from a calm admin inbox.
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
            onClick={loadMessages}
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

      <ContactStats messages={messages} />

      <InboxFilters
        query={query}
        status={status}
        onQueryChange={setQuery}
        onStatusChange={setStatus}
        onClear={() => {
          setQuery("");
          setStatus("all");
        }}
      />

      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-warm">
          Showing <span className="text-navy">{filteredMessages.length}</span> of{" "}
          <span className="text-navy">{messages.length}</span> messages
        </p>
        <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-warm">
          <span className="h-2.5 w-2.5 rounded-full bg-gold" />
          Unread messages are highlighted
        </p>
      </div>

      <ContactMessagesTable
        messages={filteredMessages}
        isUpdating={isUpdating}
        onDelete={setConfirmDelete}
        onStatusChange={handleStatusChange}
        onView={handleView}
      />

      <MessageModal
        message={detailMessage}
        isOpen={isModalOpen}
        isUpdating={isUpdating}
        onClose={() => setIsModalOpen(false)}
        onStatusChange={handleStatusChange}
      />

      <ConfirmModal
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Contact Message"
        message={`Delete the message from ${confirmDelete?.sender || confirmDelete?.name || "this sender"}? This action cannot be undone.`}
        confirmLabel="Delete Message"
      />
    </div>
  );
}

export default ContactMessagesPage;
