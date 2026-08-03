import React from "react";

const toDate = (v) => (v == null ? null : v instanceof Date ? v : new Date(String(v) + "T00:00:00"));
const same = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const chev = (d) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d === "l" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
  </svg>
);
const MONTHS = Array.from({ length: 12 }, (_, i) => cap(new Date(2000, i, 1).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")));

/**
 * Calendário de mês — data única ou intervalo (range), navegação por
 * mês/ano (clique no título), min/max, dias desabilitados por função,
 * marcador por dia (disponibilidade), início de semana e tamanhos.
 */
export function Calendar({ value, defaultValue, onChange, min, max, range = false, isDateDisabled, renderDayMarker, weekStartsOn = 0, size = "sm", todayButton = false, className = "", ...rest }) {
  const norm = (v) => (range ? { start: toDate(v && v.start), end: toDate(v && v.end) } : toDate(v));
  const [internal, setInternal] = React.useState(() => norm(defaultValue));
  const sel = value !== undefined ? norm(value) : internal;
  const today = new Date();
  const anchor = range ? (sel && sel.start) : sel;
  const [view, setView] = React.useState(() => {
    const d = anchor || today;
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [mode, setMode] = React.useState("days");
  const minD = toDate(min);
  const maxD = toDate(max);
  const commit = (next) => {
    if (value === undefined) setInternal(next);
    onChange && onChange(next);
  };
  const pick = (d) => {
    if (!range) return commit(d);
    const start = sel && sel.start;
    const end = sel && sel.end;
    if (!start || (start && end)) return commit({ start: d, end: null });
    commit(d < start ? { start: d, end: start } : { start, end: d });
  };
  const disabled = (d) => (minD && d < minD) || (maxD && d > maxD) || (isDateDisabled && isDateDisabled(d));
  const nav = (n) => {
    if (mode === "days") setView(new Date(view.getFullYear(), view.getMonth() + n, 1));
    else if (mode === "months") setView(new Date(view.getFullYear() + n, view.getMonth(), 1));
    else setView(new Date(view.getFullYear() + n * 12, view.getMonth(), 1));
  };
  const yearBase = Math.floor(view.getFullYear() / 12) * 12;
  const headLabel = mode === "days"
    ? cap(view.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }))
    : mode === "months" ? String(view.getFullYear()) : `${yearBase} – ${yearBase + 11}`;
  const start = new Date(view);
  start.setDate(1 - ((start.getDay() - weekStartsOn + 7) % 7));
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
  const selStart = range ? sel && sel.start : sel;
  const selEnd = range ? sel && sel.end : null;
  const inRange = (d) => range && selStart && selEnd && d > selStart && d < selEnd;
  const WD = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const weekdays = Array.from({ length: 7 }, (_, i) => WD[(i + weekStartsOn) % 7]);
  return (
    <div className={["lyra-cal", size === "md" && "lyra-cal--md", className].filter(Boolean).join(" ")} {...rest}>
      <div className="lyra-cal__head">
        <button type="button" className="lyra-cal__nav" aria-label="Anterior" onClick={() => nav(-1)}>{chev("l")}</button>
        <button type="button" className="lyra-cal__label" aria-label="Mudar visão de mês/ano" onClick={() => setMode(mode === "days" ? "months" : "years")}>
          {headLabel}
        </button>
        <button type="button" className="lyra-cal__nav" aria-label="Próximo" onClick={() => nav(1)}>{chev("r")}</button>
      </div>
      {mode === "days" && (
        <div className="lyra-cal__grid">
          {weekdays.map((w) => <span key={w} className="lyra-cal__wd">{w}</span>)}
          {cells.map((d, i) => (
            <button
              type="button"
              key={i}
              className={[
                "lyra-cal__day",
                d.getMonth() !== view.getMonth() && "lyra-cal__day--out",
                same(d, today) && "lyra-cal__day--today",
                (same(d, selStart) || same(d, selEnd)) && "lyra-cal__day--selected",
                inRange(d) && "lyra-cal__day--in-range",
              ].filter(Boolean).join(" ")}
              disabled={disabled(d)}
              aria-pressed={same(d, selStart) || same(d, selEnd) || undefined}
              onClick={() => pick(d)}
            >
              {d.getDate()}
              {renderDayMarker && renderDayMarker(d)}
            </button>
          ))}
        </div>
      )}
      {mode === "days" && todayButton && (
        <div className="lyra-cal__foot">
          <button type="button" className="lyra-cal__today" onClick={() => { const t = new Date(); setView(new Date(t.getFullYear(), t.getMonth(), 1)); if (!disabled(t)) pick(t); }}>Hoje</button>
        </div>
      )}
      {mode === "months" && (
        <div className="lyra-cal__mgrid">
          {MONTHS.map((m, i) => (
            <button
              type="button"
              key={m}
              className={["lyra-cal__mcell", anchor && anchor.getMonth() === i && anchor.getFullYear() === view.getFullYear() && "lyra-cal__mcell--selected"].filter(Boolean).join(" ")}
              onClick={() => { setView(new Date(view.getFullYear(), i, 1)); setMode("days"); }}
            >
              {m}
            </button>
          ))}
        </div>
      )}
      {mode === "years" && (
        <div className="lyra-cal__mgrid">
          {Array.from({ length: 12 }, (_, i) => yearBase + i).map((y) => (
            <button
              type="button"
              key={y}
              className={["lyra-cal__mcell", anchor && anchor.getFullYear() === y && "lyra-cal__mcell--selected"].filter(Boolean).join(" ")}
              onClick={() => { setView(new Date(y, view.getMonth(), 1)); setMode("months"); }}
            >
              {y}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
