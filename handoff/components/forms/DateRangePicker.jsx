import React from "react";
import { Popover } from "../primitives/Popover.jsx";
import { BottomSheet } from "../feedback/BottomSheet.jsx";
import { Calendar } from "./Calendar.jsx";

const fmt = (d) => (d ? d.toLocaleDateString("pt-BR") : null);
const toDate = (v) => (v == null ? null : v instanceof Date ? v : new Date(String(v) + "T00:00:00"));
const useMobileDR = () => {
  const [m, setM] = React.useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches);
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const fn = (e) => setM(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return m;
};

/**
 * Campo de intervalo de datas — trigger no estilo Input + Calendar em modo
 * range. Em telas ≤640px abre em BottomSheet em vez de Popover.
 */
export function DateRangePicker({ label, hint, error, value, defaultValue, onChange, placeholder = "Selecionar período", min, max, disabled, id, className = "", ...rest }) {
  const norm = (v) => ({ start: toDate(v && v.start), end: toDate(v && v.end) });
  const [internal, setInternal] = React.useState(() => norm(defaultValue));
  const sel = value !== undefined ? norm(value) : internal;
  const [open, setOpen] = React.useState(false);
  const mobile = useMobileDR();
  const autoId = React.useId();
  const btnId = id || autoId;
  const text = sel.start ? `${fmt(sel.start)} – ${sel.end ? fmt(sel.end) : "…"}` : null;
  const handle = (next) => {
    if (value === undefined) setInternal(next);
    onChange && onChange(next);
    if (next.start && next.end) setOpen(false);
  };
  const trigger = (
    <button type="button" id={btnId} disabled={disabled} className={["lyra-input", "lyra-datepicker__btn", error && "lyra-input--error"].filter(Boolean).join(" ")}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 2v4M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
      <span className={text ? undefined : "lyra-datepicker__ph"}>{text || placeholder}</span>
    </button>
  );
  const cal = <Calendar range value={sel} min={min} max={max} onChange={handle} />;
  const control = disabled ? (
    <span className="lyra-datepicker">{trigger}</span>
  ) : mobile ? (
    <React.Fragment>
      <span className="lyra-datepicker" onClick={() => setOpen(true)}>{trigger}</span>
      <BottomSheet open={open} onClose={() => setOpen(false)} title={label || "Selecionar período"}>
        <div className="lyra-cal--sheet">{cal}</div>
      </BottomSheet>
    </React.Fragment>
  ) : (
    <Popover className="lyra-datepicker" open={open} onOpenChange={setOpen} trigger={trigger}>{cal}</Popover>
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
