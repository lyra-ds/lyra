import React from "react";

/**
 * Drawer (slide-over) lateral direito — para formulários e detalhes
 * que não justificam navegação de página.
 */
export function Drawer({ open, onClose, title, footer, className = "", children, ...rest }) {
  if (!open) return null;
  return (
    <div
      className="lyra-drawer-overlay"
      onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}
    >
      <div className={["lyra-drawer", className].filter(Boolean).join(" ")} role="dialog" aria-modal="true" {...rest}>
        <div className="lyra-drawer__header">
          <h2 className="lyra-drawer__title">{title}</h2>
          {onClose && (
            <button type="button" className="lyra-tag__remove" style={{ width: 28, height: 28 }} aria-label="Fechar" onClick={onClose}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>
        <div className="lyra-drawer__body">{children}</div>
        {footer && <div className="lyra-drawer__footer">{footer}</div>}
      </div>
    </div>
  );
}
