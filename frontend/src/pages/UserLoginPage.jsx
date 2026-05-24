import { useState } from "react";
import { FaEnvelope, FaLock, FaSignInAlt } from "react-icons/fa";
import { Link, Navigate, useNavigate } from "react-router-dom";
import FormAlert from "../components/FormAlert";
import PremiumButton from "../components/PremiumButton";
import PremiumField from "../components/PremiumField";
import { useUserAuth } from "../context/UserAuthContext";

function UserLoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useUserAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  if (isAuthenticated) return <Navigate to="/profile" replace />;

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setStatus(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      await login(form.email, form.password);
      navigate("/profile", { replace: true });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Login failed." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="section-padding bg-cream">
      <div className="section-shell">
        <form onSubmit={handleSubmit} className="mx-auto max-w-xl rounded-2xl border border-navy/10 bg-white p-5 shadow-premium sm:p-8">
          <p className="eyebrow">Parish account</p>
          <h1 className="mt-2 break-words font-display text-3xl font-bold text-navy md:text-4xl">User Login</h1>
          <p className="mt-3 text-sm font-semibold leading-7 text-warm">
            Sign in to view your St. Gabriel Church profile.
          </p>

          <PremiumField className="mt-7" label="Email Address" name="email" type="email" value={form.email} onChange={updateField} icon={FaEnvelope} required />
          <PremiumField className="mt-5" label="Password" name="password" type="password" value={form.password} onChange={updateField} icon={FaLock} required />
          <FormAlert status={status} />

          <PremiumButton type="submit" fullWidth icon={FaSignInAlt} loading={isSubmitting} loadingLabel="Signing in..." className="mt-6">
            Login
          </PremiumButton>

          <p className="mt-5 text-center text-sm font-semibold text-warm">
            New here?{" "}
            <Link to="/register" className="font-extrabold text-gold hover:text-navy">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}

export default UserLoginPage;
