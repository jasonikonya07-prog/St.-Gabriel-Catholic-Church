import { motion } from "framer-motion";
import { FaPlus } from "react-icons/fa";
import { buttonGlow, fadeUp } from "../../utils/animations";

function PageHeader({
  actionIcon: ActionIcon = FaPlus,
  actionLabel = "Add Record",
  children,
  className = "",
  description,
  eyebrow,
  meta,
  onAction,
  title,
}) {
  const body = description || children;

  return (
    <motion.header
      animate="visible"
      className={`flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between ${className}`}
      initial="hidden"
      variants={fadeUp}
    >
      <div className="min-w-0">
        {eyebrow ? <p className="break-words text-xs font-extrabold uppercase tracking-[0.16em] text-gold sm:tracking-[0.22em]">{eyebrow}</p> : null}
        <h1 className="mt-2 break-words font-display text-3xl font-bold leading-tight text-navy sm:text-4xl lg:text-5xl">{title}</h1>
        {body ? <p className="mt-3 max-w-3xl break-words text-sm font-semibold leading-6 text-warm">{body}</p> : null}
        {meta ? <div className="mt-4">{meta}</div> : null}
      </div>

      {onAction ? (
        <motion.button
          type="button"
          onClick={onAction}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gold px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-navy shadow-soft transition focus:outline-none focus:ring-4 focus:ring-gold/25 sm:w-auto"
          initial="rest"
          whileHover="hover"
          whileTap="tap"
          variants={buttonGlow}
        >
          {ActionIcon ? <ActionIcon className="h-4 w-4" /> : null}
          {actionLabel}
        </motion.button>
      ) : null}
    </motion.header>
  );
}

export default PageHeader;
