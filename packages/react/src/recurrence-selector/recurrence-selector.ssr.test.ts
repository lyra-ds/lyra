import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RecurrenceSelector, describeRecurrence } from './index';

describe('RecurrenceSelector — SSR', () => {
  it('renders the selector and derives complete recurrence sentences from label templates', () => {
    const html = renderToString(
      createElement(RecurrenceSelector, {
        defaultValue: { freq: 'weekly', interval: 1, byWeekday: [1] },
        startDate: '2026-08-03',
      }),
    );

    expect(html).toContain('lyra-recur');
    expect(describeRecurrence({ freq: 'weekly', interval: 2, byWeekday: [1] }, '2026-08-03')).toBe(
      'Repeats every 2 weeks on Monday',
    );
    expect(describeRecurrence({ freq: 'monthly', interval: 2 }, '2026-08-03')).toBe(
      'Repeats every 2 months on the 1st Monday',
    );
    expect(
      describeRecurrence(
        { freq: 'monthly', interval: 3, end: { type: 'date', date: '2026-12-31' } },
        '2026-08-03',
      ),
    ).toBe('Repeats every 3 months on the 1st Monday, until Dec 31, 2026');
  });
});
