import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FaChurch, FaEnvelope, FaExclamationCircle, FaEye, FaEyeSlash, FaLock, FaShieldAlt, FaSpinner } from "react-icons/fa";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { login as loginAdminRequest } from "../../services/adminAuthService";
import { fadeUp, gentleEase, scaleIn, staggerContainer } from "../../utils/animations";

const rememberedEmailKey = "stGabrielAdminRememberedEmail";

function readRememberedEmail() {
  try {
    return localStorage.getItem(rememberedEmailKey) || "";
  } catch {
    return "";
  }
}

function getLoginErrorMessage(error) {
  if (error?.status === 423) {
    return error?.message || "This admin account is locked. Please wait 15 minutes and try again.";
  }

  if (error?.status === 429) {
    return error?.message || "Too many login attempts. Please wait a moment and try again.";
  }

  if (error?.status === 401) {
    return "The email or password you entered is not correct.";
  }

  if (error?.status === 403) {
    return error?.message || "This admin account is not allowed to sign in.";
  }

  return error?.message || "We could not sign you in. Please check your connection and try again.";
}

function AdminField({ autoComplete, icon: Icon, label, name, onChange, placeholder, type = "text", value, withToggle = false, disabled = false }) {
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
          } font-semibold text-ink outline-none transition placeholder:text-warm/60 focus:border-gold focus:ring-4 focus:ring-gold/15 disabled:cursor-not-allowed disabled:bg-cream`}
          disabled={disabled}
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          required
          type={inputType}
          value={value}
        />
        {withToggle ? (
          <button
            aria-label={isVisible ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-navy/55 transition hover:bg-gold/15 hover:text-navy disabled:cursor-not-allowed disabled:opacity-55"
            disabled={disabled}
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

function AdminLogin() {
  const { isAuthenticated, login } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [values, setValues] = useState({
    email: "",
    password: "",
    remember: true,
  });
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectPath = useMemo(() => {
    const from = location.state?.from?.pathname;
    return from && from !== "/admin/login" ? from : "/admin/dashboard";
  }, [location.state?.from?.pathname]);

  useEffect(() => {
    const rememberedEmail = readRememberedEmail();

    if (rememberedEmail) {
      setValues((current) => ({ ...current, email: rememberedEmail, remember: true }));
    }
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const updateValue = (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setValues((current) => ({ ...current, [event.target.name]: value }));
    setStatus(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!values.email.trim() || !values.password) {
      setStatus({ type: "error", message: "Please enter your admin email and password." });
      return;
    }

    try {
      setIsSubmitting(true);
      const session = await loginAdminRequest(values.email.trim(), values.password);

      try {
        if (values.remember) localStorage.setItem(rememberedEmailKey, values.email.trim());
        else localStorage.removeItem(rememberedEmailKey);
      } catch {
        // Remembered email is only a convenience.
      }

      login({ admin: session.admin, email: values.email.trim(), token: session.token });
      navigate(redirectPath, { replace: true });
    } catch (error) {
      setStatus({ type: "error", message: getLoginErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="catholic-pattern catholic-pattern-dark relative min-h-screen overflow-hidden bg-navy px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(7,26,45,0.98),rgba(5,18,31,0.96)_48%,rgba(8,31,54,0.98))]" />
      <motion.div
        className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]"
        initial={prefersReducedMotion ? false : "hidden"}
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div variants={fadeUp} custom={0.05} className="max-w-xl">
          <div className="inline-flex items-center gap-3 rounded-lg border border-gold/35 bg-white/8 px-4 py-3 text-xs font-extrabold uppercase tracking-[0.22em] text-gold shadow-2xl shadow-black/10 backdrop-blur">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-gold text-navy">
              <FaChurch className="h-4 w-4" />
            </span>
            St. Gabriel Church Admin
          </div>
          <h1 className="mt-7 break-words font-display text-4xl font-bold leading-tight text-cream sm:text-5xl lg:text-6xl">
            Parish administration with secure access.
          </h1>
          <p className="mt-6 max-w-lg text-base font-semibold leading-8 text-cream/78">
            Professional controls for church communication, giving records, prayer requests, events, and security oversight.
          </p>
          <div className="mt-8 flex items-center gap-3 rounded-lg border border-gold/25 bg-white/8 p-4 text-sm font-bold leading-6 text-cream/82 backdrop-blur">
            <FaShieldAlt className="h-5 w-5 flex-none text-gold" />
            <span>Authorized parish administrators only.</span>
          </div>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          variants={scaleIn}
          custom={0.14}
          transition={{ duration: prefersReducedMotion ? 0 : 0.55, ease: gentleEase }}
          className="mx-auto w-full max-w-md rounded-lg border border-gold/25 bg-white p-5 text-ink shadow-[0_28px_90px_rgba(0,0,0,0.32)] sm:p-8"
        >
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-lg bg-gold text-navy shadow-[0_0_42px_rgba(201,162,39,0.28)]">
            <FaChurch className="h-7 w-7" />
          </div>
          <p className="mt-5 text-center text-xs font-extrabold uppercase tracking-[0.24em] text-gold">Admin Portal</p>
          <h2 className="mt-2 text-center font-display text-4xl font-bold leading-none text-navy">Secure Login</h2>
          <p className="mx-auto mt-3 max-w-xs text-center text-sm font-semibold leading-6 text-warm">
            Authorized parish administrators only.
          </p>

          {status ? (
            <motion.div
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
              className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700"
              initial={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0.12 : 0.42, ease: gentleEase }}
              role="alert"
            >
              <FaExclamationCircle className="mt-1 h-4 w-4 flex-none" />
              <span>{status.message}</span>
            </motion.div>
          ) : null}

          <div className="mt-7 grid gap-5">
            <AdminField
              autoComplete="email"
              disabled={isSubmitting}
              icon={FaEnvelope}
              label="Email Address"
              name="email"
              onChange={updateValue}
              placeholder="admin@stgabrielchurch.com"
              type="email"
              value={values.email}
            />
            <AdminField
              autoComplete="current-password"
              disabled={isSubmitting}
              icon={FaLock}
              label="Password"
              name="password"
              onChange={updateValue}
              placeholder="Enter admin password"
              value={values.password}
              withToggle
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 font-bold text-navy">
              <input
                checked={values.remember}
                className="h-5 w-5 rounded border-navy/20 text-gold accent-gold focus:ring-gold"
                disabled={isSubmitting}
                name="remember"
                onChange={updateValue}
                type="checkbox"
              />
              Remember email
            </label>
            <a className="font-extrabold text-gold transition hover:text-navy" href="mailto:office@stgabrielchurch.com?subject=Admin%20password%20reset">
              Forgot password?
            </a>
          </div>

          <button
            className="shine-button mt-7 inline-flex min-h-[54px] w-full items-center justify-center gap-3 rounded-full bg-gold px-6 py-4 text-sm font-extrabold uppercase tracking-[0.16em] text-navy shadow-[0_18px_48px_rgba(201,162,39,0.28)] transition hover:bg-navy hover:text-white focus:outline-none focus:ring-4 focus:ring-gold/30 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? <FaSpinner className="h-4 w-4 animate-spin" /> : <FaLock className="h-4 w-4" />}
            {isSubmitting ? "Signing in..." : "Login"}
          </button>

          <p className="mt-5 text-center text-xs font-semibold leading-5 text-warm">
            Admin sessions require a valid JWT and may be audited for parish security.
          </p>
        </motion.form>
      </motion.div>
    </section>
  );
}

export default AdminLogin;
