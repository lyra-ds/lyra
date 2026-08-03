import React from "react";

/**
 * Container central de conteúdo — max-width var(--container-max) + gutter.
 */
export function Container({ max, className = "", style, children, ...rest }) {
  return (
    <div className={["lyra-container", className].filter(Boolean).join(" ")} style={max ? { maxWidth: max, ...style } : style} {...rest}>
      {children}
    </div>
  );
}
