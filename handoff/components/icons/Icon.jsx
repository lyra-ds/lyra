import React from "react";

const LUCIDE_VERSION = "0.469.0";

/**
 * Ícone do Lyra DS — renderiza ícones Lucide (open source, ISC) via CSS mask,
 * herdando a cor do texto (currentColor) como um glifo nativo.
 * Nomes: kebab-case do Lucide, ex. "arrow-right", "layout-dashboard".
 */
export function Icon({ name, size = 20, color, className, style, title }) {
  const url = `https://unpkg.com/lucide-static@${LUCIDE_VERSION}/icons/${name}.svg`;
  return (
    <span
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : "true"}
      className={className}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        flexShrink: 0,
        verticalAlign: "middle",
        backgroundColor: color || "currentcolor",
        WebkitMaskImage: `url(${url})`,
        maskImage: `url(${url})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "100% 100%",
        maskSize: "100% 100%",
        ...style,
      }}
    ></span>
  );
}
