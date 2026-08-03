import React from "react";

const sp = (g) => (typeof g === "number" ? `var(--space-${g})` : g);

/**
 * Pilha flex com gap tokenizado (número = passo da escala --space-N).
 */
export function Stack({ direction = "column", gap = 4, align, justify, wrap = false, as: Tag = "div", className = "", style, children, ...rest }) {
  return (
    <Tag
      className={["lyra-stack", className].filter(Boolean).join(" ")}
      style={{ display: "flex", flexDirection: direction, gap: sp(gap), alignItems: align, justifyContent: justify, flexWrap: wrap ? "wrap" : undefined, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * Linha flex com wrap e itens centralizados (chips, tags, botões).
 */
export function Inline({ gap = 2, align = "center", ...rest }) {
  return <Stack direction="row" gap={gap} align={align} wrap {...rest} />;
}
