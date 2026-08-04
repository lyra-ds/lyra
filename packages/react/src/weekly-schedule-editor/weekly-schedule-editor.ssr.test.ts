import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { WeeklyScheduleEditor } from './index';

describe('WeeklyScheduleEditor — SSR', () => {
  it('renders the local-time weekly editor without browser globals', () => {
    const html = renderToString(
      createElement(WeeklyScheduleEditor, {
        defaultValue: { 1: [{ start: '09:00', end: '17:00' }] },
        showExceptions: false,
      }),
    );

    expect(html).toContain('lyra-sched');
    expect(html).toContain('Monday');
  });
});
