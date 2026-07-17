import React from "react";

/**
 * Tabs controladas. items: [{ id, label, count?, icon? }].
 * variant "line" (padrão, sublinhado) ou "pills" (segmentado).
 */
export function Tabs({ items = [], active, onChange, variant = "line", className = "", ...rest }) {
  const cls = ["lyra-tabs", variant === "pills" && "lyra-tabs--pills", className]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cls} role="tablist" {...rest}>
      {items.map((it) => (
        <button
          key={it.id}
          role="tab"
          aria-selected={active === it.id}
          className={["lyra-tab", active === it.id && "lyra-tab--active"].filter(Boolean).join(" ")}
          onClick={() => onChange && onChange(it.id)}
        >
          {it.icon}
          {it.label}
          {it.count != null && <span className="lyra-tab__count">{it.count}</span>}
        </button>
      ))}
    </div>
  );
}
