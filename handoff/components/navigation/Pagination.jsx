import React from "react";

function range(a, b) {
  const out = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}

function pages(page, total) {
  if (total <= 7) return range(1, total);
  if (page <= 4) return [...range(1, 5), "…", total];
  if (page >= total - 3) return [1, "…", ...range(total - 4, total)];
  return [1, "…", page - 1, page, page + 1, "…", total];
}

/**
 * Paginação numérica com prev/next e reticências.
 */
export function Pagination({ page, total, onChange, className = "", ...rest }) {
  const go = (p) => onChange && p >= 1 && p <= total && onChange(p);
  return (
    <nav className={["lyra-pagination", className].filter(Boolean).join(" ")} aria-label="Paginação" {...rest}>
      <button className="lyra-page" disabled={page === 1} onClick={() => go(page - 1)} aria-label="Página anterior">‹</button>
      {pages(page, total).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="lyra-page lyra-page--gap">…</span>
        ) : (
          <button
            key={p}
            className={["lyra-page", p === page && "lyra-page--active"].filter(Boolean).join(" ")}
            aria-current={p === page ? "page" : undefined}
            onClick={() => go(p)}
          >
            {p}
          </button>
        )
      )}
      <button className="lyra-page" disabled={page === total} onClick={() => go(page + 1)} aria-label="Próxima página">›</button>
    </nav>
  );
}
