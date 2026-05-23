import { motion, useReducedMotion } from "framer-motion";
import { FaCircleNotch } from "react-icons/fa";
import { Link } from "react-router-dom";
import { buttonReveal, viewportOnce } from "../utils/animations";

const MotionLink = motion(Link);
const MotionAnchor = motion.a;

const variants = {
  gold: {
    base: "bg-gold text-navy focus:ring-gold/30",
    active: "hover:bg-white",
    disabled: "bg-gold/70 text-navy/55",
  },
  navy: {
    base: "bg-navy text-white focus:ring-gold/30",
    active: "hover:bg-gold hover:text-navy",
    disabled: "bg-navy/65 text-white/55",
  },
  outline: {
    base: "border border-white/55 text-white focus:ring-white/20",
    active: "hover:border-gold hover:bg-gold hover:text-navy",
    disabled: "border-white/20 bg-white/5 text-white/45",
  },
  light: {
    base: "border border-navy/12 bg-white text-navy focus:ring-gold/25",
    active: "hover:border-gold hover:bg-gold",
    disabled: "border-navy/10 bg-cream text-navy/45",
  },
};

function PremiumButton({
  children,
  className = "",
  disabled = false,
  fullWidth = false,
  href,
  icon: Icon,
  loading = false,
  loadingLabel = "Please wait...",
  onClick,
  reveal = true,
  rel,
  target,
  title,
  to,
  type = "button",
  variant = "gold",
}) {
  const prefersReducedMotion = useReducedMotion();
  const isDisabled = disabled || loading;
  const selectedVariant = variants[variant] || variants.gold;
  const classes = [
    "premium-action-button shine-button inline-flex min-h-[52px] w-full max-w-full transform-gpu items-center justify-center gap-3 rounded-full px-5 py-4 text-center text-xs font-extrabold uppercase leading-5 tracking-[0.1em] shadow-soft transition duration-300 will-change-transform focus:outline-none focus:ring-4 sm:w-auto sm:px-7 sm:text-sm sm:tracking-[0.12em]",
    selectedVariant.base,
    isDisabled ? selectedVariant.disabled : selectedVariant.active,
    fullWidth ? "w-full sm:w-full" : "",
    isDisabled ? "cursor-not-allowed shadow-none grayscale" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {loading ? <FaCircleNotch className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      <span className="min-w-0">{loading ? loadingLabel : children}</span>
    </>
  );

  const motionProps = {
    initial: reveal && !prefersReducedMotion ? "hidden" : false,
    variants: buttonReveal,
    ...(reveal && !prefersReducedMotion ? { whileInView: "visible", viewport: viewportOnce } : {}),
    whileHover: isDisabled || prefersReducedMotion ? undefined : "hover",
    whileTap: isDisabled || prefersReducedMotion ? undefined : "tap",
  };

  if (to && !isDisabled) {
    return (
      <MotionLink to={to} onClick={onClick} className={classes} title={title} {...motionProps}>
        {content}
      </MotionLink>
    );
  }

  if (href && !isDisabled) {
    return (
      <MotionAnchor
        href={href}
        target={target}
        rel={rel || (target === "_blank" ? "noreferrer" : undefined)}
        onClick={onClick}
        className={classes}
        title={title}
        {...motionProps}
      >
        {content}
      </MotionAnchor>
    );
  }

  return (
    <motion.button
      type={type}
      disabled={isDisabled}
      aria-busy={loading}
      aria-disabled={isDisabled}
      onClick={onClick}
      className={classes}
      title={title}
      {...motionProps}
    >
      {content}
    </motion.button>
  );
}

export default PremiumButton;
