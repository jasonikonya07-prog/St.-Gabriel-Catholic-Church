import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FaChurch, FaEnvelope, FaEye, FaEyeSlash, FaLock, FaPhoneAlt, FaShieldAlt, FaUserAlt, FaUserPlus } from "react-icons/fa";
import { Link, Navigate, useNavigate } from "react-router-dom";
import FormAlert from "../components/FormAlert";
import PremiumButton from "../components/PremiumButton";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useUserAuth } from "../context/UserAuthContext";
import { getPublicSettings } from "../services/settingsService";
import { fadeUp, gentleEase, scaleIn, staggerContainer } from "../utils/animations";

function AuthField({ autoComplete, icon: Icon, label, name, onChange, type = "text", value, withToggle = false }) {
  const [isVisible, setIsVisible] = useState(false);
  const inputType = withToggle ? (isVisible ? "text" : "password") : type;

  return (
    <label className="grid gap-2 text-sm font-bold text-navy">
      <span>{label}</span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
        <input
          autoComplete={autoComplete}
          className={`min-h-[54px] w-full rounded-lg border border-navy/10 bg-white px-4 py-3 pl-11 text-base sm:text-sm ${
            withToggle ? "pr-12" : ""
          } font-semibold text-ink outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15`}
          name={name}
          onChange={onChange}
          required={name !== "phone"}
          type={inputType}
          value={value}
        />
        {withToggle ? (
          <button
            aria-label={isVisible ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-navy/55 transition hover:bg-gold/15 hover:text-navy"
            onClick={() => setIsVisible((current) => !current)}
            type="button"
          >
            {isVisible ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
          </button>
        ) : null}
      </span>
    </label>
  );
}

function validateRegistration(form) {
  if (!form.fullName.trim()) return "Full name is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim().toLowerCase())) return "Please enter a valid email address.";
  if (form.password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) return "Password must include letters and numbers.";
  if (form.password !== form.confirmPassword) return "Passwords do not match.";
  return "";
}

function Register() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { settings } = useSiteSettings();
  const { isAuthenticated, register } = useUserAuth();
  const [authOptions, setAuthOptions] = useState({
    allowRegistration: settings.allowRegistration !== false,
  });
  const [form, setForm] = useState({
    confirmPassword: "",
    email: "",
    fullName: "",
    password: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let isMounted = true;

    getPublicSettings()
      .then((publicSettings) => {
        if (isMounted) {
          setAuthOptions({ allowRegistration: publicSettings.allowRegistration !== false });
        }
      })
      .catch(() => {
        if (isMounted) setAuthOptions({ allowRegistration: settings.allowRegistration !== false });
      });

    return () => {
      isMounted = false;
    };
  }, [settings.allowRegistration]);

  if (isAuthenticated) return <Navigate to="/profile" replace />;

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setStatus(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!authOptions.allowRegistration) {
      setStatus({ type: "error", message: "Account registration is temporarily disabled." });
      return;
    }

    const validationMessage = validateRegistration(form);
    if (validationMessage) {
      setStatus({ type: "error", message: validationMessage });
      return;
    }

    try {
      setIsSubmitting(true);
      await register({
        email: form.email.trim().toLowerCase(),
        fullName: form.fullName.trim(),
        password: form.password,
        phone: form.phone.trim(),
      });
      navigate("/profile", { replace: true });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "We could not create your account." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="catholic-pattern catholic-pattern-dark church-light-rays church-light-rays-animated relative min-h-[calc(100vh-5rem)] overflow-hidden bg-navy px-4 py-10 text-white sm:px-6 lg:px-8">
      <motion.div
        className="relative z-10 mx-auto grid min-h-[calc(100vh-10rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]"
        initial={prefersReducedMotion ? false : "hidden"}
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div variants={fadeUp} custom={0.05} className="max-w-xl">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-lg border border-gold/35 bg-gold text-navy shadow-soft">
            <FaChurch className="h-6 w-6" />
          </div>
          <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.24em] text-gold">St. Gabriel Parish Account</p>
          <h1 className="mt-4 break-words font-display text-4xl font-bold leading-tight text-cream sm:text-5xl lg:text-6xl">Create Account</h1>
          <p className="mt-6 max-w-lg text-base font-semibold leading-8 text-cream/78">
            Create a secure parish profile with St. Gabriel Catholic Church.
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          variants={scaleIn}
          custom={0.16}
          transition={{ duration: prefersReducedMotion ? 0 : 0.55, ease: gentleEase }}
          className="rounded-lg border border-gold/25 bg-cream p-5 text-ink shadow-premium sm:p-8"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-navy text-gold">
              <FaShieldAlt className="h-5 w-5" />
            </span>
            <div>
              <p className="eyebrow">New account</p>
              <h2 className="font-display text-3xl font-bold leading-none text-navy">Register</h2>
            </div>
          </div>

          {!authOptions.allowRegistration ? (
            <div className="mt-7 rounded-lg border border-gold/30 bg-white p-5">
              <p className="font-display text-2xl font-bold text-navy">Registration is closed</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-warm">
                Account registration is temporarily disabled. Please check back later or contact the parish office.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <AuthField autoComplete="name" icon={FaUserAlt} label="Full Name" name="fullName" onChange={updateField} value={form.fullName} />
                </div>
                <AuthField autoComplete="email" icon={FaEnvelope} label="Email Address" name="email" onChange={updateField} type="email" value={form.email} />
                <AuthField autoComplete="tel" icon={FaPhoneAlt} label="Phone" name="phone" onChange={updateField} type="tel" value={form.phone} />
                <AuthField autoComplete="new-password" icon={FaLock} label="Password" name="password" onChange={updateField} value={form.password} withToggle />
                <AuthField
                  autoComplete="new-password"
                  icon={FaLock}
                  label="Confirm Password"
                  name="confirmPassword"
                  onChange={updateField}
                  value={form.confirmPassword}
                  withToggle
                />
              </div>
              <p className="mt-3 text-xs font-bold leading-5 text-warm">Use at least 8 characters with letters and numbers.</p>
            </>
          )}

          <FormAlert status={status} />

          <PremiumButton className="mt-6" disabled={!authOptions.allowRegistration} fullWidth icon={FaUserPlus} loading={isSubmitting} loadingLabel="Creating account..." type="submit">
            Register
          </PremiumButton>

          <p className="mt-6 text-center text-sm font-bold text-warm">
            Already have an account?{" "}
            <Link className="text-gold transition hover:text-navy" to="/login">
              Login
            </Link>
          </p>
        </motion.form>
      </motion.div>
    </section>
  );
}

export default Register;
