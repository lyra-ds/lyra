import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CalendarView } from './index';

describe('CalendarView — SSR', () => {
  it('renders a local week without reading DOM measurements on the server', () => {
    const html = renderToString(
      createElement(CalendarView, {
        defaultDate: '2026-08-03',
        events: [
          {
            id: 'session',
            start: '2026-08-03T10:00',
            end: '2026-08-03T11:00',
            title: 'Maya',
          },
        ],
      }),
    );

    expect(html).toContain('lyra-calview');
    expect(html).toContain('Maya');
  });
});
