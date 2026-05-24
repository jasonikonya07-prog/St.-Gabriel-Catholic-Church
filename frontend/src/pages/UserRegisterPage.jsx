import { useState } from "react";
import { FaEnvelope, FaLock, FaPhoneAlt, FaUserAlt, FaUserPlus } from "react-icons/fa";
import { Link, Navigate, useNavigate } from "react-router-dom";
import FormAlert from "../components/FormAlert";
import PremiumButton from "../components/PremiumButton";
import PremiumField from "../components/PremiumField";
import { useUserAuth } from "../context/UserAuthContext";

function UserRegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated, register } = useUserAuth();
  const [form, setForm] = useState({ email: "", fullName: "", password: "", phone: "" });
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
      await register(form);
      navigate("/profile", { replace: true });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Registration failed." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="section-padding bg-cream">
      <div className="section-shell">
        <form onSubmit={handleSubmit} className="mx-auto max-w-xl rounded-2xl border border-navy/10 bg-white p-5 shadow-premium sm:p-8">
          <p className="eyebrow">Parish account</p>
          <h1 className="mt-2 break-words font-display text-3xl font-bold text-navy md:text-4xl">Create Account</h1>
          <p className="mt-3 text-sm font-semibold leading-7 text-warm">
            Create a secure St. Gabriel Church account.
          </p>

          <PremiumField className="mt-7" label="Full Name" name="fullName" value={form.fullName} onChange={updateField} icon={FaUserAlt} required />
          <PremiumField className="mt-5" label="Email Address" name="email" type="email" value={form.email} onChange={updateField} icon={FaEnvelope} required />
          <PremiumField className="mt-5" label="Phone Number" name="phone" type="tel" value={form.phone} onChange={updateField} icon={FaPhoneAlt} />
          <PremiumField className="mt-5" label="Password" name="password" type="password" value={form.password} onChange={updateField} icon={FaLock} required />
          <p className="mt-2 text-xs font-bold text-warm">Use at least 8 characters with letters and numbers.</p>
          <FormAlert status={status} />

          <PremiumButton type="submit" fullWidth icon={FaUserPlus} loading={isSubmitting} loadingLabel="Creating..." className="mt-6">
            Create Account
          </PremiumButton>

          <p className="mt-5 text-center text-sm font-semibold text-warm">
            Already registered?{" "}
            <Link to="/login" className="font-extrabold text-gold hover:text-navy">
              Login
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}

export default UserRegisterPage;
