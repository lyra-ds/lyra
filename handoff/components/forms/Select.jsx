import React from "react";

/**
 * Select nativo estilizado (chevron Lucide via CSS).
 * Passe <option>s como children.
 */
export function Select({ label, hint, error, size, id, className = "", children, ...rest }) {
  const inputId = id || (label ? `lyra-sel-${label.replace(/\W+/g, "-").toLowerCase()}` : undefined);
  const cls = [
    "lyra-input",
    size === "sm" && "lyra-input--sm",
    size === "lg" && "lyra-input--lg",
    error && "lyra-input--error",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const control = (
    <span className="lyra-select-wrap">
      <select id={inputId} className={cls} {...rest}>{children}</select>
    </span>
  );
  if (!label && !hint && !error) return control;
  return (
    <div className="lyra-field">
      {label && <label className="lyra-label" htmlFor={inputId}>{label}</label>}
      {control}
      {error ? <span className="lyra-hint lyra-hint--error">{error}</span> : hint ? <span className="lyra-hint">{hint}</span> : null}
    </div>
  );
}
