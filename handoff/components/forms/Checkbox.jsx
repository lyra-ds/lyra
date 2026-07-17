import React from "react";

/**
 * Checkbox com rótulo embutido.
 */
export function Checkbox({ label, className = "", ...rest }) {
  const box = <input type="checkbox" className={["lyra-checkbox", className].filter(Boolean).join(" ")} {...rest} />;
  if (!label) return box;
  return (
    <label className="lyra-check-row">
      {box}
      <span>{label}</span>
    </label>
  );
}
