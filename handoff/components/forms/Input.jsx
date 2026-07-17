import React from "react";

/**
 * Campo de texto do Lyra DS, com label, hint e estado de erro embutidos.
 */
export function Input({ label, hint, error, size, iconLeft, id, className = "", ...rest }) {
  const inputId = id || (label ? `lyra-in-${label.replace(/\W+/g, "-").toLowerCase()}` : undefined);
  const cls = [
    "lyra-input",
    size === "sm" && "lyra-input--sm",
    size === "lg" && "lyra-input--lg",
    error && "lyra-input--error",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const control = iconLeft ? (
    <span className="lyra-input-wrap">
      <span className="lyra-input-wrap__icon">{iconLeft}</span>
      <input id={inputId} className={cls} {...rest} />
    </span>
  ) : (
    <input id={inputId} className={cls} {...rest} />
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
