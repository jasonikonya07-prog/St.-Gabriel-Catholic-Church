import { motion } from "framer-motion";
import { cardHover, cardReveal, sectionReveal, slideLeft, slideRight, viewportOnce } from "../utils/animations";
import { useCountUp } from "../hooks/useCountUp";

const aboutImageBase = "https://images.unsplash.com/photo-1747554451688-3a1e32e0fcfb?auto=format&fit=crop";
const aboutImage = `${aboutImageBase}&w=1200&q=80`;
const aboutImageSrcSet = [
  `${aboutImageBase}&w=640&q=76 640w`,
  `${aboutImageBase}&w=960&q=78 960w`,
  `${aboutImageBase}&w=1400&q=80 1400w`,
].join(", ");

const stats = [
  { value: "25+", label: "Years of Service", countTo: 25, suffix: "+" },
  { value: "1,000+", label: "Parish Members", countTo: 1000, suffix: "+" },
  { value: "12", label: "Active Ministries", countTo: 12 },
  { value: "Weekly", label: "Mass & Confession" },
];

function AnimatedStatValue({ stat }) {
  const { ref, value } = useCountUp({
    end: stat.countTo,
    duration: stat.countTo > 100 ? 1700 : 1300,
  });

  return (
    <span ref={ref} aria-label={stat.value} className="inline-block min-w-[3ch] tabular-nums">
      {Math.round(value).toLocaleString()}
      {stat.suffix || ""}
    </span>
  );
}

function StatValue({ stat }) {
  if (typeof stat.countTo === "number") {
    return <AnimatedStatValue stat={stat} />;
  }

  return <span>{stat.value}</span>;
}

function About() {
  return (
    <motion.section
      id="about"
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={sectionReveal}
      className="church-light-rays church-light-rays-subtle section-padding relative isolate overflow-hidden bg-white"
    >
      <div className="section-shell relative z-10 grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={slideRight}
          className="relative pb-8 lg:pb-0"
        >
          <div className="overflow-hidden rounded-2xl shadow-premium ring-1 ring-navy/10">
            <img
              src={aboutImage}
              srcSet={aboutImageSrcSet}
              sizes="(min-width: 1024px) 50vw, 100vw"
              alt="Premium Catholic church interior with golden altar details"
              loading="lazy"
              decoding="async"
              className="h-[320px] w-full object-cover sm:h-[520px]"
            />
          </div>
          <div className="absolute bottom-0 left-4 right-4 rounded-2xl border border-white/15 bg-navy/95 p-4 text-white shadow-premium sm:left-auto sm:right-8 sm:max-w-xs sm:p-5 lg:bottom-6">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-gold">St. Gabriel</p>
            <p className="mt-2 font-display text-xl font-bold leading-tight sm:text-2xl">A parish family rooted in Christ.</p>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={slideLeft}
        >
          <p className="eyebrow">Our parish</p>
          <h2 className="section-title">About Our Parish</h2>
          <div className="gold-rule" />
          <p className="section-copy">
            St. Gabriel Catholic Church is a welcoming Catholic community dedicated to worship, prayer, sacraments, charity, and service. We gather as one family of faith to grow closer to Christ and serve our community with love.
          </p>

          <div className="mt-9 grid gap-4 sm:grid-cols-2">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
                custom={index}
                variants={cardReveal}
                whileHover={cardHover.hover}
                className="rounded-2xl border border-navy/10 bg-cream p-5 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-gold/50 hover:bg-white sm:p-6"
              >
                <p className="break-words font-display text-3xl font-bold leading-none text-navy sm:text-[2.75rem]">
                  <StatValue stat={stat} />
                </p>
                <div className="mt-4 h-px w-12 bg-gold" />
                <p className="mt-4 text-sm font-extrabold uppercase tracking-[0.16em] text-warm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

export default About;
