import { motion } from "framer-motion";
import { FaChurch, FaClock, FaCross, FaDove, FaPrayingHands } from "react-icons/fa";
import { cardHover, cardReveal, fadeUp, sectionReveal, viewportOnce } from "../utils/animations";

const schedules = [
  {
    icon: FaChurch,
    title: "Sunday Mass",
    details: ["7:00 AM", "9:00 AM", "11:00 AM"],
  },
  {
    icon: FaCross,
    title: "Weekday Mass",
    details: ["Monday - Friday", "6:30 AM"],
  },
  {
    icon: FaPrayingHands,
    title: "Confession",
    details: ["Saturday", "4:00 PM - 5:00 PM"],
  },
  {
    icon: FaDove,
    title: "Adoration",
    details: ["Friday", "5:00 PM - 6:00 PM"],
  },
];

function MassTimes() {
  return (
    <motion.section
      id="mass-times"
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={sectionReveal}
      className="catholic-pattern section-padding bg-cream"
    >
      <div className="section-shell relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="eyebrow">Mass and sacraments</p>
          <h2 className="section-title">A sacred rhythm for the week.</h2>
          <div className="gold-rule mx-auto" />
          <p className="section-copy mx-auto">
            Join us for the Eucharist, confession, and adoration in a peaceful parish setting.
          </p>
        </motion.div>

        <div className="mt-10 grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
          {schedules.map((schedule, index) => (
            <motion.article
              key={schedule.title}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              custom={index}
              variants={cardReveal}
              whileHover={cardHover.hover}
              className="premium-hover-card group flex h-full min-h-[250px] flex-col rounded-2xl border border-navy/10 border-t-4 border-t-gold bg-white p-5 shadow-soft transition duration-300 hover:-translate-y-2 hover:shadow-premium sm:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="premium-hover-icon grid h-12 w-12 place-items-center rounded-full bg-navy text-gold">
                  <schedule.icon className="h-5 w-5" />
                </div>
                <span className="h-px flex-1 translate-y-6 bg-gold/25 transition group-hover:bg-gold/60" />
              </div>

              <h3 className="mt-6 break-words font-display text-2xl font-bold leading-tight text-navy sm:text-3xl">{schedule.title}</h3>

              <ul className="mt-6 grid gap-4">
                {schedule.details.map((detail) => (
                  <li key={detail} className="flex items-center gap-3 rounded-lg bg-cream px-4 py-3 text-sm font-bold text-navy">
                    <FaClock className="h-4 w-4 flex-none text-gold" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-7">
                <div className="h-px w-full bg-navy/10" />
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.22em] text-warm">All are welcome</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

export default MassTimes;
