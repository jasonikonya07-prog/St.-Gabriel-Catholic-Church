import { FaBars, FaChurch, FaExternalLinkAlt, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

function AdminTopbar({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuth();
  const title =
    location.pathname === "/admin" || location.pathname === "/admin/dashboard"
      ? "Dashboard"
      : location.pathname.split("/").filter(Boolean).at(-1)?.replaceAll("-", " ") || "overview";
  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-navy/10 bg-cream/92 px-4 py-3 shadow-[0_14px_34px_rgba(7,26,45,0.06)] backdrop-blur-xl sm:px-5 lg:px-8">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="grid h-11 w-11 place-items-center rounded-full bg-navy text-gold shadow-sm transition hover:bg-gold hover:text-navy lg:hidden"
            aria-label="Open admin navigation"
          >
            <FaBars className="h-4 w-4" />
          </button>
          <span className="hidden h-11 w-11 place-items-center rounded-full bg-navy text-gold lg:grid">
            <FaChurch className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="max-w-[42vw] truncate text-[10px] font-extrabold uppercase tracking-[0.16em] text-gold sm:max-w-none sm:tracking-[0.18em]">
              St. Gabriel Church Admin
            </p>
            <h2 className="max-w-[44vw] truncate text-base font-extrabold capitalize text-navy sm:max-w-none sm:text-lg">
              {title}
            </h2>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/"
            className="hidden min-h-11 items-center gap-2 rounded-full border border-navy/10 bg-white px-4 text-xs font-extrabold uppercase tracking-[0.12em] text-navy shadow-sm transition hover:border-gold hover:text-gold sm:inline-flex"
          >
            <FaExternalLinkAlt className="h-3 w-3" />
            View Site
          </Link>
          <Link
            to="/admin/profile"
            className="grid h-11 w-11 place-items-center rounded-full border border-navy/10 bg-white text-navy shadow-sm transition hover:border-gold hover:text-gold"
            aria-label="Admin profile"
          >
            <FaUserCircle className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="grid h-11 w-11 place-items-center rounded-full bg-navy text-gold shadow-sm transition hover:bg-gold hover:text-navy"
            aria-label="Sign out"
            title={admin?.email}
          >
            <FaSignOutAlt className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default AdminTopbar;
