import React from "react";

/**
 * Tag neutra (com borda) para rótulos e filtros; removível com onRemove.
 */
export function Tag({ onRemove, className = "", children, ...rest }) {
  return (
    <span className={["lyra-tag", className].filter(Boolean).join(" ")} {...rest}>
      {children}
      {onRemove && (
        <button type="button" className="lyra-tag__remove" aria-label="Remover" onClick={onRemove}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      )}
    </span>
  );
}
