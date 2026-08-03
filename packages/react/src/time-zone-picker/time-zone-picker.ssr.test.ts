import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TimeZonePicker } from './index';

describe('TimeZonePicker — SSR', () => {
  it('renders its composed Combobox without accessing browser globals', () => {
    const html = renderToString(
      createElement(TimeZonePicker, {
        label: 'Time zone',
        defaultValue: 'America/New_York',
        zones: [{ value: 'America/New_York', label: 'New York', region: 'Americas' }],
        referenceDate: '2024-01-15',
      }),
    );

    expect(html).toContain('lyra-tzpicker');
    expect(html).toContain('New York (GMT-5)');
  });
});
