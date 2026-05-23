import {
  FaChurch,
  FaClock,
  FaEnvelope,
  FaFacebookF,
  FaInstagram,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaPaperPlane,
  FaTiktok,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useUserAuth } from "../context/UserAuthContext";
import ControlledButton from "./ControlledButton";
import FormAlert from "./FormAlert";
import { fadeUp, viewportOnce } from "../utils/animations";
import { usePremiumForm } from "../hooks/usePremiumForm";
import { subscribeToNewsletter } from "../services/newsletterService";
import { getBrandParts, getSocialHref } from "../utils/siteSettings";

const footerLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Mass Times", to: "/mass-times" },
  { label: "Ministries", to: "/ministries" },
  { label: "Events", to: "/events" },
  { label: "Announcements", to: "/news" },
  { label: "Sermons", to: "/sermons" },
  { label: "Prayer Request", to: "/prayer" },
  { label: "Gallery", to: "/gallery" },
  { label: "Donate", to: "/donate" },
];

const massTimes = [
  "Sunday: 7:00 AM, 9:00 AM, 11:00 AM",
  "Weekday: Monday - Friday, 6:30 AM",
  "Confession: Saturday, 4:00 PM - 5:00 PM",
];

function Footer() {
  const location = useLocation();
  const navigate = useNavigate();
  const { getButtonDisabledReason, isButtonEnabled, settings } = useSiteSettings();
  const { isAuthenticated } = useUserAuth();
  const brand = getBrandParts(settings.churchName);
  const newsletterEnabled = isButtonEnabled("newsletter_subscribe");
  const newsletterDisabledReason = getButtonDisabledReason("newsletter_subscribe");
  const socialLinks = [
    { icon: FaFacebookF, label: "Facebook", href: getSocialHref(settings.facebook, "facebook") },
    { icon: FaInstagram, label: "Instagram", href: getSocialHref(settings.instagram, "instagram") },
    { icon: FaYoutube, label: "YouTube", href: getSocialHref(settings.youtube, "youtube") },
    { icon: FaTiktok, label: "TikTok", href: getSocialHref(settings.tiktok, "tiktok") },
    { icon: FaWhatsapp, label: "WhatsApp", href: getSocialHref(settings.whatsapp, "whatsapp") },
  ].filter((social) => social.href);
  const contactItems = [
    { icon: FaMapMarkerAlt, label: "Address", value: settings.address },
    { icon: FaPhoneAlt, label: "Phone", value: settings.phone },
    { icon: FaEnvelope, label: "Email", value: settings.email },
  ].filter((item) => item.value);
  const { isSubmitting, status, submit } = usePremiumForm(
    `You are subscribed to parish updates from ${settings.churchName}.`,
  );

  const handleNewsletterSubmit = (event) => {
    if (!newsletterEnabled) {
      event.preventDefault();
      return;
    }

    if (!isAuthenticated) {
      event.preventDefault();
      navigate("/login", { state: { from: location } });
      return;
    }

    submit(event, ["newsletterEmail"], (payload) =>
      subscribeToNewsletter({
        email: payload.newsletterEmail,
        source: "footer",
      }),
    );
  };

  return (
    <footer className="bg-navy text-white">
      <div className="h-1 bg-gold" />
      <div className="section-shell py-12 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.15fr_0.7fr_1fr_1fr] xl:gap-12">
          <div>
            <Link to="/" className="flex min-w-0 items-center gap-3" aria-label={`${settings.churchName} home`}>
              <span className="grid h-14 w-14 place-items-center rounded-full bg-gold text-navy shadow-[0_16px_32px_rgba(201,162,39,0.18)]">
                <FaChurch className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-display text-2xl font-bold text-white sm:text-3xl">{brand.primary}</span>
                <span className="block truncate text-[10px] font-bold uppercase tracking-[0.16em] text-white/58 sm:text-xs sm:tracking-[0.22em]">{brand.secondary}</span>
              </span>
            </Link>
            <p className="mt-6 max-w-md text-sm leading-7 text-white/64">
              {settings.tagline}
            </p>
            {socialLinks.length ? (
              <div className="mt-6 flex flex-wrap gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                    className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white transition hover:border-gold hover:bg-gold hover:text-navy"
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <h3 className="font-display text-2xl font-bold text-white">Quick Links</h3>
            <div className="mt-3 h-px w-12 bg-gold" />
            <div className="mt-5 grid gap-3">
              {footerLinks.map((link) => (
                <Link key={link.to} to={link.to} className="text-sm font-semibold text-white/64 transition duration-300 hover:text-gold">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-display text-2xl font-bold text-white">Mass Times</h3>
            <div className="mt-3 h-px w-12 bg-gold" />
            <div className="mt-5 grid gap-4">
              {massTimes.map((time) => (
                <div key={time} className="flex gap-3 text-sm leading-6 text-white/64">
                  <FaClock className="mt-1 h-4 w-4 flex-none text-gold" />
                  <span>{time}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-display text-2xl font-bold text-white">Contact</h3>
            <div className="mt-3 h-px w-12 bg-gold" />
            <div className="mt-5 grid gap-4 text-sm text-white/64">
              {contactItems.map((item) => (
                <span key={item.label} className="inline-flex min-w-0 items-start gap-3">
                  <item.icon className="mt-0.5 h-4 w-4 flex-none text-gold" />
                  <span className="min-w-0 break-words">{item.value}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <motion.form
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
          onSubmit={handleNewsletterSubmit}
          noValidate
          className="mt-10 rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.14)] sm:p-6"
        >
          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-gold">Newsletter</p>
              <h3 className="mt-2 font-display text-2xl font-bold text-white">Receive Parish Updates</h3>
              <p className="mt-2 text-sm leading-6 text-white/58">
                Weekly Mass notes, parish news, and opportunities to serve.
              </p>
            </div>

            <div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <label className="group grid gap-2 text-sm font-bold text-white">
                  <span className="transition duration-300 group-focus-within:-translate-y-0.5 group-focus-within:text-gold">
                    Email Address <span className="text-gold">*</span>
                  </span>
                  <input
                    name="newsletterEmail"
                    type="email"
                    required
                    disabled={!newsletterEnabled}
                    className="min-h-[52px] rounded-full border border-white/12 bg-white/10 px-5 py-3 text-sm font-semibold text-white outline-none transition duration-300 placeholder:text-white/35 focus:border-gold focus:bg-white/14 focus:ring-4 focus:ring-gold/15"
                    placeholder={newsletterEnabled ? "you@example.com" : newsletterDisabledReason}
                  />
                </label>
                <ControlledButton
                  buttonKey="newsletter_subscribe"
                  type="submit"
                  icon={FaPaperPlane}
                  loading={isSubmitting}
                  loadingLabel="Joining..."
                  className="self-end"
                >
                  Subscribe
                </ControlledButton>
              </div>

              {!newsletterEnabled ? (
                <p className="mt-3 text-xs font-bold leading-5 text-gold/90">
                  {newsletterDisabledReason}
                </p>
              ) : null}

              <FormAlert status={status} tone="dark" />
            </div>
          </div>
        </motion.form>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-white/48 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 {settings.churchName}. All rights reserved.</p>
          <p className="text-gold/80">Faith. Worship. Service.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
