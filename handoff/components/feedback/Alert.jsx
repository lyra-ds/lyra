import React from "react";

/**
 * Alert inline — mensagem contextual dentro do fluxo da página.
 */
export function Alert({ tone = "info", title, icon, className = "", children, ...rest }) {
  return (
    <div className={["lyra-alert", `lyra-alert--${tone}`, className].filter(Boolean).join(" ")} role="status" {...rest}>
      {icon && <span className="lyra-alert__icon">{icon}</span>}
      <div>
        {title && <p className="lyra-alert__title">{title}</p>}
        <p className="lyra-alert__body">{children}</p>
      </div>
    </div>
  );
}
