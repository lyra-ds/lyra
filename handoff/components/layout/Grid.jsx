import React from "react";

const sp = (g) => (typeof g === "number" ? `var(--space-${g})` : g);

/**
 * Grid com colunas fixas ou responsivas via minItem (auto-fit).
 */
export function Grid({ columns = 2, minItem, gap = 4, className = "", style, children, ...rest }) {
  const template = minItem
    ? `repeat(auto-fit, minmax(min(${minItem}px, 100%), 1fr))`
    : typeof columns === "number"
      ? `repeat(${columns}, minmax(0, 1fr))`
      : columns;
  return (
    <div
      className={["lyra-grid", className].filter(Boolean).join(" ")}
      style={{ display: "grid", gridTemplateColumns: template, gap: sp(gap), ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
