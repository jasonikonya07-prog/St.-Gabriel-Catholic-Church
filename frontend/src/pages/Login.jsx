import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FaChurch, FaEnvelope, FaEye, FaEyeSlash, FaLock, FaPrayingHands, FaSignInAlt } from "react-icons/fa";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import FormAlert from "../components/FormAlert";
import PremiumButton from "../components/PremiumButton";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useUserAuth } from "../context/UserAuthContext";
import { getPublicSettings } from "../services/settingsService";
import { fadeUp, gentleEase, scaleIn, staggerContainer } from "../utils/animations";

const rememberedEmailKey = "stGabrielUserRememberedEmail";

function readRememberedEmail() {
  try {
    return localStorage.getItem(rememberedEmailKey) || "";
  } catch {
    return "";
  }
}

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
          required
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

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const { settings } = useSiteSettings();
  const { isAuthenticated, login } = useUserAuth();
  const [authOptions, setAuthOptions] = useState({
    allowUserLogin: settings.allowUserLogin !== false,
  });
  const [form, setForm] = useState({
    email: readRememberedEmail(),
    password: "",
    remember: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const redirectPath = useMemo(() => {
    const from = location.state?.from?.pathname;
    return from && from !== "/login" ? from : "/profile";
  }, [location.state?.from?.pathname]);

  useEffect(() => {
    let isMounted = true;

    getPublicSettings()
      .then((publicSettings) => {
        if (isMounted) {
          setAuthOptions({ allowUserLogin: publicSettings.allowUserLogin !== false });
        }
      })
      .catch(() => {
        if (isMounted) setAuthOptions({ allowUserLogin: settings.allowUserLogin !== false });
      });

    return () => {
      isMounted = false;
    };
  }, [settings.allowUserLogin]);

  if (isAuthenticated) return <Navigate to={redirectPath} replace />;

  const updateField = (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [event.target.name]: value }));
    setStatus(null);
  };

  const handleForgotPassword = () => {
    setStatus({
      type: "success",
      message: "Password reset is not available online yet. Please contact the parish office for help.",
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!authOptions.allowUserLogin) {
      setStatus({ type: "error", message: "Website user login is temporarily disabled." });
      return;
    }

    try {
      setIsSubmitting(true);
      await login(form.email, form.password, { remember: form.remember });

      try {
        if (form.remember) localStorage.setItem(rememberedEmailKey, form.email.trim());
        else localStorage.removeItem(rememberedEmailKey);
      } catch {
        // Remembered email is a convenience only.
      }

      navigate(redirectPath, { replace: true });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "We could not sign you in." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="catholic-pattern catholic-pattern-dark church-light-rays church-light-rays-animated relative min-h-[calc(100vh-5rem)] overflow-hidden bg-navy px-4 py-10 text-white sm:px-6 lg:px-8">
      <motion.div
        className="relative z-10 mx-auto grid min-h-[calc(100vh-10rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]"
        initial={prefersReducedMotion ? false : "hidden"}
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div variants={fadeUp} custom={0.05} className="max-w-xl">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-lg border border-gold/35 bg-gold text-navy shadow-soft">
            <FaChurch className="h-6 w-6" />
          </div>
          <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.24em] text-gold">St. Gabriel Parish Account</p>
          <h1 className="mt-4 break-words font-display text-4xl font-bold leading-tight text-cream sm:text-5xl lg:text-6xl">Welcome Back</h1>
          <p className="mt-6 max-w-lg text-base font-semibold leading-8 text-cream/78">
            Sign in to your parish account for a quiet, secure connection to St. Gabriel Catholic Church.
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
              <FaPrayingHands className="h-5 w-5" />
            </span>
            <div>
              <p className="eyebrow">Secure login</p>
              <h2 className="font-display text-3xl font-bold leading-none text-navy">Parish Login</h2>
            </div>
          </div>

          {!authOptions.allowUserLogin ? (
            <div className="mt-7 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold leading-6 text-red-700">
              Website user login is temporarily disabled.
            </div>
          ) : null}

          <div className="mt-7 grid gap-5">
            <AuthField autoComplete="email" icon={FaEnvelope} label="Email Address" name="email" onChange={updateField} type="email" value={form.email} />
            <AuthField autoComplete="current-password" icon={FaLock} label="Password" name="password" onChange={updateField} value={form.password} withToggle />
          </div>

          <div className="mt-5 flex flex-col gap-3 text-sm font-bold text-navy sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex min-h-11 items-center gap-3">
              <input
                checked={form.remember}
                className="h-5 w-5 rounded border-navy/20 text-gold focus:ring-gold/30"
                name="remember"
                onChange={updateField}
                type="checkbox"
              />
              Remember me
            </label>
            <button className="inline-flex min-h-11 items-center text-left text-gold transition hover:text-navy" onClick={handleForgotPassword} type="button">
              Forgot password?
            </button>
          </div>

          <FormAlert status={status} />

          <PremiumButton className="mt-6" disabled={!authOptions.allowUserLogin} fullWidth icon={FaSignInAlt} loading={isSubmitting} loadingLabel="Signing in..." type="submit">
            Login
          </PremiumButton>

          <p className="mt-6 text-center text-sm font-bold text-warm">
            New to the parish website?{" "}
            <Link className="text-gold transition hover:text-navy" to="/register">
              Create account
            </Link>
          </p>
        </motion.form>
      </motion.div>
    </section>
  );
}

export default Login;
