import { useEffect, useMemo, useState } from "react";
import { FaChurch } from "react-icons/fa";
import AdminNotFound from "../admin/pages/AdminNotFound";
import { getAdminToken } from "../services/adminAuthService";
import { useAdminAuth } from "../context/AdminAuthContext";

function normalizeRole(role) {
  return String(role || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasRoleAccess(admin, allowedRoles) {
  if (!allowedRoles?.length) return true;

  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);
  const adminRoles = Array.isArray(admin?.roles) ? admin.roles : [admin?.role];

  return adminRoles.some((role) => normalizedAllowedRoles.includes(normalizeRole(role)));
}

function AdminRouteLoading() {
  return (
    <section className="grid min-h-screen place-items-center bg-navy px-4 text-white">
      <div className="w-full max-w-sm rounded-lg border border-white/15 bg-white/10 px-5 py-7 text-center shadow-[0_24px_80px_rgba(0,0,0,0.26)] backdrop-blur-xl sm:px-8">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-lg bg-gold text-navy shadow-[0_0_34px_rgba(201,162,39,0.28)]">
          <FaChurch className="h-7 w-7" />
        </div>
        <div className="mt-5 break-words text-sm font-extrabold uppercase tracking-[0.12em] text-gold sm:tracking-[0.18em]">Checking Access</div>
        <p className="mt-3 max-w-xs text-sm font-semibold leading-6 text-cream/70">Verifying your admin session securely.</p>
      </div>
    </section>
  );
}

function AdminProtectedRoute({ allowedRoles, children }) {
  const { logout, setVerifiedAdmin, verifyAdmin } = useAdminAuth();
  const allowedRoleKey = useMemo(() => (allowedRoles || []).join("|").toLowerCase(), [allowedRoles]);
  const [accessState, setAccessState] = useState(() => (getAdminToken() ? "checking" : "unauthorized"));

  useEffect(() => {
    let isActive = true;

    async function checkAdminSession() {
      if (!getAdminToken()) {
        await logout();
        if (isActive) setAccessState("unauthorized");
        return;
      }

      setAccessState("checking");

      try {
        const verifiedAdmin = await verifyAdmin();

        if (!isActive) return;

        if (!hasRoleAccess(verifiedAdmin, allowedRoles)) {
          setAccessState("forbidden");
          return;
        }

        setVerifiedAdmin(verifiedAdmin);
        setAccessState("authorized");
      } catch {
        await logout();
        if (isActive) setAccessState("unauthorized");
      }
    }

    checkAdminSession();

    return () => {
      isActive = false;
    };
  }, [allowedRoleKey, logout, setVerifiedAdmin, verifyAdmin]);

  if (accessState === "checking") {
    return <AdminRouteLoading />;
  }

  if (accessState === "forbidden") {
    return <AdminNotFound />;
  }

  if (accessState === "unauthorized") {
    return <AdminNotFound />;
  }

  return children;
}

export default AdminProtectedRoute;
