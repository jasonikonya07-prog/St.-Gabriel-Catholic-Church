import { Link } from "react-router-dom";
import { FaChurch, FaHome, FaShieldAlt } from "react-icons/fa";

function AdminNotFound() {
  return (
    <section className="grid min-h-screen place-items-center bg-navy px-4 py-12 text-white">
      <div className="w-full max-w-2xl rounded-lg border border-white/10 bg-cream p-5 text-center text-navy shadow-[0_30px_90px_rgba(0,0,0,0.35)] sm:p-10">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-lg bg-navy text-gold shadow-[0_18px_50px_rgba(1,24,44,0.25)]">
          <FaChurch className="h-11 w-11" />
        </div>

        <div className="mt-7 inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-gold sm:tracking-[0.2em]">
          <FaShieldAlt className="h-3.5 w-3.5" />
          Admin Area
        </div>

        <h1 className="mt-6 font-serif text-5xl font-black leading-tight text-navy sm:text-6xl">404</h1>
        <p className="mt-3 break-words text-2xl font-extrabold text-navy">Page not found</p>
        <p className="mx-auto mt-4 max-w-md text-sm font-semibold leading-7 text-slate-600">
          This admin page is not available. Protected parish management pages require a valid administrator session.
        </p>

        <Link
          to="/"
          className="mt-8 inline-flex min-h-12 w-full flex-wrap items-center justify-center gap-3 rounded-full bg-gold px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-navy shadow-[0_18px_42px_rgba(201,162,39,0.28)] transition hover:-translate-y-0.5 hover:bg-gold-dark sm:w-auto sm:px-7 sm:py-4 sm:tracking-[0.18em]"
        >
          <FaHome className="h-4 w-4" />
          Return to Website
        </Link>
      </div>
    </section>
  );
}

export default AdminNotFound;
