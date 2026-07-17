import React from "react";

/**
 * Área de texto multi-linha com label/hint/erro.
 */
export function Textarea({ label, hint, error, id, className = "", ...rest }) {
  const inputId = id || (label ? `lyra-ta-${label.replace(/\W+/g, "-").toLowerCase()}` : undefined);
  const cls = ["lyra-input", "lyra-textarea", error && "lyra-input--error", className]
    .filter(Boolean)
    .join(" ");
  const control = <textarea id={inputId} className={cls} {...rest}></textarea>;
  if (!label && !hint && !error) return control;
  return (
    <div className="lyra-field">
      {label && <label className="lyra-label" htmlFor={inputId}>{label}</label>}
      {control}
      {error ? <span className="lyra-hint lyra-hint--error">{error}</span> : hint ? <span className="lyra-hint">{hint}</span> : null}
    </div>
  );
}
