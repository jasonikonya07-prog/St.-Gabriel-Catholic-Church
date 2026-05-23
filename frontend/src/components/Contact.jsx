import { motion } from "framer-motion";
import { FaClock, FaEnvelope, FaMapMarkedAlt, FaMapMarkerAlt, FaPhoneAlt, FaUserAlt } from "react-icons/fa";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { sectionReveal, slideLeft, slideRight, viewportOnce } from "../utils/animations";
import ControlledButton from "./ControlledButton";
import FormAlert from "./FormAlert";
import PremiumField from "./PremiumField";
import { usePremiumForm } from "../hooks/usePremiumForm";
import { submitContactMessage } from "../services/contactService";

function Contact() {
  const { getButtonDisabledReason, isButtonEnabled, settings } = useSiteSettings();
  const contactEnabled = isButtonEnabled("contact_us");
  const contactDisabledReason = getButtonDisabledReason("contact_us");
  const contactItems = [
    { icon: FaMapMarkerAlt, label: "Address", value: settings.address },
    { icon: FaPhoneAlt, label: "Phone", value: settings.phone },
    { icon: FaEnvelope, label: "Email", value: settings.email },
    { icon: FaClock, label: "Office Hours", value: settings.officeHours },
  ].filter((item) => item.value);
  const { isSubmitting, status, submit } = usePremiumForm(
    "Thank you. Your message has been sent to the parish office.",
  );

  return (
    <motion.section
      id="contact"
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={sectionReveal}
      className="section-padding bg-cream"
    >
      <div className="section-shell">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={slideRight}
          >
            <p className="eyebrow">Visit St. Gabriel</p>
            <h2 className="section-title">Visit or Contact Us</h2>
            <div className="gold-rule" />
            <p className="section-copy">
              Whether you are returning to the Church, new to the area, or looking for a parish home, our doors are open.
            </p>

            <div className="mt-8 grid gap-4">
              {contactItems.map((item) => (
                <div key={item.label} className="flex gap-4 rounded-2xl border border-navy/10 bg-white p-4 shadow-soft sm:p-5">
                  <div className="grid h-11 w-11 flex-none place-items-center rounded-full bg-white text-gold shadow-soft">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-warm">{item.label}</p>
                    <p className="mt-1 break-words font-semibold leading-6 text-navy">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid min-h-[240px] place-items-center overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-soft">
              <div className="text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gold text-navy">
                  <FaMapMarkedAlt className="h-7 w-7" />
                </div>
                <p className="mt-5 font-display text-2xl font-bold text-navy">Google Map Placeholder</p>
                <p className="mt-2 text-sm font-semibold text-warm">{settings.churchName} location</p>
              </div>
            </div>
          </motion.div>

          <motion.form
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            custom={0.1}
            variants={slideLeft}
            onSubmit={(event) => (contactEnabled ? submit(event, ["fullName", "email", "message"], submitContactMessage) : event.preventDefault())}
            noValidate
            className="rounded-2xl border border-navy/10 bg-white p-5 shadow-premium sm:p-8"
          >
            <h3 className="break-words font-display text-3xl font-bold text-navy">Send Us a Message</h3>
            <p className="mt-3 text-sm leading-7 text-warm">
              Share your question, prayer request, or visit inquiry with the parish office.
            </p>

            <PremiumField className="mt-7" label="Full Name" name="fullName" icon={FaUserAlt} required />
            <PremiumField className="mt-5" label="Email Address" name="email" type="email" icon={FaEnvelope} required />
            <PremiumField className="mt-5" label="Phone Number" name="phone" type="tel" icon={FaPhoneAlt} />
            <PremiumField className="mt-5" label="Message" name="message" as="textarea" rows={6} required />

            <FormAlert status={status} />

            <ControlledButton
              buttonKey="contact_us"
              type="submit"
              variant="gold"
              fullWidth
              loading={isSubmitting}
              loadingLabel="Sending..."
              className="mt-6"
            >
              Send Message
            </ControlledButton>

            {!contactEnabled ? (
              <p className="mt-3 text-center text-xs font-bold leading-5 text-gold">
                {contactDisabledReason}
              </p>
            ) : null}
          </motion.form>
        </div>
      </div>
    </motion.section>
  );
}

export default Contact;
