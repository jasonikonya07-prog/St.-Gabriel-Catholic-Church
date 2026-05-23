import { motion } from "framer-motion";
import { FaEnvelope, FaUserTie } from "react-icons/fa";
import { cardHover, cardReveal, fadeUp, sectionReveal, viewportOnce } from "../utils/animations";
import PremiumButton from "./PremiumButton";

const leaders = [
  {
    name: "Fr. Michael Santos",
    role: "Parish Priest",
    bio: "Shepherding the parish through the sacraments, preaching, pastoral care, and spiritual leadership.",
  },
  {
    name: "Fr. Anthony Okello",
    role: "Assistant Priest",
    bio: "Supporting parish worship, formation, youth ministry, and the daily pastoral needs of the faithful.",
  },
  {
    name: "Sr. Grace Mwangi",
    role: "Catechist",
    bio: "Guiding children, families, and adults in Catholic teaching, Scripture, and sacramental preparation.",
  },
  {
    name: "Peter Kamau",
    role: "Parish Council Chairperson",
    bio: "Helping coordinate parish priorities, leadership planning, stewardship, and community collaboration.",
  },
  {
    name: "Mary Wanjiku",
    role: "Choir Leader",
    bio: "Leading sacred music with reverence, excellence, and prayerful service at parish liturgies.",
  },
  {
    name: "Daniel Otieno",
    role: "Youth Leader",
    bio: "Walking with young people through fellowship, discipleship, service, and joyful parish engagement.",
  },
];

function Leadership() {
  return (
    <motion.section
      id="leadership"
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={sectionReveal}
      className="section-padding bg-white"
    >
      <div className="section-shell">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="eyebrow">Parish leadership</p>
          <h2 className="section-title">Meet Our Parish Leaders</h2>
          <div className="gold-rule mx-auto" />
          <p className="section-copy mx-auto">
            Dedicated leaders serving St. Gabriel Catholic Church through prayer, care, formation, and faithful ministry.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {leaders.map((leader, index) => (
            <motion.article
              key={leader.role}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              custom={index}
              variants={cardReveal}
              whileHover={cardHover.hover}
              className="premium-hover-card group flex min-h-[330px] flex-col rounded-2xl border border-navy/10 bg-white p-5 text-center shadow-soft transition duration-300 hover:-translate-y-2 hover:border-gold hover:shadow-premium sm:p-6"
            >
              <div className="premium-hover-icon mx-auto grid h-28 w-28 place-items-center rounded-full border-4 border-cream bg-navy text-gold shadow-soft transition duration-300 group-hover:border-gold/50">
                <FaUserTie className="h-10 w-10" />
              </div>

              <span className="premium-hover-icon mx-auto mt-6 inline-flex rounded-full bg-gold px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-navy">
                {leader.role}
              </span>

              <h3 className="mt-5 break-words font-display text-2xl font-bold leading-tight text-navy sm:text-[1.85rem]">{leader.name}</h3>
              <p className="mt-3 text-sm leading-7 text-warm">{leader.bio}</p>

              <PremiumButton
                to="/contact"
                variant="light"
                icon={FaEnvelope}
                className="mt-auto self-center px-6"
              >
                Contact
              </PremiumButton>
            </motion.article>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

export default Leadership;
