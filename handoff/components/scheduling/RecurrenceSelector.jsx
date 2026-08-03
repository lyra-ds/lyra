import React from "react";
import { DatePicker } from "../forms/DatePicker.jsx";

const WD_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const WD_LONG = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const nth = (date) => Math.floor((date.getDate() - 1) / 7) + 1;
const toDate = (v) => (v instanceof Date ? v : new Date(String(v) + "T12:00:00"));
const fmt = (d) => toDate(d).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" }).replace(/\./g, "");

/** Frase em linguagem natural — sempre montada inteira, nunca concatenada por partes soltas */
export function describeRecurrence(rule, startDate) {
  if (!rule || rule.freq === "none") return "Não se repete";
  const days = (rule.byWeekday && rule.byWeekday.length ? rule.byWeekday : [toDate(startDate).getDay()])
    .slice().sort().map((d) => WD_LONG[d]);
  const dayStr = days.length === 1 ? days[0] : days.slice(0, -1).join(", ") + " e " + days[days.length - 1];
  let base;
  if (rule.freq === "weekly" && (rule.interval || 1) === 1) base = `Repete toda ${dayStr}`;
  else if (rule.freq === "weekly") base = `Repete a cada ${rule.interval} semanas na ${dayStr}`;
  else base = `Repete todo mês na ${nth(toDate(startDate))}ª ${WD_LONG[toDate(startDate).getDay()]}`;
  const end = rule.end || { type: "never" };
  if (end.type === "count") return `${base}, ${end.count} vezes`;
  if (end.type === "date") return `${base}, até ${fmt(end.date)}`;
  return base;
}

/**
 * Seletor de recorrência — presets primeiro ("Toda semana", "A cada 2
 * semanas"…), editor personalizado só se necessário, e resumo em
 * linguagem natural sempre visível (aria-live).
 */
export function RecurrenceSelector({ value, defaultValue, onChange, startDate = new Date(), defaultEndCount, conflicts = [], className = "", ...rest }) {
  const start = toDate(startDate);
  const wd = start.getDay();
  const none = { freq: "none", interval: 1, byWeekday: [], end: { type: "never" } };
  const [internal, setInternal] = React.useState(defaultValue || none);
  const rule = value !== undefined ? (value || none) : internal;
  const [custom, setCustom] = React.useState(false);
  const commit = (next) => {
    if (value === undefined) setInternal(next);
    onChange && onChange(next);
  };
  const defEnd = defaultEndCount ? { type: "count", count: defaultEndCount } : { type: "never" };
  const presets = [
    { id: "none", label: "Não se repete", rule: none },
    { id: "weekly", label: `Toda semana (${WD_SHORT[wd]})`, rule: { freq: "weekly", interval: 1, byWeekday: [wd], end: defEnd } },
    { id: "biweekly", label: `A cada 2 semanas (${WD_SHORT[wd]})`, rule: { freq: "weekly", interval: 2, byWeekday: [wd], end: defEnd } },
    { id: "monthly", label: `Todo mês (${nth(start)}ª ${WD_LONG[wd]})`, rule: { freq: "monthly", interval: 1, byWeekday: [wd], end: defEnd } },
  ];
  const match = presets.find((p) =>
    p.rule.freq === rule.freq && p.rule.interval === (rule.interval || 1) &&
    String((p.rule.byWeekday || []).slice().sort()) === String((rule.byWeekday || []).slice().sort())
  );
  const selectValue = custom ? "custom" : match ? match.id : "custom";
  const end = rule.end || { type: "never" };
  const setEnd = (e) => commit({ ...rule, end: e });
  const toggleDay = (d) => {
    const cur = rule.byWeekday || [];
    const next = cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d];
    if (!next.length) return; /* pelo menos um dia */
    commit({ ...rule, byWeekday: next });
  };
  return (
    <div className={["lyra-recur", className].filter(Boolean).join(" ")} {...rest}>
      <span className="lyra-select-wrap">
        <select
          className="lyra-input"
          aria-label="Recorrência"
          value={selectValue}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "custom") { setCustom(true); if (rule.freq === "none") commit({ freq: "weekly", interval: 1, byWeekday: [wd], end: defEnd }); }
            else { setCustom(false); commit(presets.find((p) => p.id === v).rule); }
          }}
        >
          {presets.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          <option value="custom">Personalizado…</option>
        </select>
      </span>
      {(custom || (!match && rule.freq !== "none")) && (
        <div className="lyra-recur__custom">
          <div className="lyra-recur__freqrow">
            <span>Repetir a cada</span>
            <input
              type="number" min={1} max={12} className="lyra-input" aria-label="Intervalo"
              value={rule.interval || 1}
              onChange={(e) => commit({ ...rule, interval: Math.max(1, Number(e.target.value) || 1) })}
            />
            <span className="lyra-select-wrap">
              <select className="lyra-input" aria-label="Frequência" value={rule.freq === "monthly" ? "monthly" : "weekly"} onChange={(e) => commit({ ...rule, freq: e.target.value })}>
                <option value="weekly">semana(s)</option>
                <option value="monthly">mês(es)</option>
              </select>
            </span>
          </div>
          {rule.freq !== "monthly" && (
            <div className="lyra-recur__days" role="group" aria-label="Dias da semana">
              {WD_SHORT.map((d, i) => (
                <button type="button" key={d} aria-pressed={(rule.byWeekday || []).includes(i)}
                  className={["lyra-recur__day", (rule.byWeekday || []).includes(i) && "lyra-recur__day--on"].filter(Boolean).join(" ")}
                  onClick={() => toggleDay(i)}
                >{d}</button>
              ))}
            </div>
          )}
          <div className="lyra-recur__endrow">
            <span className="lyra-select-wrap" style={{ width: 170 }}>
              <select className="lyra-input" aria-label="Término" value={end.type}
                onChange={(e) => {
                  const t = e.target.value;
                  setEnd(t === "never" ? { type: "never" } : t === "count" ? { type: "count", count: end.count || defaultEndCount || 8 } : { type: "date", date: end.date || null });
                }}
              >
                <option value="never">Nunca termina</option>
                <option value="count">Após N vezes</option>
                <option value="date">Em uma data</option>
              </select>
            </span>
            {end.type === "count" && (
              <React.Fragment>
                <input type="number" min={1} max={99} className="lyra-input" aria-label="Número de ocorrências"
                  value={end.count || 8} onChange={(e) => setEnd({ type: "count", count: Math.max(1, Number(e.target.value) || 1) })} />
                <span style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>vezes</span>
              </React.Fragment>
            )}
            {end.type === "date" && (
              <span className="lyra-recur__enddate">
                <DatePicker value={end.date} min={start} onChange={(d) => setEnd({ type: "date", date: d })} placeholder="Data final" />
              </span>
            )}
          </div>
        </div>
      )}
      <span className="lyra-recur__summary" aria-live="polite">{describeRecurrence(rule, start)}</span>
      {conflicts.length > 0 && (
        <span className="lyra-recur__summary" style={{ background: "var(--warning-soft)", color: "var(--warning-text)" }} role="status">
          {conflicts.length === 1 ? "1 ocorrência cai em horário indisponível" : `${conflicts.length} ocorrências caem em horários indisponíveis`} — você pode ajustá-las depois.
        </span>
      )}
    </div>
  );
}
