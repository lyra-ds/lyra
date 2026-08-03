import React from "react";
import { Popover } from "../primitives/Popover.jsx";

const pad = (n) => String(n).padStart(2, "0");
const toMin = (s) => { if (s == null) return null; const p = String(s).split(":"); return Number(p[0]) * 60 + Number(p[1] || 0); };

/**
 * Campo de hora — trigger no estilo Input + lista rolável de horários.
 * Valor é string "HH:mm" (24h).
 */
export function TimePicker({ label, hint, error, value, defaultValue, onChange, placeholder = "Selecionar hora", step = 30, min = "00:00", max = "23:59", disabled, id, className = "", ...rest }) {
  const [internal, setInternal] = React.useState(defaultValue || null);
  const sel = value !== undefined ? value : internal;
  const [open, setOpen] = React.useState(false);
  const autoId = React.useId();
  const btnId = id || autoId;
  const listRef = React.useRef(null);
  const lo = toMin(min);
  const hi = toMin(max);
  const options = [];
  for (let t = lo; t <= hi; t += step) options.push(`${pad(Math.floor(t / 60))}:${pad(t % 60)}`);
  React.useEffect(() => {
    if (open && listRef.current) {
      const el = listRef.current.querySelector('[aria-selected="true"]');
      if (el) listRef.current.scrollTop = Math.max(0, el.offsetTop - 84);
    }
  }, [open]);
  const pick = (t) => {
    if (value === undefined) setInternal(t);
    onChange && onChange(t);
    setOpen(false);
  };
  const trigger = (
    <button type="button" id={btnId} disabled={disabled} className={["lyra-input", "lyra-datepicker__btn", error && "lyra-input--error"].filter(Boolean).join(" ")}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      <span className={sel ? undefined : "lyra-datepicker__ph"}>{sel || placeholder}</span>
    </button>
  );
  const control = disabled ? (
    <span className="lyra-datepicker">{trigger}</span>
  ) : (
    <Popover className="lyra-datepicker" open={open} onOpenChange={setOpen} trigger={trigger}>
      <div className="lyra-timelist" ref={listRef} role="listbox" aria-label={label || "Horários"}>
        {options.map((t) => (
          <button
            type="button"
            key={t}
            role="option"
            aria-selected={t === sel ? "true" : undefined}
            className={["lyra-timelist__item", t === sel && "lyra-timelist__item--selected"].filter(Boolean).join(" ")}
            onClick={() => pick(t)}
          >
            {t}
          </button>
        ))}
      </div>
    </Popover>
  );
  if (!label && !hint && !error) return <div className={className} {...rest}>{control}</div>;
  return (
    <div className={["lyra-field", className].filter(Boolean).join(" ")} {...rest}>
      {label && <label className="lyra-label" htmlFor={btnId}>{label}</label>}
      {control}
      {error ? <span className="lyra-hint lyra-hint--error">{error}</span> : hint ? <span className="lyra-hint">{hint}</span> : null}
    </div>
  );
}
