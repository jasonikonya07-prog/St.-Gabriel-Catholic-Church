import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { gentleEase } from "../../utils/animations";

function AdminModal({ children, isOpen, onClose, title }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: gentleEase }}
          className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-navy/70 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-8"
          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.28, ease: gentleEase }}
            className="flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-premium sm:max-h-[calc(100dvh-4rem)]"
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-navy/10 bg-cream px-4 py-4 sm:px-5">
              <h2 className="min-w-0 truncate font-display text-xl font-bold text-navy sm:text-2xl">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                disabled={!onClose}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-navy shadow-soft transition hover:bg-gold focus:outline-none focus:ring-4 focus:ring-gold/20"
                aria-label="Close modal"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default AdminModal;
