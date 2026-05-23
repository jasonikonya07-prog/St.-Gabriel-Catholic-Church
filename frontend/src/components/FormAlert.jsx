import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { gentleEase } from "../utils/animations";

function FormAlert({ status, tone = "light" }) {
  const isDark = tone === "dark";
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      {status ? (
        <motion.div
          key={`${status.type}-${status.message}`}
          initial={prefersReducedMotion ? { opacity: 0 } : status.type === "error" ? { opacity: 0, x: 0 } : { opacity: 0, y: 8 }}
          animate={
            prefersReducedMotion
              ? { opacity: 1 }
              : status.type === "error"
                ? { opacity: 1, x: [0, -6, 6, -4, 4, 0] }
                : { opacity: 1, y: 0 }
          }
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={{ duration: prefersReducedMotion ? 0.12 : status.type === "error" ? 0.46 : 0.34, ease: gentleEase }}
          className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 text-sm font-bold leading-6 ${
            status.type === "error"
              ? isDark
                ? "border-red-300/25 bg-red-500/10 text-red-100"
                : "border-red-200 bg-red-50 text-red-700"
              : isDark
                ? "border-gold/35 bg-gold/10 text-white"
                : "border-gold/35 bg-gold/10 text-navy"
          }`}
          role={status.type === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {status.type === "error" ? (
            <FaExclamationCircle className="mt-1 h-4 w-4 flex-none" />
          ) : (
            <FaCheckCircle className="mt-1 h-4 w-4 flex-none text-gold" />
          )}
          <span>{status.message}</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default FormAlert;
