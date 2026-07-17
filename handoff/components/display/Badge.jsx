import React from "react";

/**
 * Badge de status — cor por tom semântico, com ponto opcional.
 */
export function Badge({ tone = "neutral", dot = false, className = "", children, ...rest }) {
  const cls = ["lyra-badge", `lyra-badge--${tone}`, className].filter(Boolean).join(" ");
  return (
    <span className={cls} {...rest}>
      {dot && <span className="lyra-badge__dot" aria-hidden="true"></span>}
      {children}
    </span>
  );
}
