import React from "react";

const pad = (n) => String(n).padStart(2, "0");
const toMin = (s) => { if (s == null || s === "") return null; const p = String(s).split(":"); return Number(p[0]) * 60 + Number(p[1] || 0); };
const toStr = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
/** Aceita "9", "09", "930", "0930", "9:5", "09:30" → "HH:mm" ou null */
const parse = (raw) => {
  const t = String(raw).trim().replace(/[hH]/, ":");
  if (!t) return null;
  let h, m;
  if (t.includes(":")) { const p = t.split(":"); h = Number(p[0]); m = Number(p[1] || 0); }
  else if (t.length <= 2) { h = Number(t); m = 0; }
  else { h = Number(t.slice(0, t.length - 2)); m = Number(t.slice(-2)); }
  if (!Number.isFinite(h) || !Number.isFinite(m) || h > 23 || m > 59 || h < 0 || m < 0) return undefined;
  return toStr(h * 60 + m);
};
const chev = (up) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={up ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6"} /></svg>
);

/**
 * Entrada de horário "HH:mm" — digitação mascarada + stepper.
 * Digitação livre ("9", "0930", "9:5") normalizada no blur/Enter;
 * ↑/↓ = ±step, Shift+↑/↓ = ±1h. Para pares início–fim (disponibilidade).
 */
export function TimeInput({ label, hint, error, value, defaultValue, onChange, step = 15, min, max, size = "md", invalid, disabled, placeholder = "--:--", id, className = "", ...rest }) {
  const [internal, setInternal] = React.useState(defaultValue ?? null);
  const val = value !== undefined ? value : internal;
  const [text, setText] = React.useState(val || "");
  const [bad, setBad] = React.useState(false);
  React.useEffect(() => { setText(val || ""); setBad(false); }, [val]);
  const autoId = React.useId();
  const inputId = id || autoId;
  const lo = toMin(min);
  const hi = toMin(max);
  const clamp = (m) => Math.min(hi ?? 1439, Math.max(lo ?? 0, m));
  const commit = (v) => {
    if (value === undefined) setInternal(v);
    onChange && onChange(v);
  };
  const normalize = (raw) => {
    const p = parse(raw);
    if (p === undefined) { setBad(true); return; } /* preserva o texto errado — nunca limpa */
    setBad(false);
    if (p === null) return commit(null);
    const v = toStr(clamp(toMin(p)));
    setText(v);
    commit(v);
  };
  const bump = (delta) => {
    const base = toMin(parse(text) || val) ?? clamp(new Date().getHours() * 60);
    const v = toStr(clamp(base + delta));
    setText(v); setBad(false); commit(v);
  };
  const onKeyDown = (e) => {
    if (e.key === "ArrowUp") { e.preventDefault(); bump(e.shiftKey ? 60 : step); }
    else if (e.key === "ArrowDown") { e.preventDefault(); bump(e.shiftKey ? -60 : -step); }
    else if (e.key === "Enter") normalize(e.target.value);
  };
  const isErr = Boolean(error || invalid || bad);
  const control = (
    <span className="lyra-timeinput">
      <input
        id={inputId}
        className={["lyra-input", size !== "md" && `lyra-input--${size}`, isErr && "lyra-input--error"].filter(Boolean).join(" ")}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={text}
        disabled={disabled}
        aria-invalid={isErr || undefined}
        aria-valuetext={val ? `${Number(val.split(":")[0])} horas e ${Number(val.split(":")[1])} minutos` : undefined}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => normalize(e.target.value)}
        onKeyDown={onKeyDown}
        {...rest}
      />
      <span className="lyra-timeinput__steppers" aria-hidden={disabled || undefined}>
        <button type="button" tabIndex={-1} className="lyra-timeinput__step" aria-label="Mais tarde" onClick={() => bump(step)} disabled={disabled}>{chev(true)}</button>
        <button type="button" tabIndex={-1} className="lyra-timeinput__step" aria-label="Mais cedo" onClick={() => bump(-step)} disabled={disabled}>{chev(false)}</button>
      </span>
    </span>
  );
  if (!label && !hint && !error) return <div className={className}>{control}</div>;
  return (
    <div className={["lyra-field", className].filter(Boolean).join(" ")}>
      {label && <label className="lyra-label" htmlFor={inputId}>{label}</label>}
      {control}
      {error ? <span className="lyra-hint lyra-hint--error">{error}</span> : hint ? <span className="lyra-hint">{hint}</span> : null}
    </div>
  );
}
