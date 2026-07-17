import React from "react";

/**
 * Toast — notificação transitória escura, canto inferior direito.
 * Use ToastStack como container fixo; Toast individual é apresentacional.
 */
export function Toast({ tone = "info", icon, onClose, className = "", children, ...rest }) {
  return (
    <div className={["lyra-toast", className].filter(Boolean).join(" ")} role="status" {...rest}>
      {icon && <span className={`lyra-toast__icon--${tone}`} style={{ display: "inline-flex" }}>{icon}</span>}
      <span>{children}</span>
      {onClose && (
        <button type="button" className="lyra-toast__close" aria-label="Fechar" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      )}
    </div>
  );
}

/**
 * Container fixo (bottom-right) que empilha Toasts.
 */
export function ToastStack({ children, className = "", ...rest }) {
  return (
    <div className={["lyra-toast-stack", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </div>
  );
}
