import React from "react";

const TONES = {
  success: "var(--success)",
  accent: "var(--accent)",
  danger: "var(--danger)",
  warning: "var(--warning)",
  neutral: "var(--border-strong)",
};

/**
 * Anel de progresso segmentado — categorias nomeadas somando um total
 * (ex.: consumidas · agendadas · disponíveis · perdidas). A legenda
 * textual é obrigatória: o anel é decorativo (aria-hidden), o texto é
 * a fonte da informação.
 */
export function SegmentedRing({ segments = [], total, centerValue, centerLabel, size = "lg", stacked = false, showLegend = true, className = "", ...rest }) {
  const px = size === "lg" ? 160 : 96;
  const stroke = size === "lg" ? 12 : 9;
  const r = (px - stroke) / 2;
  const c = 2 * Math.PI * r;
  const sum = segments.reduce((a, s) => a + (s.value || 0), 0);
  const denom = total || sum || 1;
  const gap = segments.filter((s) => s.value > 0).length > 1 ? 2.5 : 0;
  let acc = 0;
  const arcs = segments.filter((s) => s.value > 0).map((s, i) => {
    const frac = s.value / denom;
    const len = Math.max(0, frac * c - gap);
    const arc = { ...s, dash: `${len} ${c - len}`, offset: -acc * c + c / 4 };
    acc += frac;
    return arc;
  });
  const text = segments.filter((s) => s.value > 0).map((s) => `${s.value} ${s.label.toLowerCase()}`).join(", ");
  return (
    <div className={["lyra-ring", `lyra-ring--${size}`, stacked && "lyra-ring--stacked", className].filter(Boolean).join(" ")} {...rest}>
      <span className="lyra-ring__wrap">
        <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`} aria-hidden="true">
          <circle cx={px / 2} cy={px / 2} r={r} fill="none" stroke="var(--surface-sunken)" strokeWidth={stroke} />
          {arcs.map((a, i) => (
            <circle key={i} cx={px / 2} cy={px / 2} r={r} fill="none"
              stroke={a.color || TONES[a.tone] || TONES.neutral}
              strokeWidth={stroke} strokeLinecap={gap ? "round" : "butt"}
              strokeDasharray={a.dash} strokeDashoffset={a.offset}
            />
          ))}
        </svg>
        <span className="lyra-ring__center">
          {centerValue != null && <span className="lyra-ring__num">{centerValue}</span>}
          {centerLabel && <span className="lyra-ring__cap">{centerLabel}</span>}
        </span>
      </span>
      <span className="lyra-visually-hidden" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        {centerValue != null ? `${centerLabel || ""} ${centerValue} — ` : ""}{text}
      </span>
      {showLegend && (
        <ul className="lyra-ring__legend" aria-hidden="true">
          {segments.map((s) => (
            <li key={s.label} className="lyra-ring__li">
              <span className="lyra-ring__swatch" style={{ background: s.color || TONES[s.tone] || TONES.neutral }} />
              <span>{s.label}</span>
              <span className="lyra-ring__val">{s.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
