import { FaChurch } from "react-icons/fa";

function EmptyState({ action, message = "No records are available yet.", title = "Nothing here yet" }) {
  return (
    <div className="rounded-2xl border border-dashed border-navy/15 bg-white p-8 text-center shadow-soft">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gold/15 text-gold">
        <FaChurch className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-display text-2xl font-bold text-navy">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-warm">{message}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export default EmptyState;
