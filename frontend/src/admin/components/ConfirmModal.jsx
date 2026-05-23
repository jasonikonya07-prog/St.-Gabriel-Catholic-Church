import { useState } from "react";
import { motion } from "framer-motion";
import { FaExclamationTriangle, FaSpinner, FaTrash } from "react-icons/fa";
import { buttonGlow, fadeUp } from "../../utils/animations";
import AdminModal from "./AdminModal";

function ConfirmModal({
  cancelLabel = "Cancel",
  confirmLabel = "Delete",
  description,
  icon: Icon = FaExclamationTriangle,
  isOpen,
  isLoading = false,
  message = "This action cannot be undone.",
  onClose,
  onConfirm,
  title = "Confirm Delete",
}) {
  const [isConfirming, setIsConfirming] = useState(false);
  const busy = isLoading || isConfirming;

  const handleConfirm = async () => {
    try {
      setIsConfirming(true);
      await onConfirm?.();
      onClose?.();
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <AdminModal isOpen={isOpen} onClose={busy ? undefined : onClose} title={title}>
      <motion.div animate="visible" className="p-5" initial="hidden" variants={fadeUp}>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-red-50 text-red-700 ring-1 ring-red-100">
            <Icon className="h-6 w-6" />
          </div>

          <div>
            <p className="text-base font-extrabold leading-7 text-navy">{message}</p>
            {description ? <p className="mt-2 text-sm font-semibold leading-6 text-warm">{description}</p> : null}
            <p className="mt-3 text-sm font-semibold leading-6 text-red-700">
              Please confirm this action before continuing.
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-navy/10 bg-white px-5 text-sm font-extrabold uppercase tracking-[0.1em] text-navy transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <motion.button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-red-600 px-5 text-sm font-extrabold uppercase tracking-[0.1em] text-white shadow-soft transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-70"
            initial="rest"
            whileHover={busy ? undefined : "hover"}
            whileTap={busy ? undefined : "tap"}
            variants={buttonGlow}
          >
            {busy ? <FaSpinner className="h-4 w-4 animate-spin" /> : <FaTrash className="h-4 w-4" />}
            {busy ? "Working..." : confirmLabel}
          </motion.button>
        </div>
      </motion.div>
    </AdminModal>
  );
}

export default ConfirmModal;
