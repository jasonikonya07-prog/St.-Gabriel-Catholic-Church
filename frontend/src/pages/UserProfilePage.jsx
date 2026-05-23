import { FaEnvelope, FaPhoneAlt, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import { Navigate, useNavigate } from "react-router-dom";
import PremiumButton from "../components/PremiumButton";
import { useUserAuth } from "../context/UserAuthContext";

function UserProfilePage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, logout, user } = useUserAuth();

  if (isLoading) {
    return <section className="section-padding bg-cream text-center font-bold text-navy">Loading profile...</section>;
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <section className="section-padding bg-cream">
      <div className="section-shell">
        <div className="mx-auto max-w-3xl rounded-2xl border border-navy/10 bg-white p-4 shadow-premium sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-navy text-gold">
              <FaUserCircle className="h-10 w-10" />
            </div>
            <div className="min-w-0">
              <p className="eyebrow">My profile</p>
              <h1 className="mt-2 break-words font-display text-3xl font-bold leading-tight text-navy sm:text-4xl">{user?.fullName}</h1>
              <p className="mt-2 text-sm font-semibold text-warm">Secure parish website account</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="min-w-0 rounded-2xl border border-navy/10 bg-cream p-4 sm:p-5">
              <FaEnvelope className="h-5 w-5 text-gold" />
              <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.12em] text-warm sm:tracking-[0.18em]">Email</p>
              <p className="mt-1 break-all font-bold text-navy">{user?.email}</p>
            </div>
            <div className="min-w-0 rounded-2xl border border-navy/10 bg-cream p-4 sm:p-5">
              <FaPhoneAlt className="h-5 w-5 text-gold" />
              <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.12em] text-warm sm:tracking-[0.18em]">Phone</p>
              <p className="mt-1 break-words font-bold text-navy">{user?.phone || "Not provided"}</p>
            </div>
          </div>

          <PremiumButton type="button" variant="navy" icon={FaSignOutAlt} onClick={handleLogout} className="mt-8">
            Logout
          </PremiumButton>
        </div>
      </div>
    </section>
  );
}

export default UserProfilePage;
