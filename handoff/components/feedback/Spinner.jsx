import React from "react";

/**
 * Spinner de carregamento indeterminado.
 */
export function Spinner({ size = "md", className = "", ...rest }) {
  return (
    <span
      className={["lyra-spinner", `lyra-spinner--${size}`, className].filter(Boolean).join(" ")}
      role="status"
      aria-label="Carregando"
      {...rest}
    ></span>
  );
}
