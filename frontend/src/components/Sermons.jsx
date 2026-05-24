import { motion } from "framer-motion";
import { FaCalendarAlt, FaPlay, FaUserAlt, FaVideo } from "react-icons/fa";
import { cardHover, cardReveal, fadeUp, sectionReveal, viewportOnce } from "../utils/animations";
import FloatingParticles from "./FloatingParticles";
import PremiumButton from "./PremiumButton";

const liveMassUrl = "https://www.youtube.com/results?search_query=St+Gabriel+Church+live+Mass";

const sermons = [
  {
    title: "Walking in Faith",
    priest: "Fr. Michael",
    type: "Sunday Homily",
    date: "May 19, 2026",
    videoUrl: "https://www.youtube.com/results?search_query=Catholic+Sunday+homily",
  },
  {
    title: "The Power of Prayer",
    priest: "Fr. Anthony",
    type: "Weekday Reflection",
    date: "May 15, 2026",
    videoUrl: "https://www.youtube.com/results?search_query=Catholic+prayer+reflection",
  },
  {
    title: "Serving with Love",
    priest: "Fr. Peter",
    type: "Parish Teaching",
    date: "May 10, 2026",
    videoUrl: "https://www.youtube.com/results?search_query=Catholic+parish+teaching+service",
  },
];

function Sermons() {
  return (
    <motion.section
      id="sermons"
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={sectionReveal}
      className="church-light-rays section-padding relative isolate overflow-hidden bg-navy text-white"
    >
      <FloatingParticles count={8} seed={47} className="z-0 opacity-28" />
      <div className="section-shell relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="eyebrow">Sermons and homilies</p>
          <h2 className="mt-3 break-words font-display text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl">Latest Homilies</h2>
          <div className="mx-auto mt-6 h-px w-20 bg-gold" />
          <p className="mt-5 text-base leading-8 text-white/72 sm:text-lg">
            Listen to recent Catholic reflections from our priests and continue praying with the Word throughout the week.
          </p>
          <PremiumButton
            href={liveMassUrl}
            target="_blank"
            variant="outline"
            icon={FaPlay}
            className="mx-auto mt-8"
          >
            Watch Live Mass
          </PremiumButton>
        </motion.div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {sermons.map((sermon, index) => (
            <motion.article
              key={sermon.title}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              custom={index}
              variants={cardReveal}
              whileHover={cardHover.hover}
              className="premium-hover-card group overflow-hidden rounded-2xl border border-white/10 bg-white text-navy shadow-soft transition duration-300 hover:-translate-y-2 hover:border-gold hover:shadow-premium"
            >
              <div className="relative grid aspect-video place-items-center overflow-hidden bg-navy text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,162,39,0.24),transparent_46%)]" />
                <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(135deg,rgba(255,255,255,0.24)_1px,transparent_1px)] [background-size:18px_18px]" />
                <div className="relative text-center">
                  <div className="premium-hover-icon mx-auto grid h-16 w-16 place-items-center rounded-full border border-gold/30 bg-white/10 text-gold">
                    <FaVideo className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.24em] text-white/60">Video Homily</p>
                </div>
                <a
                  href={sermon.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="premium-hover-icon absolute bottom-5 left-5 grid h-14 w-14 place-items-center rounded-full bg-gold text-navy shadow-[0_16px_36px_rgba(201,162,39,0.35)] transition duration-300 group-hover:scale-110 group-hover:bg-white sm:bottom-6 sm:left-6"
                  aria-label={`Watch ${sermon.title}`}
                >
                  <FaPlay className="ml-1 h-5 w-5" />
                </a>
              </div>

              <div className="p-6">
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-gold">{sermon.type}</p>
                <h3 className="mt-4 break-words font-display text-2xl font-bold leading-tight text-navy sm:text-3xl">{sermon.title}</h3>

                <div className="mt-6 grid gap-3 text-sm font-semibold text-warm">
                  <span className="inline-flex items-center gap-3">
                    <FaUserAlt className="h-3.5 w-3.5 text-gold" />
                    {sermon.priest}
                  </span>
                  <span className="inline-flex items-center gap-3">
                    <FaCalendarAlt className="h-3.5 w-3.5 text-gold" />
                    {sermon.date}
                  </span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

export default Sermons;
