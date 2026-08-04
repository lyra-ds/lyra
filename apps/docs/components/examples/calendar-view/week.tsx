import { CalendarView } from '@lyra-ds/react';

export function CalendarViewWeek() {
  return (
    <CalendarView
      defaultDate="2026-08-03"
      events={[
        {
          id: 'session',
          kind: 'session',
          start: '2026-08-03T09:00',
          end: '2026-08-03T10:00',
          title: 'Design review',
        },
        {
          id: 'program',
          kind: 'program-session',
          start: '2026-08-04T11:00',
          end: '2026-08-04T12:30',
          title: 'Onboarding',
        },
        {
          id: 'pending',
          kind: 'pending',
          start: '2026-08-05T14:00',
          end: '2026-08-05T15:00',
          title: 'Awaiting approval',
        },
        {
          id: 'block',
          kind: 'block',
          start: '2026-08-06T12:00',
          end: '2026-08-06T13:00',
          title: 'Focus time',
        },
        {
          id: 'external',
          kind: 'external',
          start: '2026-08-07T16:00',
          end: '2026-08-07T17:00',
          title: 'External calendar',
        },
      ]}
      availability={{
        1: [{ start: '09:00', end: '17:00' }],
        2: [{ start: '09:00', end: '17:00' }],
      }}
    />
  );
}
