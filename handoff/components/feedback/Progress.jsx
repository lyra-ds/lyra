import React from "react";

/**
 * Barra de progresso determinada (0–100).
 */
export function Progress({ value = 0, tone, className = "", ...rest }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={["lyra-progress", tone && `lyra-progress--${tone}`, className].filter(Boolean).join(" ")}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      {...rest}
    >
      <div className="lyra-progress__fill" style={{ width: `${clamped}%` }}></div>
    </div>
  );
}
