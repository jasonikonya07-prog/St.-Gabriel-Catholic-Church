import { lazy, Suspense } from "react";
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Footer from "./components/Footer";
import MaintenanceGuard from "./components/MaintenanceGuard";
import Navbar from "./components/Navbar";
import ScrollProgressBar from "./components/ScrollProgressBar";
import ScrollTopButton from "./components/ScrollTopButton";
import ScrollToTop from "./components/ScrollToTop";
import UserProtectedRoute from "./routes/UserProtectedRoute";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import DonatePage from "./pages/DonatePage";
import DonationPaymentPage from "./pages/DonationPaymentPage";
import EventsPage from "./pages/EventsPage";
import GalleryPage from "./pages/GalleryPage";
import HomePage from "./pages/HomePage";
import MassTimesPage from "./pages/MassTimesPage";
import MinistriesPage from "./pages/MinistriesPage";
import NewsPage from "./pages/NewsPage";
import PrayerPage from "./pages/PrayerPage";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import SermonsPage from "./pages/SermonsPage";
import { gentleEase } from "./utils/animations";

const AdminRoutes = lazy(() => import("./admin/AdminRoutes"));

function requireUser(page) {
  return <UserProtectedRoute>{page}</UserProtectedRoute>;
}

function App() {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const isAdminPath = location.pathname.startsWith("/admin");
  const routes = (
    <Routes location={location}>
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<div className="grid min-h-screen place-items-center bg-cream font-bold text-navy">Loading admin...</div>}>
            <AdminRoutes />
          </Suspense>
        }
      />
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/leadership" element={<Navigate to="/about" replace />} />
      <Route path="/mass-times" element={<MassTimesPage />} />
      <Route path="/ministries" element={<MinistriesPage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/news" element={<NewsPage />} />
      <Route path="/sermons" element={<SermonsPage />} />
      <Route path="/donate" element={requireUser(<DonatePage />)} />
      <Route path="/donate/payment" element={requireUser(<DonationPaymentPage />)} />
      <Route path="/prayer" element={requireUser(<PrayerPage />)} />
      <Route path="/stories" element={<Navigate to="/contact" replace />} />
      <Route path="/gallery" element={<GalleryPage />} />
      <Route path="/contact" element={requireUser(<ContactPage />)} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  return (
    <MotionConfig reducedMotion="user">
      <MaintenanceGuard>
        <div className="min-h-screen overflow-x-hidden bg-cream text-ink">
          {!isAdminPath ? <ScrollProgressBar /> : null}
          <ScrollToTop />
          {!isAdminPath ? <Navbar /> : null}
          {isAdminPath ? (
            <main>{routes}</main>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.main
                key={location.pathname}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.34, ease: gentleEase }}
              >
                {routes}
              </motion.main>
            </AnimatePresence>
          )}
          {!isAdminPath ? <Footer /> : null}
          {!isAdminPath ? <ScrollTopButton /> : null}
        </div>
      </MaintenanceGuard>
    </MotionConfig>
  );
}

export default App;
