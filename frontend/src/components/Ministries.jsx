import { motion } from "framer-motion";
import { cardHover, cardReveal, fadeUp, sectionReveal, viewportOnce } from "../utils/animations";
import {
  FaArrowRight,
  FaChild,
  FaClock,
  FaEnvelopeOpenText,
  FaFemale,
  FaHandHoldingHeart,
  FaMale,
  FaMusic,
  FaPaperPlane,
  FaPrayingHands,
  FaUserAlt,
} from "react-icons/fa";
import FormAlert from "./FormAlert";
import PremiumButton from "./PremiumButton";
import PremiumField from "./PremiumField";
import { usePremiumForm } from "../hooks/usePremiumForm";

const ministries = [
  {
    icon: FaChild,
    title: "Youth Ministry",
    text: "Guiding young people into friendship with Christ through prayer, formation, retreats, and service.",
  },
  {
    icon: FaMusic,
    title: "Choir Ministry",
    text: "Serving the liturgy with reverent music that lifts hearts toward prayer and worship.",
  },
  {
    icon: FaPrayingHands,
    title: "Altar Servers",
    text: "Helping at the altar with discipline, devotion, and respect for the sacred liturgy.",
  },
  {
    icon: FaFemale,
    title: "Catholic Women Association",
    text: "Women of faith growing in fellowship, charity, leadership, and service to the parish.",
  },
  {
    icon: FaMale,
    title: "Catholic Men Association",
    text: "Men united in prayer, family leadership, discipleship, and generous parish service.",
  },
  {
    icon: FaHandHoldingHeart,
    title: "Charity & Outreach",
    text: "Serving neighbors in need through mercy, practical support, and compassionate presence.",
  },
];

function Ministries() {
  const { isSubmitting, status, submit } = usePremiumForm(
    "Thank you for offering your gifts. Our parish ministry coordinator will contact you soon.",
  );
  const ministryOptions = ministries.map((ministry) => ministry.title);

  return (
    <motion.section
      id="ministries"
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={sectionReveal}
      className="catholic-pattern catholic-pattern-dark section-padding bg-navy text-white"
    >
      <div className="section-shell relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="eyebrow">Parish ministries</p>
          <h2 className="mt-3 break-words font-display text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl">
            Serve, belong, and grow in faith.
          </h2>
          <p className="mt-5 text-base leading-8 text-white/72 sm:text-lg">
            St. Gabriel Church ministries offer prayerful ways to share your gifts and strengthen parish life.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {ministries.map((ministry, index) => (
            <motion.article
              key={ministry.title}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              custom={index}
              variants={cardReveal}
              whileHover={cardHover.hover}
              className="premium-hover-card group flex min-h-[265px] flex-col rounded-2xl border border-transparent bg-white p-5 text-navy shadow-soft transition duration-300 hover:-translate-y-2 hover:border-gold hover:shadow-premium sm:p-7"
            >
              <div className="premium-hover-icon grid h-14 w-14 place-items-center rounded-full bg-gold text-navy shadow-[0_14px_30px_rgba(201,162,39,0.25)] transition group-hover:bg-navy group-hover:text-gold">
                <ministry.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-6 break-words font-display text-2xl font-bold leading-tight text-navy sm:text-[1.65rem]">{ministry.title}</h3>
              <p className="mt-3 text-sm leading-7 text-warm">{ministry.text}</p>
              <PremiumButton
                to="/contact"
                variant="light"
                icon={FaArrowRight}
                className="mt-auto"
              >
                Join Ministry
              </PremiumButton>
            </motion.article>
          ))}
        </div>

        <motion.form
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          custom={0.12}
          variants={fadeUp}
          onSubmit={(event) => submit(event, ["fullName", "contact", "ministry", "availability"])}
          noValidate
          className="mt-12 rounded-2xl border border-white/12 bg-white p-5 text-navy shadow-premium sm:p-8 lg:p-10"
        >
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="eyebrow">Volunteer form</p>
              <h3 className="mt-3 break-words font-display text-3xl font-bold leading-tight text-navy md:text-4xl">
                Offer your gifts in service.
              </h3>
              <p className="mt-5 text-sm leading-7 text-warm">
                Tell us where you feel called to serve. A parish leader will help you take the next step with care.
              </p>
            </div>

            <div>
              <div className="grid gap-5 sm:grid-cols-2">
                <PremiumField label="Full Name" name="fullName" icon={FaUserAlt} required />
                <PremiumField label="Phone / Email" name="contact" icon={FaEnvelopeOpenText} required />
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <PremiumField
                  label="Preferred Ministry"
                  name="ministry"
                  as="select"
                  options={ministryOptions}
                  required
                />
                <PremiumField label="Availability" name="availability" icon={FaClock} required />
              </div>

              <PremiumField
                className="mt-5"
                label="Message"
                name="message"
                as="textarea"
                rows={4}
                placeholder="Share any experience, questions, or preferred way to serve."
              />

              <FormAlert status={status} />

              <PremiumButton
                type="submit"
                variant="gold"
                icon={FaPaperPlane}
                loading={isSubmitting}
                loadingLabel="Submitting..."
                className="mt-6"
              >
                Submit Volunteer Form
              </PremiumButton>
            </div>
          </div>
        </motion.form>
      </div>
    </motion.section>
  );
}

export default Ministries;
