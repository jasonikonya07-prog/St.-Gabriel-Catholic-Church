import { motion } from "framer-motion";
import { FaEnvelopeOpenText, FaHandsHelping, FaLock, FaPaperPlane, FaPrayingHands, FaUserAlt } from "react-icons/fa";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { sectionReveal, slideLeft, slideRight, viewportOnce } from "../utils/animations";
import ControlledButton from "./ControlledButton";
import FormAlert from "./FormAlert";
import PremiumField from "./PremiumField";
import { usePremiumForm } from "../hooks/usePremiumForm";
import { submitPrayerRequest } from "../services/prayerService";

const categories = ["Healing", "Family", "Thanksgiving", "Guidance", "Loss", "Private Request"];

function PrayerRequest() {
  const { getButtonDisabledReason, isButtonEnabled } = useSiteSettings();
  const prayerEnabled = isButtonEnabled("prayer_request");
  const prayerDisabledReason = getButtonDisabledReason("prayer_request");
  const { isSubmitting, status, submit } = usePremiumForm(
    "Your prayer request has been received. Our parish prayer team will remember your intention.",
  );

  return (
    <motion.section
      id="prayer-request"
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={sectionReveal}
      className="section-padding bg-cream"
    >
      <div className="section-shell">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={slideRight}
          >
            <p className="eyebrow">Prayer intentions</p>
            <h2 className="section-title">Request Prayer From Our Parish</h2>
            <div className="gold-rule" />
            <p className="section-copy">Our parish prayer team will remember your intention in prayer.</p>

            <div className="mt-8 rounded-2xl border border-navy/10 bg-white p-5 shadow-soft sm:p-6">
              <div className="flex gap-4">
                <div className="grid h-12 w-12 flex-none place-items-center rounded-full bg-gold text-navy">
                  <FaPrayingHands className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="break-words font-display text-2xl font-bold text-navy">A quiet place for your intention.</h3>
                  <p className="mt-2 text-sm leading-7 text-warm">
                    Share only what you are comfortable sharing. Private requests are treated with care and respect.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.form
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            custom={0.08}
            variants={slideLeft}
            onSubmit={(event) =>
              prayerEnabled
                ? submit(event, ["fullName", "contact", "category", "message"], (payload) =>
                    submitPrayerRequest({
                      ...payload,
                      isPrivate: payload.isPrivate === "true",
                    }),
                  )
                : event.preventDefault()
            }
            noValidate
            className="rounded-2xl border border-navy/10 bg-white p-5 shadow-premium sm:p-8"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <PremiumField label="Full Name" name="fullName" icon={FaUserAlt} required />
              <PremiumField label="Phone / Email" name="contact" icon={FaEnvelopeOpenText} required />
            </div>

            <PremiumField
              className="mt-5"
              label="Prayer Category"
              name="category"
              as="select"
              options={categories}
              required
            />

            <PremiumField className="mt-5" label="Prayer Message" name="message" as="textarea" rows={6} required />

            <label className="mt-5 flex min-h-12 items-start gap-3 rounded-2xl border border-navy/10 bg-cream p-4 text-sm font-semibold leading-6 text-navy">
              <input
                type="checkbox"
                name="isPrivate"
                value="true"
                defaultChecked
                className="mt-1 h-5 w-5 rounded border-navy/20 text-gold accent-gold focus:ring-gold"
              />
              <span className="flex gap-3">
                <FaLock className="mt-0.5 h-4 w-4 flex-none text-gold" />
                Keep my request private
              </span>
            </label>

            <FormAlert status={status} />

            <ControlledButton
              buttonKey="prayer_request"
              type="submit"
              variant="gold"
              fullWidth
              icon={FaPaperPlane}
              loading={isSubmitting}
              loadingLabel="Submitting..."
              className="mt-6"
            >
              Submit Prayer Request
            </ControlledButton>

            {!prayerEnabled ? (
              <p className="mt-3 text-center text-xs font-bold leading-5 text-gold">
                {prayerDisabledReason}
              </p>
            ) : null}

            <p className="mt-5 flex items-center justify-center gap-2 text-center text-sm font-semibold text-warm">
              <FaHandsHelping className="h-4 w-4 text-gold" />
              Offered with compassion and confidentiality.
            </p>
          </motion.form>
        </div>
      </div>
    </motion.section>
  );
}

export default PrayerRequest;
