import React from "react";

/**
 * Tooltip CSS-only — envolva o alvo e passe `tip`.
 */
export function Tooltip({ tip, className = "", children, ...rest }) {
  return (
    <span className={["lyra-tooltip", className].filter(Boolean).join(" ")} data-tip={tip} {...rest}>
      {children}
    </span>
  );
}
