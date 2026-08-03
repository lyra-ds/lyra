import React from "react";

/**
 * Texto só para leitores de tela (labels de ícones, contexto extra).
 */
export function VisuallyHidden({ as: Tag = "span", className = "", children, ...rest }) {
  return (
    <Tag className={["lyra-visually-hidden", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </Tag>
  );
}
