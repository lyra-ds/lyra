import React from "react";

/**
 * Dialog modal controlado. Renderiza overlay + painel quando `open`.
 */
export function Dialog({ open, onClose, title, footer, className = "", children, ...rest }) {
  if (!open) return null;
  return (
    <div
      className="lyra-dialog-overlay"
      onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}
    >
      <div className={["lyra-dialog", className].filter(Boolean).join(" ")} role="dialog" aria-modal="true" {...rest}>
        <div className="lyra-dialog__header">
          <h2 className="lyra-dialog__title">{title}</h2>
          {onClose && (
            <button type="button" className="lyra-tag__remove" style={{ width: 28, height: 28 }} aria-label="Fechar" onClick={onClose}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>
        <div className="lyra-dialog__body">{children}</div>
        {footer && <div className="lyra-dialog__footer">{footer}</div>}
      </div>
    </div>
  );
}
