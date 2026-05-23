import { AnimatePresence, motion } from "framer-motion";
import PremiumButton from "./PremiumButton";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { gentleEase } from "../utils/animations";

const fallbackReason = "This feature is temporarily unavailable.";

function ControlledButton({
  buttonKey,
  children,
  className = "",
  disabledClassName = "",
  onClick,
  showDisabledMessage = true,
  ...buttonProps
}) {
  const { getButtonControl } = useSiteSettings();
  const control = getButtonControl(buttonKey);
  const isEnabled = control.isEnabled !== false;
  const disabledReason = control.disabledReason || fallbackReason;

  const handleClick = (event) => {
    if (!isEnabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    onClick?.(event);
  };

  if (isEnabled) {
    return (
      <PremiumButton {...buttonProps} className={className} onClick={handleClick}>
        {children}
      </PremiumButton>
    );
  }

  return (
    <span className={`group relative inline-flex ${buttonProps.fullWidth ? "w-full" : "w-full sm:w-auto"}`}>
      <PremiumButton
        {...buttonProps}
        className={[className, disabledClassName].filter(Boolean).join(" ")}
        disabled
        onClick={handleClick}
        title={disabledReason}
      >
        {children}
      </PremiumButton>

      <AnimatePresence>
        {showDisabledMessage ? (
          <motion.span
            className="pointer-events-none absolute left-1/2 top-[calc(100%+0.55rem)] z-30 hidden w-max max-w-[min(18rem,78vw)] -translate-x-1/2 rounded-lg border border-gold/25 bg-navy px-3 py-2 text-center text-xs font-bold leading-5 text-cream shadow-premium group-hover:block group-focus-within:block"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: gentleEase }}
            role="tooltip"
          >
            {disabledReason || fallbackReason}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}

export default ControlledButton;
