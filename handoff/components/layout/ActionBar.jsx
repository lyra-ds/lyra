import React from "react";

/**
 * Barra flutuante de ações em massa — aparece com a seleção (pareia com DataTable).
 * Não renderiza se open=false ou count=0.
 */
export function ActionBar({ open = true, count, label = "selecionados", actions, onClear, className = "", children, ...rest }) {
  if (!open || count === 0) return null;
  return (
    <div className={["lyra-actionbar", className].filter(Boolean).join(" ")} role="toolbar" {...rest}>
      {count != null && <span className="lyra-actionbar__count"><strong>{count}</strong> {label}</span>}
      {children}
      <span className="lyra-actionbar__actions">
        {actions}
        {onClear && (
          <button type="button" className="lyra-actionbar__clear" aria-label="Limpar seleção" onClick={onClear}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        )}
      </span>
    </div>
  );
}
