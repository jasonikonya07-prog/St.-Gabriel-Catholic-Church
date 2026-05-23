import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FaCalendarAlt, FaEnvelope, FaPhoneAlt, FaShieldAlt, FaSignOutAlt, FaSyncAlt, FaUserCircle } from "react-icons/fa";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import FormAlert from "../components/FormAlert";
import PremiumButton from "../components/PremiumButton";
import { useUserAuth } from "../context/UserAuthContext";
import { fadeUp, gentleEase, scaleIn, staggerContainer } from "../utils/animations";

function formatDate(value) {
  if (!value) return "Not recorded yet";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded yet";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function ProfileDetail({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0 rounded-lg border border-navy/10 bg-white p-4 shadow-soft sm:p-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-navy text-gold">
          <Icon className="h-4 w-4" />
        </span>
        <p className="min-w-0 break-words text-xs font-extrabold uppercase tracking-[0.12em] text-warm sm:tracking-[0.18em]">{label}</p>
      </div>
      <p className="mt-4 break-words text-base font-extrabold text-navy">{value || "Not provided"}</p>
    </div>
  );
}

function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const { isAuthenticated, isLoading, logout, refreshProfile, user } = useUserAuth();
  const [status, setStatus] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (isAuthenticated) refreshProfile();
  }, [isAuthenticated, refreshProfile]);

  if (isLoading) {
    return (
      <section className="grid min-h-[60vh] place-items-center bg-cream px-5 text-center">
        <p className="font-display text-3xl font-bold text-navy">Loading profile...</p>
      </section>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate("/", { replace: true });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Logout failed. Please try again." });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <section className="catholic-pattern catholic-pattern-dark church-light-rays church-light-rays-animated relative min-h-[calc(100vh-5rem)] overflow-hidden bg-navy px-4 py-10 text-white sm:px-6 lg:px-8">
      <motion.div
        className="relative z-10 mx-auto grid min-h-[calc(100vh-10rem)] w-full max-w-6xl min-w-0 items-center gap-8 lg:grid-cols-[0.82fr_1.18fr]"
        initial={prefersReducedMotion ? false : "hidden"}
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div variants={fadeUp} custom={0.05} className="max-w-xl min-w-0">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-lg border border-gold/35 bg-gold text-navy shadow-soft">
            <FaUserCircle className="h-8 w-8" />
          </div>
          <p className="mt-7 break-words text-xs font-extrabold uppercase tracking-[0.16em] text-gold sm:tracking-[0.24em]">My Parish Profile</p>
          <h1 className="mt-4 break-words font-display text-4xl font-bold leading-tight text-cream sm:text-5xl lg:text-6xl">{user?.fullName || "Parish Member"}</h1>
          <p className="mt-6 max-w-lg text-base font-semibold leading-8 text-cream/78">
            Your secure St. Gabriel Catholic Church website account.
          </p>
        </motion.div>

        <motion.div
          variants={scaleIn}
          custom={0.16}
          transition={{ duration: prefersReducedMotion ? 0 : 0.55, ease: gentleEase }}
          className="min-w-0 rounded-lg border border-gold/25 bg-cream p-5 text-ink shadow-premium sm:p-8"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="eyebrow">Account details</p>
              <h2 className="mt-2 break-words font-display text-4xl font-bold leading-none text-navy">Profile</h2>
            </div>
            <PremiumButton icon={FaSignOutAlt} loading={isLoggingOut} loadingLabel="Logging out..." onClick={handleLogout} reveal={false} variant="navy">
              Logout
            </PremiumButton>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <ProfileDetail icon={FaEnvelope} label="Email" value={user?.email} />
            <ProfileDetail icon={FaPhoneAlt} label="Phone" value={user?.phone} />
            <ProfileDetail icon={FaShieldAlt} label="Account Role" value={user?.role === "user" ? "Parish Member" : `Parish ${user?.role}`} />
            <div className="sm:col-span-2">
              <ProfileDetail icon={FaCalendarAlt} label="Last login" value={formatDate(user?.lastLogin)} />
            </div>
          </div>

          {user?.role === "admin" || user?.role === "editor" ? (
            <div className="mt-6 rounded-lg border border-gold/30 bg-gold/10 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words text-xs font-extrabold uppercase tracking-[0.12em] text-gold sm:tracking-[0.18em]">Admin access enabled</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-navy">
                    Use your same email and password on the secure admin login page.
                  </p>
                </div>
                <PremiumButton to="/admin/login" icon={FaShieldAlt} reveal={false} variant="navy">
                  Admin Login
                </PremiumButton>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={refreshProfile}
            className="mt-5 inline-flex min-h-11 max-w-full flex-wrap items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-gold transition hover:text-navy sm:tracking-[0.14em]"
          >
            <FaSyncAlt className="h-3.5 w-3.5" />
            Refresh access
          </button>

          <FormAlert status={status} />
        </motion.div>
      </motion.div>
    </section>
  );
}

export default Profile;
