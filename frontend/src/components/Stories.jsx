import { motion } from "framer-motion";
import { FaQuoteLeft, FaStar, FaUserCircle } from "react-icons/fa";
import { cardHover, cardReveal, fadeUp, sectionReveal, viewportOnce } from "../utils/animations";

const stories = [
  {
    name: "Agnes W.",
    message: "St. Gabriel Church has helped my family grow deeper in faith and community.",
  },
  {
    name: "Joseph K.",
    message: "The parish feels peaceful, welcoming, and rooted in prayer. We found a true spiritual home here.",
  },
  {
    name: "Catherine M.",
    message: "Through Mass, ministries, and charity work, I have experienced the love of Christ in a real way.",
  },
  {
    name: "Samuel O.",
    message: "The youth programs helped me serve with confidence and build friendships centered on faith.",
  },
];

function Stories() {
  return (
    <motion.section
      id="stories"
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
          <p className="eyebrow">Parishioner stories</p>
          <h2 className="section-title">Faith Shared by Our Parish Family</h2>
          <div className="gold-rule mx-auto" />
          <p className="section-copy mx-auto">
            Words of gratitude from parishioners who have found worship, friendship, and service at St. Gabriel.
          </p>
        </motion.div>

        <div className="mt-10 flex snap-x gap-4 overflow-x-auto pb-4 [scrollbar-width:none] sm:gap-5 [&::-webkit-scrollbar]:hidden">
          {stories.map((story, index) => (
            <motion.article
              key={story.name}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              custom={index}
              variants={cardReveal}
              whileHover={cardHover.hover}
              className="premium-hover-card group min-w-[min(18rem,82vw)] snap-start rounded-2xl border border-navy/10 bg-white p-5 shadow-soft transition duration-300 hover:-translate-y-2 hover:border-gold hover:shadow-premium sm:min-w-[360px] sm:p-6 lg:min-w-0 lg:flex-1"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="premium-hover-icon grid h-14 w-14 place-items-center rounded-full bg-cream text-gold ring-1 ring-navy/10">
                    <FaUserCircle className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-bold text-navy">{story.name}</h3>
                    <div className="mt-1 flex gap-1 text-gold">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar key={star} className="h-3.5 w-3.5" />
                      ))}
                    </div>
                  </div>
                </div>
                <FaQuoteLeft className="premium-hover-icon h-8 w-8 flex-none text-gold/45 transition group-hover:text-gold" />
              </div>

              <p className="mt-6 text-base leading-8 text-warm">{story.message}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

export default Stories;
