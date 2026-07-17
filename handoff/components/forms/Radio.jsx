import React from "react";

/**
 * Radio com rótulo embutido. Agrupe pelo atributo `name`.
 */
export function Radio({ label, className = "", ...rest }) {
  const dot = <input type="radio" className={["lyra-radio", className].filter(Boolean).join(" ")} {...rest} />;
  if (!label) return dot;
  return (
    <label className="lyra-check-row">
      {dot}
      <span>{label}</span>
    </label>
  );
}
