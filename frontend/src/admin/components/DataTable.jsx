import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FaChevronLeft, FaChevronRight, FaEdit, FaEye, FaSpinner, FaTrash } from "react-icons/fa";
import { cardReveal, fadeUp } from "../../utils/animations";
import { formatCurrency, formatDate } from "../utils/formatters";
import EmptyState from "./EmptyState";
import SearchFilterBar from "./SearchFilterBar";
import StatusBadge from "./StatusBadge";

function getRowId(row, rowKey) {
  if (typeof rowKey === "function") return rowKey(row);
  return row?.[rowKey] || row?.id || row?._id || JSON.stringify(row);
}

function getCellValue(row, column) {
  if (column.accessor) return column.accessor(row);
  return row?.[column.key];
}

function normalizeText(value) {
  return String(value ?? "").toLowerCase();
}

function renderCell(row, column) {
  const value = getCellValue(row, column);

  if (column.render) return column.render(value, row);
  if (column.type === "money" || column.type === "currency") return formatCurrency(value);
  if (column.type === "date") return formatDate(value);
  if (column.type === "status") return <StatusBadge status={value} />;
  if (column.type === "boolean") return <StatusBadge status={value ? "Active" : "Inactive"} />;
  if (value === undefined || value === null || value === "") return "N/A";

  return String(value);
}

function defaultActions({ onDelete, onEdit, onView }) {
  const actions = [];

  if (onView) actions.push({ icon: FaEye, label: "View", onClick: onView, tone: "navy" });
  if (onEdit) actions.push({ icon: FaEdit, label: "Edit", onClick: onEdit, tone: "gold" });
  if (onDelete) actions.push({ icon: FaTrash, label: "Delete", onClick: onDelete, tone: "danger" });

  return actions;
}

function actionClassName(tone) {
  if (tone === "danger") return "bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-100";
  if (tone === "gold") return "bg-gold text-navy hover:bg-navy hover:text-gold focus:ring-gold/20";
  return "bg-cream text-navy hover:bg-gold hover:text-navy focus:ring-gold/20";
}

function applyLocalFilters(rows, filters, dateFilters) {
  let nextRows = rows;

  filters.forEach((filter) => {
    const value = String(filter.value ?? "").trim();

    if (!value || value.toLowerCase() === "all") return;

    nextRows = nextRows.filter((row) => normalizeText(row?.[filter.key]).includes(value.toLowerCase()));
  });

  if (dateFilters?.key) {
    if (dateFilters.from) {
      nextRows = nextRows.filter((row) => String(row?.[dateFilters.key] || "").slice(0, 10) >= dateFilters.from);
    }

    if (dateFilters.to) {
      nextRows = nextRows.filter((row) => String(row?.[dateFilters.key] || "").slice(0, 10) <= dateFilters.to);
    }
  }

  return nextRows;
}

function DataTable({
  actions,
  columns = [],
  dateFilters,
  emptyMessage = "No records match the current filters.",
  emptyTitle = "No records found",
  enableSearch = true,
  filters = [],
  isLoading = false,
  loadingText = "Loading records...",
  onDelete,
  onEdit,
  onSearchChange,
  onView,
  pageSize = 10,
  pagination = true,
  rowKey = "id",
  rows = [],
  search,
  searchableKeys,
  searchPlaceholder = "Search records...",
  subtitle,
  title = "Records",
}) {
  const [localPage, setLocalPage] = useState(1);
  const [localSearch, setLocalSearch] = useState("");
  const activeSearch = search ?? localSearch;
  const tableActions = actions || defaultActions({ onDelete, onEdit, onView });

  const filteredRows = useMemo(() => {
    const query = activeSearch.trim().toLowerCase();
    const keys = searchableKeys?.length ? searchableKeys : columns.map((column) => column.key).filter(Boolean);
    let nextRows = [...rows];

    if (query) {
      nextRows = nextRows.filter((row) =>
        keys.some((key) => normalizeText(row?.[key]).includes(query)),
      );
    }

    return applyLocalFilters(nextRows, filters, dateFilters);
  }, [activeSearch, columns, dateFilters, filters, rows, searchableKeys]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(localPage, totalPages);
  const visibleRows = pagination
    ? filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filteredRows;

  useEffect(() => {
    setLocalPage(1);
  }, [activeSearch, filters, dateFilters?.from, dateFilters?.to, rows.length]);

  const handleSearchChange = (value) => {
    if (onSearchChange) {
      onSearchChange(value);
      return;
    }

    setLocalSearch(value);
  };

  const hasActiveFilters = filters.some((filter) => filter.value && String(filter.value).toLowerCase() !== "all");
  const hasActiveDates = Boolean(dateFilters?.from || dateFilters?.to);
  const hasActiveSearch = Boolean(activeSearch);
  const clearFilters = hasActiveFilters || hasActiveDates || hasActiveSearch
    ? () => {
        filters.forEach((filter) => filter.onChange?.("all", filter.key));
        dateFilters?.onFromChange?.("");
        dateFilters?.onToChange?.("");
        handleSearchChange("");
      }
    : undefined;

  return (
    <motion.section
      animate="visible"
      className="overflow-hidden rounded-3xl border border-navy/10 bg-white shadow-soft"
      initial="hidden"
      variants={fadeUp}
    >
      <div className="border-b border-navy/10 bg-cream/45 p-4 sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-gold">{title}</p>
            <p className="mt-1 text-sm font-semibold text-warm">
              {subtitle || `${filteredRows.length} visible of ${rows.length} total records`}
            </p>
          </div>
          {isLoading ? (
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-gold">
              <FaSpinner className="h-3.5 w-3.5 animate-spin" />
              {loadingText}
            </div>
          ) : null}
        </div>

        {enableSearch || filters.length || dateFilters ? (
          <div className="mt-4">
            <SearchFilterBar
              dateFilters={dateFilters}
              filters={filters}
              onClear={clearFilters}
              onSearchChange={handleSearchChange}
              search={activeSearch}
              searchPlaceholder={searchPlaceholder}
              showSearch={enableSearch}
            />
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="grid gap-3 p-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid gap-3 rounded-2xl border border-navy/5 p-4 lg:grid-cols-4">
              <div className="h-4 animate-pulse rounded-full bg-cream" />
              <div className="h-4 animate-pulse rounded-full bg-cream" />
              <div className="h-4 animate-pulse rounded-full bg-cream" />
              <div className="h-4 animate-pulse rounded-full bg-cream" />
            </div>
          ))}
        </div>
      ) : visibleRows.length ? (
        <>
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[840px] text-left">
              <thead className="bg-white text-xs uppercase tracking-[0.16em] text-warm">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key || column.label} className="px-5 py-4 font-extrabold">
                      {column.label}
                    </th>
                  ))}
                  {tableActions.length ? <th className="px-5 py-4 text-right font-extrabold">Actions</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/10">
                {visibleRows.map((row, index) => (
                  <motion.tr
                    key={getRowId(row, rowKey)}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    variants={cardReveal}
                    className="transition hover:bg-cream/45"
                  >
                    {columns.map((column) => (
                      <td key={column.key || column.label} className="px-5 py-4 text-sm font-semibold text-navy">
                        {renderCell(row, column)}
                      </td>
                    ))}
                    {tableActions.length ? (
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {tableActions.map((action) => {
                            const Icon = action.icon;
                            const disabled =
                              typeof action.disabled === "function" ? action.disabled(row) : Boolean(action.disabled);

                            if (action.show && !action.show(row)) return null;

                            return (
                              <button
                                key={action.label}
                                type="button"
                                disabled={disabled}
                                onClick={() => action.onClick?.(row)}
                                className={`grid h-11 w-11 place-items-center rounded-full transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${actionClassName(action.tone)}`}
                                aria-label={action.label}
                                title={action.label}
                              >
                                {Icon ? <Icon className="h-3.5 w-3.5" /> : action.label?.slice(0, 1)}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    ) : null}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="hidden">
            {visibleRows.map((row, index) => (
              <motion.article
                key={getRowId(row, rowKey)}
                custom={index}
                initial="hidden"
                animate="visible"
                variants={cardReveal}
                className="rounded-2xl border border-navy/10 bg-cream/55 p-4"
              >
                <div className="grid gap-3">
                  {columns.map((column) => (
                    <div key={column.key || column.label} className="grid gap-1 text-sm">
                      <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-warm">{column.label}</span>
                      <span className="min-w-0 break-words font-bold text-navy">{renderCell(row, column)}</span>
                    </div>
                  ))}
                </div>

                {tableActions.length ? (
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {tableActions.map((action) => {
                      const Icon = action.icon;
                      const disabled = typeof action.disabled === "function" ? action.disabled(row) : Boolean(action.disabled);

                      if (action.show && !action.show(row)) return null;

                      return (
                        <button
                          key={action.label}
                          type="button"
                          disabled={disabled}
                          onClick={() => action.onClick?.(row)}
                          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-xs font-extrabold uppercase tracking-[0.1em] transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${actionClassName(action.tone)}`}
                        >
                          {Icon ? <Icon className="h-4 w-4" /> : null}
                          {action.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </motion.article>
            ))}
          </div>
        </>
      ) : (
        <div className="p-5">
          <EmptyState title={emptyTitle} message={emptyMessage} />
        </div>
      )}

      {pagination && filteredRows.length > pageSize ? (
        <div className="flex flex-col gap-3 border-t border-navy/10 bg-cream/45 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold text-warm">
            Page <span className="text-navy">{currentPage}</span> of <span className="text-navy">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setLocalPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-navy/10 bg-white px-4 text-xs font-extrabold uppercase tracking-[0.12em] text-navy transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>
            <button
              type="button"
              onClick={() => setLocalPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-navy/10 bg-white px-4 text-xs font-extrabold uppercase tracking-[0.12em] text-navy transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <FaChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}
    </motion.section>
  );
}

export default DataTable;
