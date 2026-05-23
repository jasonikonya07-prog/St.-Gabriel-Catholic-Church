import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  FaBars,
  FaBullhorn,
  FaCalendarAlt,
  FaEnvelope,
  FaCross,
  FaHandHoldingHeart,
  FaHome,
  FaInfoCircle,
  FaPrayingHands,
  FaSignInAlt,
  FaTimes,
  FaUserCircle,
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useUserAuth } from "../context/UserAuthContext";
import ControlledButton from "./ControlledButton";
import PremiumButton from "./PremiumButton";
import { gentleEase } from "../utils/animations";
import { getBrandParts } from "../utils/siteSettings";

const navItems = [
  { label: "Home", to: "/", sectionId: "home", icon: FaHome },
  { label: "About", to: "/about", sectionId: "about", icon: FaInfoCircle },
  { label: "Events", to: "/events", sectionId: "events", icon: FaCalendarAlt },
  { label: "News", to: "/news", sectionId: "announcements", icon: FaBullhorn },
  { label: "Prayer", to: "/prayer", sectionId: "prayer-request", icon: FaPrayingHands },
  { label: "Contact", to: "/contact", sectionId: "contact", icon: FaEnvelope },
];

const drawerVariants = {
  closed: { x: "100%" },
  open: { x: 0 },
};

const overlayVariants = {
  closed: { opacity: 0 },
  open: { opacity: 1 },
};

function DesktopNavLink({ isActive, item, onClick }) {
  return (
    <Link
      to={item.to}
      aria-current={isActive ? "page" : undefined}
      onClick={() => onClick(item)}
      className={`group relative whitespace-nowrap py-2 text-[11px] font-bold transition duration-300 xl:text-[13px] 2xl:text-sm ${
        isActive ? "text-gold" : "text-navy/76 hover:text-gold"
      }`}
    >
      <span className="relative z-10">{item.label}</span>
      <span className="absolute -bottom-1 left-0 h-px w-full overflow-hidden">
        <motion.span
          initial={false}
          animate={{ scaleX: isActive ? 1 : 0 }}
          transition={{ duration: 0.34, ease: gentleEase }}
          className="absolute inset-0 origin-left bg-gold"
        />
        <span className="absolute inset-0 origin-left scale-x-0 bg-gold/80 transition-transform duration-300 ease-out group-hover:scale-x-100" />
      </span>
    </Link>
  );
}

function MobileDrawer({ accountItem, activePath, brand, currentPath, isOpen, onClose, onNavigate, settings }) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[80] lg:hidden"
          initial="closed"
          animate="open"
          exit="closed"
          variants={overlayVariants}
          transition={{ duration: 0.22, ease: gentleEase }}
        >
          <button
            type="button"
            aria-label="Close mobile menu"
            className="absolute inset-0 bg-navy/72 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.aside
            id="mobile-navigation-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
            className="absolute inset-y-0 right-0 flex w-[min(23rem,92vw)] flex-col overflow-hidden bg-navy text-white shadow-[-24px_0_80px_rgba(0,0,0,0.32)]"
            variants={drawerVariants}
            transition={{ duration: 0.36, ease: gentleEase }}
          >
            <div className="border-b border-white/10 p-4">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                <Link
                  to="/"
                  onClick={() => onNavigate(navItems[0])}
                  className="flex min-w-0 flex-1 items-center gap-3"
                  aria-label={`${settings.churchName} home`}
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold text-navy shadow-[0_0_32px_rgba(201,162,39,0.22)]">
                    <FaCross className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate font-display text-2xl font-bold leading-none text-white">{brand.primary}</span>
                    <span className="mt-1 block truncate text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/55">
                      {brand.secondary}
                    </span>
                  </span>
                </Link>

                <button
                  type="button"
                  aria-label="Close mobile menu"
                  onClick={onClose}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.08] text-gold transition hover:bg-gold hover:text-navy focus:outline-none focus:ring-4 focus:ring-gold/25"
                >
                  <FaTimes className="h-4 w-4" />
                </button>
              </div>
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-5" aria-label="Mobile navigation">
              <div className="grid gap-2">
                {[...navItems, accountItem].map((item) => {
                  const Icon = item.icon;
                  const isActive = activePath === item.to || currentPath === item.to;

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => onNavigate(item)}
                      className={`group flex min-h-[60px] items-center gap-4 rounded-2xl px-4 text-base font-extrabold transition duration-300 focus:outline-none focus:ring-4 focus:ring-gold/20 ${
                        isActive ? "bg-gold text-navy shadow-[0_16px_38px_rgba(201,162,39,0.24)]" : "text-white/78 hover:bg-white/[0.08] hover:text-gold"
                      }`}
                    >
                      <span
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition ${
                          isActive ? "bg-navy/10" : "bg-white/[0.08] group-hover:bg-gold/15"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="border-t border-white/10 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <ControlledButton
                buttonKey="donate_now"
                to="/donate"
                icon={FaHandHoldingHeart}
                reveal={false}
                fullWidth
                onClick={() => onNavigate({ to: "/donate" })}
                className="button-glow min-h-[58px] rounded-2xl px-5 py-4 text-sm tracking-[0.16em]"
                disabledClassName="bg-gold/35 text-white/50"
              >
                Donate Now
              </ControlledButton>
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Navbar() {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const { settings } = useSiteSettings();
  const { isAuthenticated } = useUserAuth();
  const brand = getBrandParts(settings.churchName);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [activePath, setActivePath] = useState(location.pathname);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const accountItem = {
    icon: isAuthenticated ? FaUserCircle : FaSignInAlt,
    label: isAuthenticated ? "Profile" : "Login",
    to: isAuthenticated ? "/profile" : "/login",
  };

  const handleNavigationClick = (item) => {
    setActivePath(item.to);
    setIsMobileMenuOpen(false);

    if (location.pathname === item.to) {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
      });
    }
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    const handleScroll = () => {
      const nextHasScrolled = window.scrollY > 12;
      setHasScrolled((current) => (current === nextHasScrolled ? current : nextHasScrolled));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

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
      if (event.key === "Escape") closeMobileMenu();
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
  }, [isMobileMenuOpen]);

  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname]);

  useEffect(() => {
    const knownPath = navItems.some((item) => item.to === location.pathname);
    setActivePath(knownPath ? location.pathname : "");

    let observer;
    const frameId = window.requestAnimationFrame(() => {
      const visibleSections = navItems
        .map((item) => ({ ...item, element: document.getElementById(item.sectionId) }))
        .filter((item) => item.element);

      if (visibleSections.length === 0) return;

      observer = new IntersectionObserver(
        (entries) => {
          const mostVisible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

          if (!mostVisible) return;

          const activeItem = visibleSections.find((item) => item.element === mostVisible.target);
          if (activeItem) {
            setActivePath(activeItem.to);
          }
        },
        {
          root: null,
          rootMargin: "-34% 0px -52% 0px",
          threshold: [0.08, 0.2, 0.38, 0.55],
        },
      );

      visibleSections.forEach((item) => observer.observe(item.element));
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      observer?.disconnect();
    };
  }, [location.pathname]);

  return (
    <motion.header
      initial={false}
      animate={{
        backgroundColor: hasScrolled ? "rgba(255, 255, 255, 0.98)" : "rgba(248, 243, 231, 0.9)",
        boxShadow: hasScrolled ? "0 22px 60px rgba(7, 26, 45, 0.14)" : "0 0 0 rgba(7, 26, 45, 0)",
        borderColor: hasScrolled ? "rgba(7, 26, 45, 0.12)" : "rgba(201, 162, 39, 0.18)",
      }}
      transition={{ duration: 0.34, ease: gentleEase }}
      className="sticky inset-x-0 top-0 z-50 border-b"
    >
      <motion.div
        initial={false}
        animate={{ backgroundColor: hasScrolled ? "#071A2D" : "#C9A227" }}
        transition={{ duration: 0.34, ease: gentleEase }}
        className="h-1"
      />

      <nav className="section-shell flex min-h-[64px] items-center justify-between gap-3 sm:min-h-[74px] lg:min-h-20 lg:gap-4">
        <Link
          to="/"
          className="group flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3 lg:flex-none"
          aria-label={`${settings.churchName} home`}
          onClick={() => handleNavigationClick(navItems[0])}
        >
          <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-navy text-gold shadow-soft ring-1 ring-gold/25 transition duration-500 group-hover:bg-gold group-hover:text-navy group-hover:shadow-[0_0_34px_rgba(201,162,39,0.38)] group-hover:ring-gold/55 sm:h-12 sm:w-12">
            <FaCross className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block max-w-[11rem] truncate font-display text-[1.08rem] font-bold text-navy min-[375px]:max-w-[13rem] sm:max-w-none sm:text-[1.7rem]">
              {brand.primary}
            </span>
            <span className="block max-w-[11rem] truncate text-[8px] font-bold uppercase tracking-[0.14em] text-warm min-[375px]:max-w-[13rem] sm:max-w-none sm:text-[11px] sm:tracking-[0.2em]">
              {brand.secondary}
            </span>
          </span>
        </Link>

        <div className="hidden flex-1 items-center justify-end gap-2 lg:flex xl:gap-3 2xl:gap-5">
          {navItems.map((item) => (
            <DesktopNavLink
              key={item.to}
              item={item}
              isActive={activePath === item.to}
              onClick={handleNavigationClick}
            />
          ))}
        </div>

        <div className="flex flex-none items-center gap-2">
          <PremiumButton
            to={accountItem.to}
            variant="light"
            icon={accountItem.icon}
            reveal={false}
            className="hidden min-h-11 px-4 py-3 text-[11px] tracking-[0.12em] lg:inline-flex"
          >
            {accountItem.label}
          </PremiumButton>

          <ControlledButton
            buttonKey="donate_now"
            to="/donate"
            icon={FaHandHoldingHeart}
            reveal={false}
            className="button-glow hidden min-h-11 px-5 py-3 text-[11px] tracking-[0.14em] lg:inline-flex xl:px-6"
            disabledClassName="bg-gold/35 text-navy/50"
          >
            Donate
          </ControlledButton>

          <button
            type="button"
            aria-label="Open mobile menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
            onClick={() => setIsMobileMenuOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-full border border-navy/12 bg-white text-navy shadow-soft transition hover:border-gold hover:bg-gold focus:outline-none focus:ring-4 focus:ring-gold/20 lg:hidden"
          >
            <FaBars className="h-4 w-4" />
          </button>
        </div>
      </nav>

      <MobileDrawer
        accountItem={accountItem}
        activePath={activePath || location.pathname}
        brand={brand}
        currentPath={location.pathname}
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        onNavigate={handleNavigationClick}
        settings={settings}
      />
    </motion.header>
  );
}

export default Navbar;
