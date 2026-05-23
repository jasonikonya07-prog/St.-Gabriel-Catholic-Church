import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaArrowRight, FaClock, FaMapMarkerAlt } from "react-icons/fa";
import { cardHover, cardReveal, fadeUp, sectionReveal, viewportOnce } from "../utils/animations";
import PremiumButton from "./PremiumButton";
import { getPublishedEvents } from "../services/eventService";

function formatEventDate(value) {
  if (!value) return "Upcoming";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatEventTime(event) {
  if (event.startTime && event.endTime) return `${event.startTime} - ${event.endTime}`;
  return event.startTime || event.endTime || "Time to be announced";
}

function Events() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getPublishedEvents({ limit: 4 })
      .then((response) => {
        const rows = response?.events || response?.data?.events || [];

        if (!isMounted) return;

        setEvents(
          rows.map((event) => ({
            date: formatEventDate(event.eventDate || event.date),
            description: event.description,
            id: event.id,
            location: event.location,
            time: formatEventTime(event),
            title: event.title,
          })),
        );
        setError("");
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError?.message || "Events could not be loaded.");
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
      id="events"
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
          <p className="eyebrow">Upcoming parish events</p>
          <h2 className="section-title">Gather, serve, and grow together.</h2>
          <div className="gold-rule mx-auto" />
          <p className="section-copy mx-auto">
            Parish life at St. Gabriel offers regular opportunities for worship, formation, fellowship, and charity.
          </p>
        </motion.div>

        {error ? (
          <p className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-sm font-extrabold text-red-800">
            {error}
          </p>
        ) : null}

        {!isLoading && !error && !events.length ? (
          <p className="mt-10 rounded-2xl border border-navy/10 bg-white p-5 text-center text-sm font-extrabold text-warm shadow-soft">
            No published parish events yet.
          </p>
        ) : null}

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {events.map((event, index) => (
            <motion.article
              key={event.id || event.title}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              custom={index}
              variants={cardReveal}
              whileHover={cardHover.hover}
              className="premium-hover-card group flex min-h-[320px] flex-col rounded-2xl border border-navy/10 bg-white p-5 shadow-soft transition duration-300 hover:-translate-y-2 hover:border-gold hover:shadow-premium sm:p-6"
            >
              <div className="premium-hover-icon inline-flex min-h-12 w-fit items-center rounded-full bg-gold px-5 py-3 text-sm font-extrabold text-navy shadow-[0_14px_30px_rgba(201,162,39,0.22)]">
                {event.date}
              </div>

              <h3 className="mt-6 break-words font-display text-2xl font-bold leading-tight text-navy sm:text-3xl">{event.title}</h3>
              <p className="mt-4 text-sm leading-7 text-warm">{event.description}</p>

              <div className="mt-6 grid gap-3 text-sm font-bold text-navy">
                <span className="inline-flex min-w-0 items-center gap-3">
                  <FaClock className="h-4 w-4 text-gold" />
                  <span className="min-w-0 break-words">{event.time}</span>
                </span>
                <span className="inline-flex min-w-0 items-center gap-3">
                  <FaMapMarkerAlt className="h-4 w-4 text-gold" />
                  <span className="min-w-0 break-words">{event.location}</span>
                </span>
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

export default Events;
