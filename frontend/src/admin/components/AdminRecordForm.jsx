import { useEffect, useState } from "react";

function AdminRecordForm({ fields, onCancel, onSubmit, record, submitLabel = "Save Record" }) {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const initialValues = {};
    fields.forEach((field) => {
      initialValues[field.name] = record?.[field.name] ?? field.defaultValue ?? (field.type === "select" ? field.options?.[0] || "" : "");
    });

    if (record?.id) initialValues.id = record.id;
    setValues(initialValues);
  }, [fields, record]);

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;
    setValues((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const validate = () => {
    const nextErrors = {};

    fields.forEach((field) => {
      const value = values[field.name];

      if (field.required && (value === undefined || value === null || String(value).trim() === "")) {
        nextErrors[field.name] = `${field.label} is required.`;
      }

      if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
        nextErrors[field.name] = "Enter a valid email address.";
      }

      if (field.type === "number" && value !== "" && value !== undefined && Number.isNaN(Number(value))) {
        nextErrors[field.name] = "Enter a valid number.";
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.name} className={`grid gap-2 text-sm font-bold text-navy ${field.type === "textarea" ? "sm:col-span-2" : ""}`}>
            <span>
              {field.label}
              {field.required ? <span className="text-gold"> *</span> : null}
            </span>

            {field.type === "textarea" ? (
              <textarea
                name={field.name}
                required={field.required}
                rows={4}
                value={values[field.name] || ""}
                onChange={handleChange}
                className="min-h-[120px] w-full rounded-xl border border-navy/10 bg-cream px-4 py-3 text-base font-semibold text-ink outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15 sm:text-sm"
              />
            ) : field.type === "checkbox" ? (
              <span className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-navy/10 bg-cream px-4 py-3">
                <input
                  checked={Boolean(values[field.name])}
                  name={field.name}
                  type="checkbox"
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-navy/20 text-gold focus:ring-gold"
                />
                <span className="text-sm font-semibold text-warm">{field.helpText || "Enabled"}</span>
              </span>
            ) : field.type === "select" ? (
              <select
                name={field.name}
                required={field.required}
                value={values[field.name] || ""}
                onChange={handleChange}
                className="min-h-12 w-full rounded-xl border border-navy/10 bg-cream px-4 py-3 text-base font-semibold text-ink outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15 sm:text-sm"
              >
                {(field.options || []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                name={field.name}
                type={field.type || "text"}
                required={field.required}
                value={values[field.name] || ""}
                onChange={handleChange}
                className="min-h-12 w-full rounded-xl border border-navy/10 bg-cream px-4 py-3 text-base font-semibold text-ink outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15 sm:text-sm"
              />
            )}
            {errors[field.name] ? <span className="text-xs font-extrabold text-red-600">{errors[field.name]}</span> : null}
          </label>
        ))}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-navy/10 bg-white px-5 text-sm font-extrabold uppercase tracking-[0.1em] text-navy transition hover:border-gold hover:text-gold sm:w-auto"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-gold px-5 text-sm font-extrabold uppercase tracking-[0.1em] text-navy shadow-soft transition hover:bg-navy hover:text-gold focus:outline-none focus:ring-4 focus:ring-gold/25 sm:w-auto"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export default AdminRecordForm;
