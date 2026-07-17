import React from "react";

/**
 * Avatar com imagem ou iniciais; ponto de status opcional.
 * shape: "circle" (padrão) | "square" (workspaces, organizações).
 */
export function Avatar({ src, name = "", size = "md", shape = "circle", status, className = "", ...rest }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  return (
    <span className={["lyra-avatar", `lyra-avatar--${size}`, shape === "square" && "lyra-avatar--square", className].filter(Boolean).join(" ")} title={name} {...rest}>
      {src ? <img src={src} alt={name} /> : <span aria-hidden="true">{initials}</span>}
      {status && <span className={`lyra-avatar__status lyra-avatar__status--${status}`} aria-label={status}></span>}
    </span>
  );
}

/**
 * Grupo de avatares sobrepostos.
 */
export function AvatarGroup({ children, className = "", ...rest }) {
  return (
    <span className={["lyra-avatar-group", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </span>
  );
}
