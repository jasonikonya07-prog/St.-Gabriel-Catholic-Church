import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

const overlayVariants = {
  closed: { opacity: 0 },
  open: { opacity: 1 },
};

const drawerVariants = {
  closed: { x: "-100%" },
  open: { x: 0 },
};

function AdminLayout() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    closeSidebar();
  }, [location.pathname]);

  useEffect(() => {
    if (!isSidebarOpen) return undefined;

    const scrollY = window.scrollY;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyPosition = document.body.style.position;
    const previousBodyTop = document.body.style.top;
    const previousBodyWidth = document.body.style.width;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.documentElement.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeSidebar();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.position = previousBodyPosition;
      document.body.style.top = previousBodyTop;
      document.body.style.width = previousBodyWidth;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.scrollTo({ top: scrollY, behavior: "auto" });
    };
  }, [isSidebarOpen]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-cream text-ink">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-72">
        <AdminSidebar />
      </div>

      <AnimatePresence>
        {isSidebarOpen ? (
          <motion.div
            className="fixed inset-0 z-50 overflow-hidden lg:hidden"
            initial="closed"
            animate="open"
            exit="closed"
            variants={overlayVariants}
            transition={{ duration: 0.24 }}
          >
            <button
              type="button"
              aria-label="Close admin navigation"
              className="absolute inset-0 bg-navy/58 backdrop-blur-sm"
              onClick={closeSidebar}
            />
            <motion.div
              className="absolute inset-y-0 left-0 w-[min(22rem,92vw)] max-w-full"
              role="dialog"
              aria-modal="true"
              aria-label="Admin navigation menu"
              variants={drawerVariants}
              transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            >
              <AdminSidebar isMobile onNavigate={closeSidebar} />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="min-w-0 overflow-x-hidden lg:pl-72">
        <AdminTopbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="min-h-[calc(100vh-4.75rem)] min-w-0 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[92rem] min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
