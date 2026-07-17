import React from "react";

/**
 * Switch (toggle) com rótulo embutido — para estados liga/desliga imediatos.
 */
export function Switch({ label, className = "", ...rest }) {
  return (
    <label className={["lyra-switch", className].filter(Boolean).join(" ")}>
      <input type="checkbox" role="switch" {...rest} />
      <span className="lyra-switch__track"></span>
      {label && <span>{label}</span>}
    </label>
  );
}
