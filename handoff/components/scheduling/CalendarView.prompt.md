# CalendarView

Agenda dia/semana/mês — grade de horas com disponibilidade, linha "agora", chips por tipo e popover de resumo. O centro de qualquer produto de agendamento.

```jsx
<CalendarView
  defaultView="week"
  events={[
    { id: 1, kind: "session", start: "2026-08-03T10:00", end: "2026-08-03T11:00", title: "Ana Lima" },
    { id: 2, kind: "pending", start: "2026-08-04T14:00", end: "2026-08-04T15:00", title: "Aguardando" },
    { id: 3, kind: "block", start: "2026-08-05T12:00", end: "2026-08-05T13:30", title: "Almoço" },
  ]}
  availability={{ 1: [{ start: "09:00", end: "18:00" }], 2: [{ start: "09:00", end: "18:00" }] }}
  renderEventPopover={(evt, close) => <MyEventSummary evt={evt} onClose={close} />}
  onSlotCreate={(start) => openNewSessionModal(start)}
  toolbarActions={<Button size="sm">Nova sessão</Button>}
/>
```

- Tipos por **forma + cor**, nunca só cor: `session` sólido accent · `program-session` sólido success · `pending` tracejado · `block` hachura · `external` contorno.
- Disponibilidade pinta fundo claro dentro das janelas, `--surface-sunken` fora.
- Popover antes da ação: `renderEventPopover` recebe o evento; edição pesada abre modal no app.
- Mês: visão de chips (máx. 3 + "+n"); clique no dia leva à visão Dia.
- Drag para reagendar e teclado avançado (setas na grade) ficam no app/roadmap — toda edição deve existir via popover → modal.
- Mobile: prefira `defaultView="day"`; reagendamento via sheet do evento, sem drag.
