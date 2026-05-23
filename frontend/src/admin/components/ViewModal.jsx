import { motion } from "framer-motion";
import { FaInfoCircle } from "react-icons/fa";
import { fadeUp } from "../../utils/animations";
import { formatAdminValue } from "../utils/formatters";
import AdminModal from "./AdminModal";
import StatusBadge from "./StatusBadge";

function deriveFields(record) {
  return Object.keys(record || {})
    .filter((key) => !["password", "passwordHash"].includes(key))
    .map((key) => ({
      label: key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()),
      name: key,
      type: key.toLowerCase().includes("date") || key.toLowerCase().includes("at") ? "date" : "text",
    }));
}

function renderValue(field, value) {
  if (field.render) return field.render(value);
  if (field.type === "status" || field.name?.toLowerCase() === "status") return <StatusBadge status={value} />;
  if (typeof value === "boolean") return <StatusBadge status={value ? "Active" : "Inactive"} />;

  return formatAdminValue(value, field.type);
}

function ViewModal({ children, description, fields = [], footer, isOpen, onClose, record, title = "Record Details" }) {
  const activeFields = fields.length ? fields : deriveFields(record);

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title={title}>
      <motion.div animate="visible" className="grid min-w-0 gap-5 p-4 sm:p-5" initial="hidden" variants={fadeUp}>
        {description ? (
          <div className="flex min-w-0 gap-3 rounded-2xl border border-gold/20 bg-gold/10 p-4 text-sm font-bold leading-6 text-navy">
            <FaInfoCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <p className="min-w-0 break-words">{description}</p>
          </div>
        ) : null}

        {children || (
          <div className="grid gap-3 sm:grid-cols-2">
            {activeFields.map((field) => {
              const value = record?.[field.name];

              return (
                <div key={field.name} className={`min-w-0 ${field.type === "textarea" || field.fullWidth ? "sm:col-span-2" : ""}`}>
                  <p className="break-words text-xs font-extrabold uppercase tracking-[0.12em] text-warm sm:tracking-[0.16em]">{field.label}</p>
                  <div className="mt-2 min-h-12 min-w-0 break-words rounded-2xl border border-navy/10 bg-cream/70 p-3 text-sm font-bold leading-6 text-navy">
                    {renderValue(field, value)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {footer ? <div className="border-t border-navy/10 pt-4">{footer}</div> : null}
      </motion.div>
    </AdminModal>
  );
}

export default ViewModal;
