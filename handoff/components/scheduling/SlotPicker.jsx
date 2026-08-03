import React from "react";
import { Calendar } from "../forms/Calendar.jsx";
import { Button } from "../buttons/Button.jsx";
import { Icon } from "../icons/Icon.jsx";
import { TimeZonePicker } from "./TimeZonePicker.jsx";

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dayOf = (utcISO, tz) => {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(utcISO));
  return p; // "YYYY-MM-DD"
};
const timeOf = (utcISO, tz, locale) =>
  new Intl.DateTimeFormat(locale, { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(new Date(utcISO));
const longDate = (isoDay, locale) =>
  new Date(isoDay + "T12:00:00").toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });

/**
 * Escolha de data + horário numa página pública de agendamento.
 * Slots chegam em UTC e são exibidos no fuso do visitante; dois passos
 * (slot → Confirmar); estados de loading (skeleton), dia vazio com pulo
 * para o próximo horário livre e contagem visível de reserva temporária.
 */
export function SlotPicker({ slots = [], date, defaultDate, onDateChange, timezone, onTimezoneChange, detectedZone, onConfirm, confirmLabel = "Confirmar", holdExpiresAt, nextAvailableDate, loading = false, emptyMessage = "Sem horários neste dia.", fullMessage = "A agenda está cheia por enquanto.", locale = "pt-BR", min, max, children, className = "", ...rest }) {
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [internalDate, setInternalDate] = React.useState(defaultDate || null);
  const [selected, setSelected] = React.useState(null);
  const [tzOpen, setTzOpen] = React.useState(false);
  const [, tick] = React.useReducer((n) => n + 1, 0);
  React.useEffect(() => {
    if (!holdExpiresAt) return;
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [holdExpiresAt]);

  const byDay = React.useMemo(() => {
    const m = new Map();
    for (const s of slots) {
      const d = dayOf(s.start, tz);
      if (!m.has(d)) m.set(d, []);
      m.get(d).push(s);
    }
    for (const list of m.values()) list.sort((a, b) => new Date(a.start) - new Date(b.start));
    return m;
  }, [slots, tz]);

  const firstDay = byDay.size ? [...byDay.keys()].sort()[0] : null;
  const day = (date !== undefined ? date : internalDate) || firstDay;
  const setDay = (d) => {
    if (date === undefined) setInternalDate(d);
    onDateChange && onDateChange(d);
    setSelected(null);
  };
  const daySlots = (day && byDay.get(day)) || [];
  const holdLeft = holdExpiresAt ? Math.max(0, Math.floor((new Date(holdExpiresAt) - Date.now()) / 1000)) : null;

  return (
    <div className={["lyra-slotpicker", className].filter(Boolean).join(" ")} {...rest}>
      <div className="lyra-slotpicker__side">
        {children}
        <Calendar
          size="md"
          value={day}
          onChange={(d) => setDay(iso(d))}
          min={min}
          max={max}
          isDateDisabled={(d) => !byDay.has(iso(d))}
          renderDayMarker={(d) => (byDay.has(iso(d)) ? <span className="lyra-cal__dot" /> : null)}
        />
        <div className="lyra-slotpicker__tz">
          <Icon name="globe" size={15} />
          {tzOpen || !timezone ? (
            <span style={{ minWidth: 220 }}>
              <TimeZonePicker
                value={tz}
                detectedZone={detectedZone}
                onChange={(v) => { setTzOpen(false); onTimezoneChange && onTimezoneChange(v); }}
              />
            </span>
          ) : (
            <React.Fragment>
              <span>{(TimeZonePicker.ZONES.find((z) => z.value === tz) || {}).label || tz}</span>
              <button type="button" onClick={() => setTzOpen(true)}>alterar</button>
            </React.Fragment>
          )}
        </div>
      </div>
      <div className="lyra-slotpicker__main" aria-live="polite">
        {loading ? (
          <div className="lyra-slotpicker__slots" aria-label="Carregando horários">
            {Array.from({ length: 6 }, (_, i) => <span key={i} className="lyra-slotpicker__skeleton" />)}
          </div>
        ) : byDay.size === 0 ? (
          <div className="lyra-slotpicker__empty">
            <span>{fullMessage}</span>
          </div>
        ) : daySlots.length === 0 ? (
          <div className="lyra-slotpicker__empty">
            <span>{emptyMessage}{nextAvailableDate ? ` Próximo horário livre: ${longDate(nextAvailableDate, locale)}.` : ""}</span>
            {nextAvailableDate && byDay.has(nextAvailableDate) && (
              <Button variant="secondary" size="sm" onClick={() => setDay(nextAvailableDate)}>Ir para {longDate(nextAvailableDate, locale)}</Button>
            )}
          </div>
        ) : (
          <React.Fragment>
            <span className="lyra-slotpicker__daylabel">{longDate(day, locale)}</span>
            <div className="lyra-slotpicker__slots" role="listbox" aria-label={`Horários de ${longDate(day, locale)}`}>
              {daySlots.map((s) =>
                selected && selected.start === s.start ? (
                  <span className="lyra-slotpicker__pair" key={s.start}>
                    <span className="lyra-slotpicker__slot" role="option" aria-selected="true">{timeOf(s.start, tz, locale)}</span>
                    <Button onClick={() => onConfirm && onConfirm(s)}>{confirmLabel}</Button>
                  </span>
                ) : (
                  <button type="button" key={s.start} role="option" aria-selected="false" className="lyra-slotpicker__slot" onClick={() => setSelected(s)}>
                    {timeOf(s.start, tz, locale)}
                  </button>
                )
              )}
            </div>
            {holdLeft !== null && holdLeft > 0 && (
              <span className="lyra-slotpicker__hold">
                <Icon name="timer" size={14} />
                Horário reservado por {Math.floor(holdLeft / 60)}:{String(holdLeft % 60).padStart(2, "0")}
              </span>
            )}
          </React.Fragment>
        )}
      </div>
    </div>
  );
}
