import { motion } from "framer-motion";
import { FaCalendarAlt, FaFilter, FaSearch, FaTimes } from "react-icons/fa";
import { fadeUp } from "../../utils/animations";

function normalizeOptions(options = []) {
  return options.map((option) =>
    typeof option === "string" ? { label: option, value: option } : { label: option.label, value: option.value },
  );
}

function SearchFilterBar({
  dateFilters,
  filter,
  filterLabel = "Filter",
  filterOptions = [],
  filters = [],
  onClear,
  onFilterChange,
  onSearchChange,
  search = "",
  searchPlaceholder = "Search records...",
  showSearch = true,
}) {
  const legacyFilter =
    filterOptions.length > 0
      ? [
          {
            key: "legacy-filter",
            label: filterLabel,
            onChange: onFilterChange,
            options: normalizeOptions(filterOptions),
            value: filter,
          },
        ]
      : [];
  const activeFilters = [...legacyFilter, ...filters];
  const hasClear = Boolean(onClear);

  return (
    <motion.div
      animate="visible"
      className="rounded-3xl border border-navy/10 bg-white p-4 shadow-soft"
      initial="hidden"
      variants={fadeUp}
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)_auto] lg:items-end">
        {showSearch ? (
          <label className="grid gap-2">
            <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-warm">Search</span>
            <span className="relative block">
              <FaSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
              <input
                type="search"
                value={search}
                onChange={(event) => onSearchChange?.(event.target.value)}
                placeholder={searchPlaceholder}
                className="min-h-12 w-full rounded-full border border-navy/10 bg-cream/70 py-3 pl-11 pr-4 text-sm font-bold text-navy outline-none transition placeholder:text-warm/70 focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
              />
            </span>
          </label>
        ) : (
          <div className="hidden lg:block" />
        )}

        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {activeFilters.map((item) => (
            <label key={item.key || item.label} className="grid gap-2">
              <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-warm">{item.label}</span>
              <span className="relative block">
                <FaFilter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
                <select
                  value={item.value ?? ""}
                  onChange={(event) => item.onChange?.(event.target.value, item.key)}
                  className="min-h-12 w-full appearance-none rounded-full border border-navy/10 bg-cream/70 py-3 pl-11 pr-10 text-sm font-bold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
                >
                  {normalizeOptions(item.options).map((option) => (
                    <option key={`${item.key || item.label}-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </span>
            </label>
          ))}

          {dateFilters?.from !== undefined || dateFilters?.to !== undefined ? (
            <>
              <label className="grid gap-2">
                <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-warm">
                  {dateFilters.fromLabel || "From"}
                </span>
                <span className="relative block">
                  <FaCalendarAlt className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
                  <input
                    type="date"
                    value={dateFilters.from || ""}
                    onChange={(event) => dateFilters.onFromChange?.(event.target.value)}
                    className="min-h-12 w-full rounded-full border border-navy/10 bg-cream/70 py-3 pl-11 pr-4 text-sm font-bold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
                  />
                </span>
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-warm">
                  {dateFilters.toLabel || "To"}
                </span>
                <span className="relative block">
                  <FaCalendarAlt className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
                  <input
                    type="date"
                    value={dateFilters.to || ""}
                    onChange={(event) => dateFilters.onToChange?.(event.target.value)}
                    className="min-h-12 w-full rounded-full border border-navy/10 bg-cream/70 py-3 pl-11 pr-4 text-sm font-bold text-navy outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15"
                  />
                </span>
              </label>
            </>
          ) : null}
        </div>

        {hasClear ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-navy/10 bg-white px-5 text-xs font-extrabold uppercase tracking-[0.14em] text-navy transition hover:border-gold hover:text-gold lg:w-auto"
          >
            <FaTimes className="h-3.5 w-3.5" />
            Clear
          </button>
        ) : null}
      </div>
    </motion.div>
  );
}

export default SearchFilterBar;
