import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FaExpandAlt, FaTimes } from "react-icons/fa";
import { cardHover, fadeUp, gentleEase, scaleIn, sectionReveal, viewportOnce } from "../utils/animations";

const images = [
  {
    category: "Church Building",
    src: "https://images.unsplash.com/photo-1636562705007-67a52b138df8?auto=format&fit=crop&w=900&q=82",
    alt: "Catholic church building interior with pews and stained glass",
    className: "md:col-span-2 md:row-span-2",
  },
  {
    category: "Mass Celebration",
    src: "https://images.unsplash.com/photo-1747554451688-3a1e32e0fcfb?auto=format&fit=crop&w=900&q=82",
    alt: "Ornate altar prepared for a Catholic Mass celebration",
    className: "",
  },
  {
    category: "Choir Ministry",
    src: "https://images.unsplash.com/photo-1683150806331-b40198e8945d?auto=format&fit=crop&w=900&q=82",
    alt: "Candlelit church scene representing choir ministry worship",
    className: "",
  },
  {
    category: "Youth Event",
    src: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=82",
    alt: "Young people gathered together for a parish youth event",
    className: "md:col-span-2",
  },
  {
    category: "Charity Work",
    src: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=900&q=82",
    alt: "Volunteers sharing food and charity support",
    className: "",
  },
  {
    category: "Parish Community",
    src: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=900&q=82",
    alt: "Parish community gathered together in fellowship",
    className: "md:col-span-2",
  },
];

function Gallery() {
  const [selectedImage, setSelectedImage] = useState(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!selectedImage) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedImage(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedImage]);

  const lightbox = (
    <AnimatePresence>
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: gentleEase }}
          className="fixed inset-0 z-[90] grid place-items-center bg-navy/92 px-4 py-8"
          onClick={() => setSelectedImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedImage.category} photo preview`}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.36, ease: gentleEase }}
            className="relative w-full max-w-6xl overflow-hidden rounded-2xl border border-gold/30 bg-white shadow-[0_34px_110px_rgba(0,0,0,0.42)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close gallery image"
              onClick={() => setSelectedImage(null)}
              className="absolute right-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-full border border-white/30 bg-navy/90 text-white shadow-soft transition duration-300 hover:border-gold hover:bg-gold hover:text-navy focus:outline-none focus:ring-4 focus:ring-gold/25"
            >
              <FaTimes className="h-4 w-4" />
            </button>

            <div className="relative bg-navy">
              <img
                src={selectedImage.src.replace("w=900", "w=1600").replace("q=82", "q=80")}
                alt={selectedImage.alt}
                decoding="async"
                className="max-h-[72vh] w-full object-contain sm:max-h-[78vh]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/88 via-navy/42 to-transparent px-5 pb-5 pt-20 sm:px-8 sm:pb-8">
                <span className="inline-flex rounded-full bg-gold px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-navy shadow-[0_14px_30px_rgba(201,162,39,0.3)]">
                  {selectedImage.category}
                </span>
                <p className="mt-4 max-w-2xl break-words font-display text-2xl font-bold leading-tight text-white sm:text-4xl">
                  St. Gabriel Church
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <motion.section
        id="gallery"
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={sectionReveal}
        className="section-padding bg-cream"
      >
        <div className="section-shell">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={fadeUp}
            className="mx-auto max-w-3xl text-center"
          >
            <p className="eyebrow">Parish gallery</p>
            <h2 className="section-title">Parish Life Gallery</h2>
            <p className="section-copy mx-auto">
              A glimpse of worship, service, formation, and community life at St. Gabriel Church.
            </p>
          </motion.div>

          <div className="mt-10 grid auto-rows-[220px] gap-4 sm:auto-rows-[280px] md:grid-cols-4 lg:auto-rows-[260px]">
            {images.map((image, index) => (
              <motion.button
                key={image.category}
                type="button"
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
                custom={index * 0.06}
                variants={scaleIn}
                whileHover={prefersReducedMotion ? undefined : cardHover.hover}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                onClick={() => setSelectedImage(image)}
                aria-label={`Open ${image.category} gallery image`}
                className={`premium-hover-card group relative overflow-hidden rounded-2xl border border-white/40 bg-navy text-left shadow-soft ring-1 ring-navy/10 transition duration-500 hover:border-gold/80 hover:shadow-[0_28px_90px_rgba(7,26,45,0.18),0_0_0_1px_rgba(201,162,39,0.22)] focus:outline-none focus:ring-4 focus:ring-gold/25 ${image.className}`}
              >
                <img
                  src={image.src}
                  srcSet={`${image.src.replace("w=900", "w=480").replace("q=82", "q=76")} 480w, ${image.src.replace("w=900", "w=720").replace("q=82", "q=78")} 720w, ${image.src} 900w`}
                  sizes={image.className.includes("md:col-span-2") ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 100vw"}
                  alt={image.alt}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
                />

                <span className="absolute inset-0 bg-gradient-to-t from-navy/88 via-navy/18 to-transparent opacity-70 transition duration-500 group-hover:opacity-100" />
                <span className="absolute inset-0 bg-navy/0 transition duration-500 group-hover:bg-navy/32" />
                <span className="absolute inset-0 opacity-0 ring-1 ring-inset ring-gold/0 transition duration-500 group-hover:opacity-100 group-hover:ring-gold/60" />

                <span className="absolute right-5 top-5 grid h-11 w-11 translate-y-2 place-items-center rounded-full border border-white/25 bg-navy/60 text-white opacity-0 shadow-soft transition duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-hover:border-gold group-hover:bg-gold group-hover:text-navy">
                  <FaExpandAlt className="h-4 w-4" />
                </span>

                <span className="absolute bottom-5 left-5 right-5 block translate-y-4 opacity-90 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  <span className="premium-hover-icon inline-flex rounded-full bg-gold px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-navy shadow-[0_14px_28px_rgba(201,162,39,0.25)]">
                    {image.category}
                  </span>
                  <span className="mt-4 hidden max-w-sm text-sm font-semibold leading-6 text-white/78 opacity-0 transition duration-500 group-hover:opacity-100 sm:block">
                    View parish moment
                  </span>
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.section>

      {typeof document !== "undefined" ? createPortal(lightbox, document.body) : null}
    </>
  );
}

export default Gallery;
