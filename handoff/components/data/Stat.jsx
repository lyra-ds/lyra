import React from "react";

/**
 * Métrica numérica com rótulo e variação opcional.
 */
export function Stat({ label, value, delta, direction = "flat", className = "", ...rest }) {
  const arrow = direction === "up" ? "↑" : direction === "down" ? "↓" : "→";
  return (
    <div className={["lyra-stat", className].filter(Boolean).join(" ")} {...rest}>
      <span className="lyra-stat__label">{label}</span>
      <span className="lyra-stat__value">{value}</span>
      {delta != null && (
        <span className={`lyra-stat__delta lyra-stat__delta--${direction}`}>
          {arrow} {delta}
        </span>
      )}
    </div>
  );
}
