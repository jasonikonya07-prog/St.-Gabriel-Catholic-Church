function PremiumField({
  as = "input",
  className = "",
  icon: Icon,
  inputClassName = "",
  label,
  name,
  options = [],
  required = false,
  rows = 5,
  type = "text",
  ...props
}) {
  const fieldClassName = [
    "premium-input",
    "min-w-0",
    Icon ? "pl-11" : "",
    as === "textarea" ? "min-h-[150px] resize-none leading-7" : "min-h-[52px]",
    inputClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <label className={`premium-field ${className}`}>
      <span className="premium-field-label">
        {label}
        {required ? <span className="text-gold"> *</span> : null}
      </span>

      <span className="relative block">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gold transition duration-300" />
        ) : null}

        {as === "textarea" ? (
          <textarea name={name} rows={rows} required={required} className={fieldClassName} {...props} />
        ) : as === "select" ? (
          <select name={name} required={required} className={fieldClassName} {...props}>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input name={name} type={type} required={required} className={fieldClassName} {...props} />
        )}
      </span>
    </label>
  );
}

export default PremiumField;
