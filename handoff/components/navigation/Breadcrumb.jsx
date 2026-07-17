import React from "react";

/**
 * Breadcrumb — trilha de navegação. items: [{ label, href? }]; o último é a página atual.
 */
export function Breadcrumb({ items = [], className = "", ...rest }) {
  return (
    <nav className={["lyra-breadcrumb", className].filter(Boolean).join(" ")} aria-label="Breadcrumb" {...rest}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {i > 0 && <span className="lyra-breadcrumb__sep" aria-hidden="true"></span>}
            {last ? (
              <span className="lyra-breadcrumb__current" aria-current="page">{it.label}</span>
            ) : (
              <a href={it.href || "#"}>{it.label}</a>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
