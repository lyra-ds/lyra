import React from "react";

/**
 * Card do Lyra DS — superfície padrão para agrupar conteúdo.
 * Use `title`/`actions`/`footer` para a anatomia completa, ou só children com `padded`.
 */
export function Card({ title, actions, footer, padded = true, interactive = false, className = "", children, ...rest }) {
  const cls = [
    "lyra-card",
    interactive && "lyra-card--interactive",
    !title && !footer && padded && "lyra-card--padded",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  if (!title && !footer) {
    return <div className={cls} {...rest}>{children}</div>;
  }
  return (
    <div className={cls} {...rest}>
      {title && (
        <div className="lyra-card__header">
          <h3 className="lyra-card__title">{title}</h3>
          {actions && <div style={{ display: "flex", gap: "var(--space-2)" }}>{actions}</div>}
        </div>
      )}
      <div className={padded ? "lyra-card__body" : undefined}>{children}</div>
      {footer && <div className="lyra-card__footer">{footer}</div>}
    </div>
  );
}
