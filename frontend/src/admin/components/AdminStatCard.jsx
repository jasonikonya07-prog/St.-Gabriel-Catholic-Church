import { motion } from "framer-motion";
import { cardReveal } from "../../utils/animations";

function AdminStatCard({ icon: Icon, index = 0, label, value, change, tone = "gold" }) {
  const isGold = tone === "gold";

  return (
    <motion.article
      initial="hidden"
      animate="visible"
      custom={index}
      variants={cardReveal}
      className="rounded-2xl border border-navy/10 bg-white p-4 shadow-soft sm:p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-warm">{label}</p>
          <p className="mt-3 break-words font-display text-2xl font-bold text-navy sm:text-3xl">{value}</p>
        </div>
        <span className={`grid h-11 w-11 place-items-center rounded-full ${isGold ? "bg-gold text-navy" : "bg-navy text-gold"}`}>
          {Icon ? <Icon className="h-5 w-5" /> : null}
        </span>
      </div>
      <p className={`mt-4 text-sm font-extrabold ${isGold ? "text-gold" : "text-navy"}`}>{change}</p>
    </motion.article>
  );
}

export default AdminStatCard;
