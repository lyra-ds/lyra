import React from "react";

/**
 * Skeleton de carregamento com shimmer. Dimensione via width/height.
 */
export function Skeleton({ width = "100%", height = 14, circle = false, className = "", style, ...rest }) {
  return (
    <span
      className={["lyra-skeleton", circle && "lyra-skeleton--circle", className].filter(Boolean).join(" ")}
      style={{ width: circle ? height : width, height, ...style }}
      aria-hidden="true"
      {...rest}
    ></span>
  );
}
