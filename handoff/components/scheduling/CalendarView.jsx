import React from "react";
import { Icon } from "../icons/Icon.jsx";

const HOUR_H = 48;
const toDate = (v) => (v instanceof Date ? new Date(v) : new Date(String(v).length <= 10 ? v + "T00:00:00" : v));
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const sameDay = (a, b) => iso(a) === iso(b);
const mins = (d) => d.getHours() * 60 + d.getMinutes();
const hhmm = (d) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
const toMin = (s) => { const p = s.split(":"); return Number(p[0]) * 60 + Number(p[1] || 0); };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const KIND_M = {
  session: { bg: "var(--accent-soft)", fg: "var(--accent-soft-text)" },
  "program-session": { bg: "var(--success-soft)", fg: "var(--success-text)" },
  pending: { bg: "var(--surface-sunken)", fg: "var(--text-secondary)" },
  block: { bg: "var(--surface-sunken)", fg: "var(--text-muted)" },
  external: { bg: "transparent", fg: "var(--text-muted)" },
};

/**
 * Agenda dia/semana/mês — grade de horas com janelas de disponibilidade,
 * linha "agora", chips por tipo (nunca só cor: sólido/tracejado/hachura/
 * contorno) e popover de resumo antes de qualquer ação.
 */
export function CalendarView({ view, defaultView = "week", onViewChange, date, defaultDate, onDateChange, events = [], availability, startHour = 7, endHour = 21, weekStartsOn = 1, onEventOpen, renderEventPopover, onSlotCreate, slotStep = 30, toolbarActions, locale = "pt-BR", className = "", ...rest }) {
  const [iView, setIView] = React.useState(defaultView);
  const [iDate, setIDate] = React.useState(() => iso(defaultDate ? toDate(defaultDate) : new Date()));
  const [pop, setPop] = React.useState(null); // { evt, top, left }
  const scrollRef = React.useRef(null);
  const v = view !== undefined ? view : iView;
  const anchor = toDate(date !== undefined ? date : iDate);
  const setV = (nv) => { if (view === undefined) setIView(nv); onViewChange && onViewChange(nv); setPop(null); };
  const setD = (d) => { const s = iso(d); if (date === undefined) setIDate(s); onDateChange && onDateChange(s); setPop(null); };

  React.useEffect(() => {
    if (!pop) return;
    const close = (e) => { if (!e.target.closest || !e.target.closest(".lyra-calview__pop")) setPop(null); };
    const esc = (e) => { if (e.key === "Escape") setPop(null); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [pop]);

  const days = React.useMemo(() => {
    if (v === "day") return [new Date(anchor)];
    if (v === "week") {
      const start = new Date(anchor);
      start.setDate(start.getDate() - ((start.getDay() - weekStartsOn + 7) % 7));
      return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
    }
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - ((first.getDay() - weekStartsOn + 7) % 7));
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [v, iso(anchor), weekStartsOn]);

  const nav = (dir) => {
    const d = new Date(anchor);
    if (v === "day") d.setDate(d.getDate() + dir);
    else if (v === "week") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setD(d);
  };

  const title = v === "month"
    ? cap(anchor.toLocaleDateString(locale, { month: "long", year: "numeric" }))
    : v === "day"
      ? cap(anchor.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" }))
      : `${days[0].toLocaleDateString(locale, { day: "numeric", month: "short" })} – ${days[6].toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}`.replace(/\./g, "");

  const evts = React.useMemo(() => events.map((e) => ({ ...e, _s: toDate(e.start), _e: toDate(e.end) })), [events]);
  const openEvt = (e, evt) => {
    e.stopPropagation();
    if (onEventOpen) onEventOpen(evt);
    if (!renderEventPopover) return;
    const scroller = scrollRef.current;
    const chip = e.currentTarget.getBoundingClientRect();
    const box = scroller.getBoundingClientRect();
    setPop({
      evt,
      top: chip.top - box.top + scroller.scrollTop + Math.min(chip.height, 32),
      left: Math.min(chip.left - box.left + 8, box.width - 240),
    });
  };
  const now = new Date();
  const gridH = (endHour - startHour) * HOUR_H;

  const timeGrid = (
    <React.Fragment>
      <div className="lyra-calview__head" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
        <span />
        {days.map((d) => (
          <span key={iso(d)} className={["lyra-calview__head-cell", sameDay(d, now) && "lyra-calview__head-cell--today"].filter(Boolean).join(" ")}>
            {d.toLocaleDateString(locale, { weekday: "short" }).replace(".", "")}
            <strong>{d.getDate()}</strong>
          </span>
        ))}
      </div>
      <div className="lyra-calview__scroll" ref={scrollRef}>
        <div className="lyra-calview__grid" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
          <div className="lyra-calview__ruler" style={{ height: gridH }}>
            {Array.from({ length: endHour - startHour }, (_, i) => (
              <span key={i} className="lyra-calview__hour" style={{ top: i * HOUR_H }}>{String(startHour + i).padStart(2, "0")}:00</span>
            ))}
          </div>
          {days.map((d) => {
            const windows = (availability && availability[d.getDay()]) || null;
            const dayEvts = evts.filter((ev) => sameDay(ev._s, d));
            return (
              <div
                key={iso(d)}
                className="lyra-calview__col"
                style={{ height: gridH, backgroundSize: `100% ${HOUR_H}px` }}
                onClick={(e) => {
                  if (!onSlotCreate || pop) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const m = startHour * 60 + Math.floor(((e.clientY - rect.top) / HOUR_H) * 60 / slotStep) * slotStep;
                  const dt = new Date(d);
                  dt.setHours(Math.floor(m / 60), m % 60, 0, 0);
                  onSlotCreate(dt);
                }}
              >
                {windows && windows.map((w, i) => {
                  const top = ((toMin(w.start) - startHour * 60) / 60) * HOUR_H;
                  const h = ((toMin(w.end) - toMin(w.start)) / 60) * HOUR_H;
                  return <span key={i} className="lyra-calview__avail" style={{ top, height: h }} />;
                })}
                {sameDay(d, now) && mins(now) > startHour * 60 && mins(now) < endHour * 60 && (
                  <span className="lyra-calview__now" style={{ top: ((mins(now) - startHour * 60) / 60) * HOUR_H }} />
                )}
                {dayEvts.map((ev) => {
                  const top = ((mins(ev._s) - startHour * 60) / 60) * HOUR_H;
                  const h = Math.max(20, ((ev._e - ev._s) / 3600000) * HOUR_H - 2);
                  return (
                    <button
                      type="button"
                      key={ev.id}
                      className={`lyra-calview__evt lyra-calview__evt--${ev.kind || "session"}`}
                      style={{ top: top + 1, height: h }}
                      aria-label={`${cap(ev._s.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" }))}, ${hhmm(ev._s)} — ${ev.title}`}
                      onClick={(e) => openEvt(e, ev)}
                    >
                      <span className="lyra-calview__evt-time">{hhmm(ev._s)}–{hhmm(ev._e)}</span>
                      {h >= 34 && <span className="lyra-calview__evt-title">{ev.title}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        {pop && renderEventPopover && (
          <div className="lyra-calview__pop" style={{ top: pop.top, left: pop.left }} role="dialog" aria-label={pop.evt.title}>
            {renderEventPopover(pop.evt, () => setPop(null))}
          </div>
        )}
      </div>
    </React.Fragment>
  );

  const monthGrid = (
    <div className="lyra-calview__mgrid">
      {days.slice(0, 7).map((d) => (
        <span key={iso(d)} className="lyra-calview__head-cell">{d.toLocaleDateString(locale, { weekday: "short" }).replace(".", "")}</span>
      ))}
      {days.map((d) => {
        const dayEvts = evts.filter((ev) => sameDay(ev._s, d));
        return (
          <button type="button" key={iso(d)} className={[
            "lyra-calview__mcell",
            d.getMonth() !== anchor.getMonth() && "lyra-calview__mcell--out",
            sameDay(d, now) && "lyra-calview__mcell--today",
          ].filter(Boolean).join(" ")} onClick={() => { setD(d); setV("day"); }}>
            <span className="lyra-calview__mday">{d.getDate()}</span>
            {dayEvts.slice(0, 3).map((ev) => {
              const m = KIND_M[ev.kind] || KIND_M.session;
              return <span key={ev.id} className="lyra-calview__mevt" style={{ background: m.bg, color: m.fg }}>{hhmm(ev._s)} {ev.title}</span>;
            })}
            {dayEvts.length > 3 && <span className="lyra-calview__more">+{dayEvts.length - 3}</span>}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={["lyra-calview", className].filter(Boolean).join(" ")} {...rest}>
      <div className="lyra-calview__toolbar">
        <button type="button" className="lyra-calview__nav" aria-label="Anterior" onClick={() => nav(-1)}><Icon name="chevron-left" size={16} /></button>
        <button type="button" className="lyra-calview__nav" aria-label="Hoje" title="Hoje" onClick={() => setD(new Date())}><Icon name="circle-dot" size={14} /></button>
        <button type="button" className="lyra-calview__nav" aria-label="Próximo" onClick={() => nav(1)}><Icon name="chevron-right" size={16} /></button>
        <span className="lyra-calview__title">{title}</span>
        <span className="lyra-calview__seg" role="group" aria-label="Visão">
          {[["day", "Dia"], ["week", "Semana"], ["month", "Mês"]].map(([id, lbl]) => (
            <button type="button" key={id} aria-pressed={v === id} onClick={() => setV(id)}>{lbl}</button>
          ))}
        </span>
        {toolbarActions}
      </div>
      {v === "month" ? monthGrid : timeGrid}
    </div>
  );
}
