import React from "react";

/**
 * Botão padrão do Lyra DS.
 * Variants: primary | secondary | soft | ghost | danger. Sizes: sm | md | lg.
 */
export function Button({
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  loading = false,
  disabled = false,
  full = false,
  className = "",
  children,
  ...rest
}) {
  const cls = [
    "lyra-btn",
    `lyra-btn--${variant}`,
    `lyra-btn--${size}`,
    loading && "lyra-btn--loading",
    full && "lyra-btn--full",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {loading && <span className="lyra-btn__spinner" aria-hidden="true"></span>}
      {iconLeft}
      {children != null && <span className="lyra-btn__label">{children}</span>}
      {iconRight}
    </button>
  );
}
