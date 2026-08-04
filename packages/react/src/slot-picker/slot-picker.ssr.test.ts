import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SlotPicker } from './index';

describe('SlotPicker — SSR', () => {
  it('renders UTC slots in an explicitly supplied IANA display zone', () => {
    const html = renderToString(
      createElement(SlotPicker, {
        timezone: 'America/New_York',
        defaultDate: '2026-08-03',
        slots: [{ start: '2026-08-04T02:00:00Z', end: '2026-08-04T03:00:00Z' }],
      }),
    );

    expect(html).toContain('lyra-slotpicker');
    expect(html).toContain('10:00 PM');
  });
});
