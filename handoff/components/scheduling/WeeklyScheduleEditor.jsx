import React from "react";
import { TimeInput } from "../forms/TimeInput.jsx";
import { Switch } from "../forms/Switch.jsx";
import { DatePicker } from "../forms/DatePicker.jsx";
import { Popover } from "../primitives/Popover.jsx";
import { Icon } from "../icons/Icon.jsx";
import { Button } from "../buttons/Button.jsx";

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const toMin = (s) => { const p = String(s).split(":"); return Number(p[0]) * 60 + Number(p[1] || 0); };

function CopyMenu({ from, onCopy }) {
  const [open, setOpen] = React.useState(false);
  const [picked, setPicked] = React.useState([]);
  const toggle = (i) => setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  return (
    <Popover
      open={open}
      onOpenChange={(o) => { setOpen(o); if (o) setPicked([]); }}
      trigger={<button type="button" className="lyra-sched__ghostbtn" aria-label={`Copiar horários de ${DAYS[from]} para outros dias`} title="Copiar para…"><Icon name="copy" size={15} /></button>}
    >
      <div className="lyra-sched__copy">
        <span className="lyra-sched__copy-title">Copiar {DAYS[from]} para…</span>
        {DAYS.map((d, i) => i !== from && (
          <label key={d} className="lyra-check-row">
            <input type="checkbox" className="lyra-checkbox" checked={picked.includes(i)} onChange={() => toggle(i)} />
            {d}
          </label>
        ))}
        <Button size="sm" disabled={!picked.length} onClick={() => { onCopy(picked); setOpen(false); }}>Aplicar</Button>
      </div>
    </Popover>
  );
}

/**
 * Editor de janelas semanais de disponibilidade — toggle por dia da
 * semana, pares início–fim (TimeInput), "Copiar para…" e exceções por
 * data. Genérico: agenda de atendimento, horário de funcionamento, plantão.
 */
export function WeeklyScheduleEditor({ value, defaultValue, onChange, exceptions, onExceptionsChange, defaultRange = { start: "09:00", end: "17:00" }, weekStartsOn = 1, showExceptions = true, className = "", ...rest }) {
  const empty = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  const [internal, setInternal] = React.useState(() => ({ ...empty, ...(defaultValue || {}) }));
  const val = value !== undefined ? { ...empty, ...value } : internal;
  const [internalExc, setInternalExc] = React.useState([]);
  const excs = exceptions !== undefined ? exceptions : internalExc;
  const commit = (next) => {
    if (value === undefined) setInternal(next);
    onChange && onChange(next);
  };
  const commitExc = (next) => {
    if (exceptions === undefined) setInternalExc(next);
    onExceptionsChange && onExceptionsChange(next);
  };
  const setDay = (d, ranges) => commit({ ...val, [d]: ranges });
  const order = Array.from({ length: 7 }, (_, i) => (i + weekStartsOn) % 7);
  const invalid = (r) => r.start && r.end && toMin(r.end) <= toMin(r.start);
  return (
    <div className={["lyra-sched", className].filter(Boolean).join(" ")} {...rest}>
      {order.map((d) => {
        const ranges = val[d] || [];
        const on = ranges.length > 0;
        return (
          <div key={d} className="lyra-sched__row">
            <div className="lyra-sched__daycell">
              <Switch checked={on} onChange={(e) => setDay(d, e.target.checked ? [{ ...defaultRange }] : [])} label={DAYS[d]} />
            </div>
            {on ? (
              <div className="lyra-sched__ranges">
                {ranges.map((r, i) => (
                  <div key={i}>
                    <div className="lyra-sched__range">
                      <TimeInput aria-label={`${DAYS[d]} — início`} value={r.start} onChange={(t) => setDay(d, ranges.map((x, j) => (j === i ? { ...x, start: t } : x)))} />
                      <span className="lyra-sched__dash">–</span>
                      <TimeInput aria-label={`${DAYS[d]} — fim`} value={r.end} invalid={invalid(r)} onChange={(t) => setDay(d, ranges.map((x, j) => (j === i ? { ...x, end: t } : x)))} />
                      {ranges.length > 1 && (
                        <button type="button" className="lyra-sched__ghostbtn" aria-label="Remover intervalo" onClick={() => setDay(d, ranges.filter((_, j) => j !== i))}>
                          <Icon name="x" size={15} />
                        </button>
                      )}
                    </div>
                    {invalid(r) && <span className="lyra-sched__error">O fim precisa ser depois do início.</span>}
                  </div>
                ))}
                <button type="button" className="lyra-sched__addrange" onClick={() => {
                  const last = ranges[ranges.length - 1];
                  const start = last ? last.end : defaultRange.start;
                  setDay(d, [...ranges, { start, end: start >= "22:00" ? "23:59" : `${String(Math.min(23, Number(start.split(":")[0]) + 2)).padStart(2, "0")}:${start.split(":")[1]}` }]);
                }}>+ Adicionar intervalo</button>
              </div>
            ) : (
              <span className="lyra-sched__off">Indisponível</span>
            )}
            <div className="lyra-sched__actions">
              {on && <CopyMenu from={d} onCopy={(days) => {
                const next = { ...val };
                days.forEach((t) => { next[t] = ranges.map((r) => ({ ...r })); });
                commit(next);
              }} />}
            </div>
          </div>
        );
      })}
      {showExceptions && (
        <div className="lyra-sched__exc">
          <span className="lyra-label">Exceções</span>
          {excs.map((e, i) => (
            <div key={e.date} className="lyra-sched__exc-row">
              <span className="lyra-sched__exc-date">{new Date(e.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}</span>
              <span>{e.ranges && e.ranges.length ? e.ranges.map((r) => `${r.start}–${r.end}`).join(", ") : "Indisponível o dia todo"}</span>
              <button type="button" className="lyra-sched__ghostbtn" aria-label="Remover exceção" onClick={() => commitExc(excs.filter((_, j) => j !== i))}>
                <Icon name="x" size={15} />
              </button>
            </div>
          ))}
          <div style={{ maxWidth: 232 }}>
            <DatePicker placeholder="Adicionar exceção…" value={null} onChange={(d) => {
              const isoD = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              if (!excs.some((e) => e.date === isoD)) commitExc([...excs, { date: isoD, ranges: [] }].sort((a, b) => a.date.localeCompare(b.date)));
            }} min={new Date()} />
          </div>
        </div>
      )}
    </div>
  );
}
