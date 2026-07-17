import React from "react";

/**
 * Estado vazio com ícone, título, descrição e ação.
 */
export function EmptyState({ icon, title, description, action, className = "", ...rest }) {
  return (
    <div className={["lyra-empty", className].filter(Boolean).join(" ")} {...rest}>
      {icon && <div className="lyra-empty__icon">{icon}</div>}
      <h3 className="lyra-empty__title">{title}</h3>
      {description && <p className="lyra-empty__desc">{description}</p>}
      {action && <div className="lyra-empty__action">{action}</div>}
    </div>
  );
}
