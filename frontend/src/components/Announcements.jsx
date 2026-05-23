import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaArrowRight, FaBell, FaCalendarAlt } from "react-icons/fa";
import { cardHover, cardReveal, fadeUp, sectionReveal, viewportOnce } from "../utils/animations";
import PremiumButton from "./PremiumButton";
import { getPublishedAnnouncements } from "../services/announcementService";

function formatAnnouncementDate(value) {
  if (!value) return "Recently posted";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getPublishedAnnouncements({ limit: 4 })
      .then((response) => {
        const rows = response?.announcements || response?.data?.announcements || [];

        if (!isMounted) return;

        setAnnouncements(
          rows.map((announcement) => ({
            category: announcement.category,
            date: formatAnnouncementDate(announcement.publishedAt || announcement.createdAt),
            id: announcement.id,
            text: announcement.summary || announcement.content,
            title: announcement.title,
          })),
        );
        setError("");
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError?.message || "Announcements could not be loaded.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <motion.section
      id="announcements"
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={sectionReveal}
      className="catholic-pattern catholic-pattern-soft section-padding bg-white"
    >
      <div className="section-shell relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="eyebrow">Parish announcements</p>
          <h2 className="section-title">Latest Parish News</h2>
          <div className="gold-rule mx-auto" />
          <p className="section-copy mx-auto">
            Stay informed about worship updates, ministry gatherings, charity needs, and important parish notices.
          </p>
        </motion.div>

        {error ? (
          <p className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-sm font-extrabold text-red-800">
            {error}
          </p>
        ) : null}

        {!isLoading && !error && !announcements.length ? (
          <p className="mt-10 rounded-2xl border border-navy/10 bg-cream p-5 text-center text-sm font-extrabold text-warm shadow-soft">
            No published parish announcements yet.
          </p>
        ) : null}

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {announcements.map((announcement, index) => (
            <motion.article
              key={announcement.id || announcement.title}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              custom={index}
              variants={cardReveal}
              whileHover={cardHover.hover}
              className="premium-hover-card group flex min-h-[300px] flex-col rounded-2xl border border-navy/10 bg-cream p-5 shadow-soft transition duration-300 hover:-translate-y-2 hover:border-gold hover:bg-white hover:shadow-premium sm:p-6"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="premium-hover-icon inline-flex rounded-full bg-gold px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-navy">
                  {announcement.category}
                </span>
                <FaBell className="premium-hover-icon h-5 w-5 flex-none text-gold" />
              </div>

              <h3 className="mt-6 break-words font-display text-2xl font-bold leading-tight text-navy sm:text-[1.75rem]">
                {announcement.title}
              </h3>

              <p className="mt-4 text-sm leading-7 text-warm">{announcement.text}</p>

              <div className="mt-6 flex items-center gap-2 text-sm font-bold text-navy/70">
                <FaCalendarAlt className="h-3.5 w-3.5 text-gold" />
                {announcement.date}
              </div>

              <PremiumButton
                to="/contact"
                variant="light"
                icon={FaArrowRight}
                className="mt-auto"
              >
                Learn More
              </PremiumButton>
            </motion.article>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

export default Announcements;
