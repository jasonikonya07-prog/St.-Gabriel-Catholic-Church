import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Church, Clock, Mail, Phone } from "lucide-react";
import { fadeUp, gentleEase, scaleIn, staggerContainer } from "../utils/animations";

function formatExpectedBack(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}

function Maintenance({ settings = {} }) {
  const prefersReducedMotion = useReducedMotion();
  const expectedBack = formatExpectedBack(settings.maintenanceExpectedBack);
  const title = settings.maintenanceTitle || "Website Under Maintenance";
  const message = settings.maintenanceMessage || "We are currently improving our website. Please check back soon.";
  const churchName = settings.churchName || "St. Gabriel Catholic Church";
  const contactEmail = settings.email || "office@stgabrielparish.org";
  const contactPhone = settings.phone || "Parish office phone";
  const footerReturn = expectedBack ? `Estimated return: ${expectedBack}` : "Estimated return will be announced soon";

  useEffect(() => {
    const previousTitle = document.title;
    const metaDescription = document.querySelector('meta[name="description"]');
    const previousDescription = metaDescription?.getAttribute("content") || "";

    document.title = `${churchName} - Under Maintenance`;

    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Our website is temporarily paused while we make a few careful improvements. Peace be with you.",
      );
    }

    return () => {
      document.title = previousTitle;
      if (metaDescription) metaDescription.setAttribute("content", previousDescription);
    };
  }, [churchName]);

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#031525] px-4 py-10 font-sans text-[#F8F3E7] selection:bg-gold/30 sm:px-6 lg:px-12">
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-90"
        style={{
          background:
            "radial-gradient(circle at 18% 18%, rgba(201,162,39,0.22), transparent 24rem), radial-gradient(circle at 85% 18%, rgba(248,243,231,0.08), transparent 24rem), linear-gradient(135deg, rgba(3,21,37,0.98), rgba(7,26,45,0.96))",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, transparent 46%, rgba(201,162,39,0.7) 46% 54%, transparent 54%), linear-gradient(0deg, transparent 40%, rgba(248,243,231,0.34) 40% 60%, transparent 60%)",
          backgroundPosition: "24px 28px",
          backgroundSize: "96px 96px",
          maskImage: "radial-gradient(circle at center, black 0%, black 58%, transparent 86%)",
        }}
      />
      <motion.div
        className="relative z-10 grid w-full max-w-6xl min-w-0 items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,0.82fr)] lg:gap-20"
        initial={prefersReducedMotion ? false : "hidden"}
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div variants={fadeUp} custom={0.05} className="min-w-0 space-y-8 text-center lg:text-left">
          <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-3 rounded-full border border-gold/20 bg-gold/10 px-4 py-2 lg:justify-start">
            <span className="animate-maintenance-pulse-soft h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.75)]" />
            <span className="break-words text-[10px] font-extrabold uppercase tracking-[0.14em] text-gold sm:tracking-[0.2em]">Maintenance Mode Active</span>
          </div>

          <div className="space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold lg:mx-0">
              <Church className="h-7 w-7" strokeWidth={1.5} />
            </div>

            <div>
              <p className="break-words font-display text-xl italic text-gold">{churchName}</p>
              <h1 className="mt-4 font-display text-5xl font-bold leading-[0.95] text-white sm:text-6xl lg:text-7xl">
                Peace Be
                <br />
                With You
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-base font-semibold leading-8 text-cream/85 sm:text-lg lg:mx-0">
                {message || "We are currently refreshing our digital home to better serve our community."}
              </p>
            </div>
          </div>

          <div className="mx-auto max-w-xl space-y-3 pt-2 lg:mx-0">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-gold/85 sm:tracking-[0.18em]">Zinasonga</span>
              <span className="text-[10px] font-bold uppercase italic tracking-[0.08em] text-cream/70 sm:tracking-[0.12em]">Under Construction</span>
            </div>
            <div className="relative h-px w-full overflow-hidden bg-cream/25">
              <div className="animate-maintenance-slide-progress absolute left-0 top-0 h-full w-1/3 bg-gold/70 shadow-[0_0_18px_rgba(201,162,39,0.75)]" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={scaleIn}
          custom={0.14}
          transition={{ duration: prefersReducedMotion ? 0 : 0.55, ease: gentleEase }}
          className={prefersReducedMotion ? "relative min-w-0" : "animate-maintenance-float-card relative min-w-0"}
        >
          <div className="relative min-w-0 rounded-3xl border border-gold/25 bg-[#071A2D]/95 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.48)] backdrop-blur-xl sm:p-8 lg:p-10">
            <h2 className="break-words border-b border-white/10 pb-4 text-sm font-black uppercase tracking-[0.12em] text-gold sm:tracking-[0.18em]">
              {title}
            </h2>

            <div className="mt-8 space-y-7">
              <div className="flex items-start gap-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-gold/80">Email Enquiries</h3>
                  <p className="break-words font-display text-xl italic text-white">{contactEmail}</p>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-gold/80">Office Phone</h3>
                  <p className="break-words font-display text-xl italic text-white">{contactPhone}</p>
                </div>
              </div>

              {expectedBack ? (
                <div className="flex items-start gap-5 rounded-2xl border border-gold/15 bg-gold/10 p-4">
                  <Clock className="mt-1 h-4 w-4 shrink-0 text-gold" />
                  <div className="min-w-0">
                    <h3 className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-gold/80">Expected Back</h3>
                    <p className="break-words text-sm font-bold leading-6 text-cream">{expectedBack}</p>
                  </div>
                </div>
              ) : null}

            </div>
          </div>
        </motion.div>
      </motion.div>

      <footer className="relative z-10 mt-12 max-w-full break-words px-4 text-center text-[10px] font-bold uppercase leading-5 tracking-[0.14em] text-gold/75 sm:tracking-[0.26em]">
        Refining the sanctuary experience &bull; {footerReturn}
      </footer>
    </section>
  );
}

export default Maintenance;
