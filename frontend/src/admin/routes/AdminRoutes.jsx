import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import ProtectedAdminRoute from "./ProtectedAdminRoute";
import AdminLogin from "../pages/AdminLogin";
import AdminProfile from "../pages/AdminProfile";
import AnnouncementsManager from "../pages/AnnouncementsManager";
import ContactMessagesPage from "../pages/ContactMessagesPage";
import DashboardOverview from "../pages/DashboardOverview";
import DonationsPage from "../pages/DonationsPage";
import EventsManager from "../pages/EventsManager";
import NewsletterPage from "../pages/NewsletterPage";
import PrayerRequestsPage from "../pages/PrayerRequestsPage";
import AuditLogs from "../pages/AuditLogs";
import SecurityEvents from "../pages/SecurityEvents";
import SecuritySettings from "../pages/SecuritySettings";
import UsersManager from "../pages/UsersManager";
import AdminNotFound from "../pages/AdminNotFound";
import { AdminAuthProvider } from "../context/AdminAuthContext";

const allAdminRoles = ["super_admin", "admin", "editor"];
const managerRoles = ["super_admin", "admin"];
const contentRoles = ["super_admin", "admin", "editor"];
const securityRoles = ["super_admin", "admin"];

function withRoles(page, allowedRoles) {
  return <ProtectedAdminRoute allowedRoles={allowedRoles}>{page}</ProtectedAdminRoute>;
}

function AdminRoutes() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route
          element={
            <ProtectedAdminRoute allowedRoles={allAdminRoles}>
              <AdminLayout />
            </ProtectedAdminRoute>
          }
        >
          <Route index element={<DashboardOverview />} />
          <Route path="dashboard" element={<DashboardOverview />} />
          <Route path="donations" element={withRoles(<DonationsPage />, managerRoles)} />
          <Route path="prayers" element={withRoles(<PrayerRequestsPage />, managerRoles)} />
          <Route path="prayer-requests" element={withRoles(<PrayerRequestsPage />, managerRoles)} />
          <Route path="contact" element={withRoles(<ContactMessagesPage />, managerRoles)} />
          <Route path="contact-messages" element={withRoles(<ContactMessagesPage />, managerRoles)} />
          <Route path="newsletter" element={withRoles(<NewsletterPage />, managerRoles)} />
          <Route path="users" element={withRoles(<UsersManager />, managerRoles)} />
          <Route path="events" element={withRoles(<EventsManager />, contentRoles)} />
          <Route path="announcements" element={withRoles(<AnnouncementsManager />, contentRoles)} />
          <Route path="security-settings" element={withRoles(<SecuritySettings />, securityRoles)} />
          <Route path="audit-logs" element={withRoles(<AuditLogs />, securityRoles)} />
          <Route path="security-events" element={withRoles(<SecurityEvents />, securityRoles)} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="settings" element={<Navigate to="/admin/profile" replace />} />
          <Route path="security" element={<Navigate to="/admin/security-settings" replace />} />
          <Route path="*" element={<AdminNotFound />} />
        </Route>
        <Route path="*" element={<AdminNotFound />} />
      </Routes>
    </AdminAuthProvider>
  );
}

export default AdminRoutes;
