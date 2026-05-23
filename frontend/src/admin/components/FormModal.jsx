import { motion } from "framer-motion";
import { FaEdit, FaPlusCircle } from "react-icons/fa";
import { fadeUp } from "../../utils/animations";
import AdminModal from "./AdminModal";
import AdminRecordForm from "./AdminRecordForm";

function FormModal({
  children,
  description,
  fields = [],
  isOpen,
  mode,
  onClose,
  onSubmit,
  record,
  title,
}) {
  const isEditing = mode ? mode === "edit" : Boolean(record?.id);
  const Icon = isEditing ? FaEdit : FaPlusCircle;
  const modalTitle = title || (isEditing ? "Edit Record" : "Create Record");

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      <motion.div animate="visible" initial="hidden" variants={fadeUp}>
        {description ? (
          <div className="border-b border-navy/10 bg-cream/60 px-5 py-4">
            <div className="flex items-start gap-3 text-sm font-semibold leading-6 text-warm">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold text-navy">
                <Icon className="h-4 w-4" />
              </span>
              <p>{description}</p>
            </div>
          </div>
        ) : null}

        {children || <AdminRecordForm fields={fields} record={record} onCancel={onClose} onSubmit={onSubmit} />}
      </motion.div>
    </AdminModal>
  );
}

export default FormModal;
