import { motion } from "framer-motion";
import { FaCross, FaEnvelope, FaHandHoldingHeart, FaPrayingHands } from "react-icons/fa";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useDecorativeMotion } from "../hooks/useDecorativeMotion";
import { fadeUp, staggerContainer } from "../utils/animations";
import ControlledButton from "./ControlledButton";
import FloatingParticles from "./FloatingParticles";

const heroImageBase = "https://images.unsplash.com/photo-1636562705007-67a52b138df8?auto=format&fit=crop";
const heroImage = `${heroImageBase}&w=1600&q=80`;
const heroImageSrcSet = [
  `${heroImageBase}&w=900&q=76 900w`,
  `${heroImageBase}&w=1400&q=80 1400w`,
  `${heroImageBase}&w=2000&q=82 2000w`,
].join(", ");
function Hero() {
  const allowDecorativeMotion = useDecorativeMotion();
  const { settings } = useSiteSettings();
  const heroBackgroundImage = settings.heroBackgroundImage || heroImage;
  const usesDefaultHeroImage = heroBackgroundImage === heroImage;

  return (
    <section
      id="home"
      className="church-light-rays church-light-rays-animated relative isolate flex min-h-[calc(100svh-65px)] items-center overflow-hidden bg-navy text-white sm:min-h-[calc(100svh-74px)] lg:min-h-[calc(100svh-80px)]"
    >
      <motion.img
        src={heroBackgroundImage}
        srcSet={usesDefaultHeroImage ? heroImageSrcSet : undefined}
        sizes="100vw"
        alt={`${settings.churchName} parish hero`}
        loading="eager"
        decoding="async"
        fetchpriority="high"
        initial={false}
        animate={allowDecorativeMotion ? { scale: 1.08, x: -14, y: -8 } : { scale: 1.04, x: 0, y: 0 }}
        transition={
          allowDecorativeMotion
            ? { duration: 34, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
            : { duration: 0 }
        }
        className="absolute inset-0 -z-30 h-full w-full object-cover object-[52%_center] sm:object-center"
      />
      <div className="absolute inset-0 -z-20 bg-navy/76" />
      <div className="absolute inset-0 -z-20 bg-gradient-to-r from-navy via-navy/76 to-navy/35" />
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-navy/45 via-transparent to-navy/92" />
      <div className="hero-gold-glow absolute left-1/2 top-1/2 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(201,162,39,0.22),transparent_68%)] lg:left-[62%]" />
      <FloatingParticles count={12} seed={11} className="-z-10 opacity-55" />
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 0.22, scale: 1 }}
        transition={{ duration: 2.2, ease: "easeOut" }}
        className="cross-glow pointer-events-none absolute right-8 top-28 -z-10 hidden text-gold/50 sm:block lg:right-20"
      >
        <FaCross className="h-28 w-28 lg:h-40 lg:w-40" />
      </motion.div>

      <div className="section-shell relative z-10 py-14 sm:py-20 lg:py-28">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mx-auto max-w-4xl text-center lg:mx-0 lg:text-left"
        >
          <motion.p
            variants={fadeUp}
            className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-gold sm:text-sm sm:tracking-[0.28em]"
          >
            Welcome to {settings.churchName}
          </motion.p>

          <motion.h1
            variants={fadeUp}
            className="mt-5 break-words font-display text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl xl:text-7xl"
          >
            {settings.heroTitle}
          </motion.h1>

          <motion.div
            variants={fadeUp}
            className="gold-line-pulse mx-auto mt-7 h-px w-28 bg-gold lg:mx-0"
          />

          <motion.p
            variants={fadeUp}
            className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/86 md:text-lg md:leading-8 lg:mx-0 lg:text-xl"
          >
            {settings.heroSubtitle}
          </motion.p>

          <motion.div variants={fadeUp} className="mx-auto mt-8 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center lg:mx-0 lg:justify-start">
            <ControlledButton buttonKey="view_mass_times" to="/mass-times">
              {settings.mainCtaText || "View Mass Times"}
            </ControlledButton>
            <ControlledButton buttonKey="donate_now" to="/donate" variant="light" icon={FaHandHoldingHeart}>
              {settings.secondaryCtaText || "Donate Now"}
            </ControlledButton>
          </motion.div>
          <motion.div variants={fadeUp} className="mx-auto mt-3 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center lg:mx-0 lg:justify-start">
            <ControlledButton buttonKey="contact_us" to="/contact" variant="outline" icon={FaEnvelope}>
              Contact Us
            </ControlledButton>
            <ControlledButton buttonKey="prayer_request" to="/prayer" variant="outline" icon={FaPrayingHands}>
              Prayer Request
            </ControlledButton>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
