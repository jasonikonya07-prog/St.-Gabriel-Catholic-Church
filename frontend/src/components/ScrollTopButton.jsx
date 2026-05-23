import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FaChevronUp } from "react-icons/fa";
import { gentleEase } from "../utils/animations";

function ScrollTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      const shouldShow = window.scrollY > 460;
      setIsVisible((current) => (current === shouldShow ? current : shouldShow));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.button
          type="button"
          aria-label="Scroll to top"
          initial={{ opacity: 0, y: 18, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.92 }}
          whileHover={prefersReducedMotion ? undefined : { y: -4 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.28, ease: gentleEase }}
          onClick={handleClick}
          className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-5 z-[70] grid h-12 w-12 place-items-center rounded-full border border-gold/35 bg-navy text-gold shadow-[0_14px_34px_rgba(7,26,45,0.2)] transition duration-300 hover:border-gold hover:bg-gold hover:text-navy focus:outline-none focus:ring-4 focus:ring-gold/25 lg:bottom-7 lg:right-7"
        >
          <FaChevronUp className="h-4 w-4" />
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}

export default ScrollTopButton;
