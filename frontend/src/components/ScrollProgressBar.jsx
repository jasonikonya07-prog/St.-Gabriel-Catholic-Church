import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const prefersReducedMotion = useReducedMotion();
  const smoothScaleX = useSpring(scrollYProgress, {
    stiffness: prefersReducedMotion ? 1000 : 140,
    damping: prefersReducedMotion ? 100 : 28,
    mass: 0.35,
  });
  const scaleX = prefersReducedMotion ? scrollYProgress : smoothScaleX;

  return (
    <motion.div
      className="fixed left-0 top-0 z-[80] h-1 w-full origin-left bg-gold shadow-[0_0_14px_rgba(201,162,39,0.32)]"
      style={{ scaleX }}
      aria-hidden="true"
    />
  );
}

export default ScrollProgressBar;
