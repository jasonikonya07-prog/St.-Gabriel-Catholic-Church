import { useState } from "react";
import { motion } from "framer-motion";
import { FaArrowRight, FaChurch, FaHeart, FaShieldAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { fadeUp, sectionReveal, slideLeft, slideRight, viewportOnce } from "../utils/animations";
import { buildGivingReference, formatKenyanPhoneNumber, formatMoney, givingCategories } from "../utils/donation";
import ControlledButton from "./ControlledButton";
import FloatingParticles from "./FloatingParticles";
import FormAlert from "./FormAlert";
import PremiumField from "./PremiumField";

const initialForm = {
  amount: "",
  email: "",
  fullName: "",
  givingType: "Tithe",
  message: "",
  phone: "",
};

function GivingSummary({ formValues }) {
  const givingReference = buildGivingReference(formValues.givingType, formValues.fullName);

  return (
    <div className="rounded-2xl border border-gold/30 bg-gold/10 p-3.5 sm:p-4">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-gold">Offering summary</p>
      <div className="mt-3 grid gap-2.5 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="shrink-0 font-semibold text-white/58">Giving type</span>
          <span className="min-w-0 break-words text-right font-extrabold text-white">{formValues.givingType}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="shrink-0 font-semibold text-white/58">Amount</span>
          <span className="min-w-0 break-words text-right font-display text-xl font-bold text-white">{formatMoney(formValues.amount)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="shrink-0 font-semibold text-white/58">Reference</span>
          <span className="min-w-0 break-all text-right font-extrabold text-gold">{givingReference}</span>
        </div>
      </div>
    </div>
  );
}

function GivingCategorySelector({ onSelect, selectedValue }) {
  const selectedCategory = givingCategories.find((category) => category.title === selectedValue) || givingCategories[0];

  return (
    <div className="mt-4">
      <PremiumField
        label="Giving Category"
        name="givingType"
        as="select"
        options={givingCategories.map((category) => category.title)}
        value={selectedValue}
        onChange={(event) => onSelect(event.target.value)}
        inputClassName="!min-h-[46px] py-2.5"
        required
      />

      <motion.div
        key={selectedCategory.title}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="mt-2.5 rounded-xl border border-gold/25 bg-cream p-3"
      >
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-gold sm:text-xs">Selected purpose</p>
        <p className="mt-1 text-sm font-bold leading-5 text-navy">
          {selectedCategory.title}: <span className="font-semibold text-warm">{selectedCategory.description}</span>
        </p>
      </motion.div>
    </div>
  );
}

function Donate() {
  const navigate = useNavigate();
  const { getButtonDisabledReason, isButtonEnabled, settings } = useSiteSettings();
  const donateEnabled = isButtonEnabled("donate_now");
  const donateDisabledReason = getButtonDisabledReason("donate_now");
  const [formValues, setFormValues] = useState(initialForm);
  const [status, setStatus] = useState(null);
  const paymentItems = [
    { label: "M-Pesa Paybill", value: settings.mpesaPaybill },
    { label: "Till Number", value: settings.tillNumber },
    { label: "Bank", value: settings.bankName },
    { label: "Account Name", value: settings.accountName },
    { label: "Account Number", value: settings.accountNumber },
  ].filter((item) => item.value);

  if (!donateEnabled) {
    return (
      <section className="section-padding bg-navy text-white">
        <div className="section-shell">
          <div className="mx-auto max-w-2xl rounded-2xl border border-gold/30 bg-white/[0.08] p-8 text-center shadow-premium">
            <FaHeart className="mx-auto h-10 w-10 text-gold" />
            <h1 className="mt-5 font-display text-4xl font-bold">Online giving is temporarily unavailable</h1>
            <p className="mt-4 text-sm font-semibold leading-7 text-white/72">{donateDisabledReason}</p>
          </div>
        </div>
      </section>
    );
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormValues((current) => ({
      ...current,
      [name]: value,
    }));
    setStatus(null);
  };

  const handleCategorySelect = (givingType) => {
    setFormValues((current) => ({
      ...current,
      givingType,
    }));
    setStatus(null);
  };

  const validateDonationDetails = () => {
    if (!formValues.givingType) {
      setStatus({ type: "error", message: "Please select a donation category." });
      return null;
    }

    if (Number(formValues.amount) <= 0) {
      setStatus({ type: "error", message: "Please enter an amount greater than 0." });
      document.querySelector('[name="amount"]')?.focus();
      return null;
    }

    if (!formValues.fullName.trim()) {
      setStatus({ type: "error", message: "Please enter your full name." });
      document.querySelector('[name="fullName"]')?.focus();
      return null;
    }

    const formattedPhone = formatKenyanPhoneNumber(formValues.phone);

    if (!formattedPhone) {
      setStatus({
        type: "error",
        message: "Please enter a valid Kenyan phone number, for example 07XXXXXXXX or +2547XXXXXXXX.",
      });
      document.querySelector('[name="phone"]')?.focus();
      return null;
    }

    return {
      amount: Number(formValues.amount),
      donorName: formValues.fullName.trim(),
      email: formValues.email.trim(),
      message: formValues.message.trim(),
      phone: formattedPhone,
      purpose: formValues.givingType,
      reference: buildGivingReference(formValues.givingType, formValues.fullName),
    };
  };

  const handleContinueToPayment = (event) => {
    event.preventDefault();

    const donation = validateDonationDetails();

    if (!donation) return;

    sessionStorage.setItem("stGabrielDonation", JSON.stringify(donation));
    navigate("/donate/payment", { state: { donation } });
  };

  return (
    <motion.section
      id="donate"
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={sectionReveal}
      className="church-light-rays relative isolate overflow-hidden bg-navy py-8 text-white sm:py-12 lg:py-16"
    >
      <FloatingParticles count={8} seed={29} className="z-0 opacity-35" />
      <div className="section-shell relative z-10">
        <div className="grid gap-4 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <motion.aside
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={slideRight}
          className="premium-hover-card order-2 rounded-2xl border border-white/12 bg-white/[0.08] p-4 shadow-premium sm:p-5 lg:order-1"
          >
            <div className="premium-hover-icon grid h-10 w-10 place-items-center rounded-full bg-gold text-navy">
              <FaChurch className="h-5 w-5" />
            </div>
            <h3 className="mt-4 break-words font-display text-2xl font-bold leading-tight text-white">Give with confidence.</h3>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Your offering supports worship, sacraments, parish programs, charity outreach, and daily pastoral care.
            </p>

            {paymentItems.length ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-gold">Parish payment details</p>
                <div className="mt-3 grid gap-2 text-sm">
                  {paymentItems.map((item) => (
                    <div key={item.label} className="flex justify-between gap-3">
                      <span className="shrink-0 font-semibold text-white/58">{item.label}</span>
                      <span className="min-w-0 break-words text-right font-extrabold text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-4">
              <GivingSummary formValues={formValues} />
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-gold/30 bg-gold/10 p-3">
              <FaShieldAlt className="h-4 w-4 flex-none text-gold" />
              <p className="text-xs font-semibold leading-5 text-white/78 sm:text-sm">
                Donor details are reviewed before payment and used only for parish giving records.
              </p>
            </div>
          </motion.aside>

          <motion.form
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            custom={0.08}
            variants={slideLeft}
            onSubmit={handleContinueToPayment}
            noValidate
            className="order-1 rounded-2xl border border-white/12 bg-white p-4 text-navy shadow-premium sm:p-5 lg:order-2"
          >
            <div className="mb-4 rounded-2xl border border-gold/30 bg-gold/10 p-3.5">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-gold sm:text-xs sm:tracking-[0.18em]">
                Online giving form
              </p>
              <h3 className="mt-1.5 break-words font-display text-2xl font-bold leading-tight text-navy">Enter your offering details</h3>
              <p className="mt-1.5 text-sm font-semibold leading-5 text-warm">
                Select your giving type, enter your details, then continue to payment.
              </p>
            </div>

            <GivingCategorySelector selectedValue={formValues.givingType} onSelect={handleCategorySelect} />

            <div className="mt-4">
              <PremiumField
                label="Amount"
                name="amount"
                type="number"
                min="1"
                inputMode="decimal"
                placeholder="0.00"
                value={formValues.amount}
                onChange={handleInputChange}
                inputClassName="!min-h-[46px] py-2.5"
                required
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <PremiumField
                label="Full Name"
                name="fullName"
                value={formValues.fullName}
                onChange={handleInputChange}
                inputClassName="!min-h-[46px] py-2.5"
                required
              />
              <PremiumField
                label="Phone Number"
                name="phone"
                type="tel"
                inputMode="tel"
                placeholder="07XX XXX XXX"
                value={formValues.phone}
                onChange={handleInputChange}
                inputClassName="!min-h-[46px] py-2.5"
                required
              />
            </div>

            <PremiumField
              className="mt-4"
              label="Email Address"
              name="email"
              type="email"
              placeholder="Optional"
              value={formValues.email}
              onChange={handleInputChange}
              inputClassName="!min-h-[46px] py-2.5"
            />

            <PremiumField
              className="mt-4"
              label="Message / Intention"
              name="message"
              as="textarea"
              rows={3}
              placeholder="Optional prayer intention or note"
              value={formValues.message}
              onChange={handleInputChange}
              inputClassName="!min-h-[96px] py-2.5 leading-6"
            />

            <FormAlert status={status} />

            <ControlledButton
              buttonKey="donate_now"
              type="submit"
              variant="gold"
              fullWidth
              icon={FaArrowRight}
              className="mt-4 min-h-[46px] px-5 py-3 text-xs tracking-[0.1em] sm:px-7 sm:text-sm sm:tracking-[0.12em]"
            >
              Continue to Payment
            </ControlledButton>
          </motion.form>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
          className="mx-auto mt-5 flex max-w-4xl items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-center text-sm font-semibold leading-6 text-white/70 sm:mt-6 sm:px-5"
        >
          <FaHeart className="h-4 w-4 flex-none text-gold" />
          Thank you for supporting {settings.churchName} with faith, generosity, and love.
        </motion.div>
      </div>
    </motion.section>
  );
}

export default Donate;
