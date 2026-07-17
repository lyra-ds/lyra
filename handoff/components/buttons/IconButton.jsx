import React from "react";

/**
 * Botão quadrado só-ícone. Sempre passe `label` (vira aria-label).
 */
export function IconButton({
  variant = "secondary",
  size = "md",
  label,
  className = "",
  children,
  ...rest
}) {
  const cls = ["lyra-btn", "lyra-btn--icon", `lyra-btn--${variant}`, `lyra-btn--${size}`, className]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={cls} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}
