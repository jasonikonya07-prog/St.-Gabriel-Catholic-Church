import { motion } from "framer-motion";
import { FaEnvelope, FaIdBadge, FaShieldAlt, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { useAdminAuth } from "../context/AdminAuthContext";
import { formatDateTime, formatStatus } from "../utils/formatters";
import { cardReveal, fadeUp } from "../../utils/animations";

function ProfileField({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-cream p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy text-gold">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-warm">{label}</p>
          <p className="mt-1 break-words text-sm font-extrabold text-navy">{value || "N/A"}</p>
        </div>
      </div>
    </div>
  );
}

function AdminProfile() {
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Admin Profile" title="Profile / Logout">
        Review your administrator session and securely sign out when finished.
      </PageHeader>

      <motion.section
        animate="visible"
        className="overflow-hidden rounded-3xl border border-navy/10 bg-white shadow-soft"
        initial="hidden"
        variants={cardReveal}
      >
        <div className="bg-navy px-5 py-6 text-white sm:px-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gold text-navy shadow-[0_0_32px_rgba(201,162,39,0.2)]">
                <FaUserCircle className="h-8 w-8" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-3xl font-bold">{admin?.name || "Parish Administrator"}</p>
                <p className="mt-1 truncate text-sm font-semibold text-white/60">{admin?.email || "admin@stgabriel.org"}</p>
              </div>
            </div>

            <span className="inline-flex min-h-11 max-w-full flex-wrap items-center justify-center rounded-full bg-gold px-4 text-xs font-extrabold uppercase tracking-[0.12em] text-navy sm:tracking-[0.14em]">
              {formatStatus(admin?.role || "admin")}
            </span>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:p-7 lg:grid-cols-2">
          <ProfileField icon={FaIdBadge} label="Name" value={admin?.name || "Parish Administrator"} />
          <ProfileField icon={FaEnvelope} label="Email" value={admin?.email} />
          <ProfileField icon={FaShieldAlt} label="Role" value={formatStatus(admin?.role || "admin")} />
          <ProfileField icon={FaUserCircle} label="Last Login" value={formatDateTime(admin?.lastLogin || admin?.signedInAt)} />
        </div>
      </motion.section>

      <motion.section
        animate="visible"
        className="rounded-3xl border border-navy/10 bg-white p-5 shadow-soft sm:p-6"
        initial="hidden"
        variants={fadeUp}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="break-words font-display text-3xl font-bold text-navy">Secure Session</h2>
            <p className="mt-1 break-words text-sm font-semibold leading-6 text-warm">
              Sign out before leaving a shared computer or handing over parish administration work.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-navy px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-gold shadow-soft transition hover:bg-gold hover:text-navy sm:w-auto"
          >
            <FaSignOutAlt className="h-4 w-4" />
            Logout
          </button>
        </div>
      </motion.section>
    </div>
  );
}

export default AdminProfile;
