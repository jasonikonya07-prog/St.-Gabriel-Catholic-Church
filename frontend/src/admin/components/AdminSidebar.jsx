import {
  FaBell,
  FaCalendarAlt,
  FaChurch,
  FaDonate,
  FaEnvelope,
  FaExclamationTriangle,
  FaFileAlt,
  FaHome,
  FaPrayingHands,
  FaSignOutAlt,
  FaShieldAlt,
  FaTimes,
  FaUserCircle,
  FaUserShield,
  FaUsers,
} from "react-icons/fa";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

const sidebarGroups = [
  {
    title: "Parish Operations",
    links: [
      { label: "Dashboard Overview", to: "/admin/dashboard", icon: FaHome, match: ["/admin", "/admin/dashboard"] },
      { label: "Donations", to: "/admin/donations", icon: FaDonate },
      { label: "Prayer Requests", to: "/admin/prayer-requests", icon: FaPrayingHands },
      { label: "Contact Messages", to: "/admin/contact-messages", icon: FaEnvelope },
      { label: "Newsletter Subscribers", to: "/admin/newsletter", icon: FaUsers },
    ],
  },
  {
    title: "Website Content",
    links: [
      { label: "Events Manager", to: "/admin/events", icon: FaCalendarAlt },
      { label: "Announcements Manager", to: "/admin/announcements", icon: FaBell },
    ],
  },
  {
    title: "Administration",
    links: [
      { label: "Users", to: "/admin/users", icon: FaUserShield },
      { label: "Security Settings", to: "/admin/security-settings", icon: FaShieldAlt },
      { label: "Audit Logs", to: "/admin/audit-logs", icon: FaFileAlt },
      { label: "Security Events", to: "/admin/security-events", icon: FaExclamationTriangle },
      { label: "Profile / Logout", to: "/admin/profile", icon: FaUserCircle },
    ],
  },
];

function SidebarLink({ icon: Icon, label, match, onNavigate, to }) {
  const location = useLocation();
  const isDashboardActive = match?.includes(location.pathname);

  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm font-extrabold transition duration-300 focus:outline-none focus:ring-4 focus:ring-gold/20 ${
          isActive || isDashboardActive
            ? "bg-gold text-navy shadow-[0_16px_38px_rgba(201,162,39,0.24)]"
            : "text-white/70 hover:bg-white/[0.08] hover:text-gold"
        }`
      }
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.08] transition group-hover:bg-gold/15">
        <Icon className="h-4 w-4" />
      </span>
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

function AdminSidebar({ isMobile = false, onNavigate }) {
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
    onNavigate?.();
    navigate("/admin/login", { replace: true });
  };

  return (
    <aside className="flex h-full min-h-screen w-full flex-col overflow-hidden bg-navy text-white shadow-[18px_0_60px_rgba(7,26,45,0.22)]">
      <div className="border-b border-white/10 p-4">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3">
          <NavLink to="/admin/dashboard" onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold text-navy shadow-[0_0_32px_rgba(201,162,39,0.2)]">
              <FaChurch className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-2xl font-bold leading-none">St. Gabriel</span>
              <span className="block truncate text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/50">
                Church Admin
              </span>
            </span>
          </NavLink>

          {isMobile ? (
            <button
              type="button"
              aria-label="Close admin navigation"
              onClick={onNavigate}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.08] text-gold transition hover:bg-gold hover:text-navy"
            >
              <FaTimes className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-5 [scrollbar-width:thin] [scrollbar-color:rgba(201,162,39,.45)_transparent]">
        <div className="grid gap-6">
          {sidebarGroups.map((group) => (
            <div key={group.title}>
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/36">
                {group.title}
              </p>
              <div className="mt-3 grid gap-1.5">
                {group.links.map((link) => (
                  <SidebarLink key={link.to} {...link} onNavigate={onNavigate} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3">
          <p className="truncate text-sm font-extrabold text-white">{admin?.name || "Parish Administrator"}</p>
          <p className="mt-1 truncate text-xs font-semibold text-white/48">{admin?.email || "admin@stgabriel.org"}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl border border-gold/30 bg-gold/12 px-4 text-sm font-extrabold uppercase tracking-[0.14em] text-gold transition hover:bg-gold hover:text-navy"
        >
          <FaSignOutAlt className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
