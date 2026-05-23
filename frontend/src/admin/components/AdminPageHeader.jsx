import { motion } from "framer-motion";
import { FaPlus } from "react-icons/fa";
import { fadeUp } from "../../utils/animations";

function AdminPageHeader({ actionLabel = "Add Record", children, eyebrow, onAction, title }) {
  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <p className="break-words text-xs font-extrabold uppercase tracking-[0.16em] text-gold sm:tracking-[0.22em]">{eyebrow}</p>
        <h1 className="mt-2 break-words font-display text-3xl font-bold leading-tight text-navy sm:text-5xl">{title}</h1>
        {children ? <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-warm">{children}</p> : null}
      </div>

      {onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gold px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-navy shadow-soft transition hover:-translate-y-0.5 hover:bg-navy hover:text-gold focus:outline-none focus:ring-4 focus:ring-gold/25 sm:w-auto"
        >
          <FaPlus className="h-4 w-4" />
          {actionLabel}
        </button>
      ) : null}
    </motion.div>
  );
}

export default AdminPageHeader;
