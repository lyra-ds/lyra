import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DateRangePicker } from './index';

describe('DateRangePicker — SSR', () => {
  it('renders a local range trigger without accessing matchMedia on the server', () => {
    const html = renderToString(
      createElement(DateRangePicker, {
        defaultValue: { start: '2024-05-10', end: '2024-05-15' },
        label: 'Travel dates',
        locale: 'en-US',
      }),
    );

    expect(html).toContain('lyra-datepicker');
    expect(html).toContain('Travel dates');
    expect(html).toContain('aria-label="5/10/2024 to 5/15/2024"');
  });

  it('keeps the placeholder and incomplete trigger names unchanged', () => {
    const empty = renderToString(createElement(DateRangePicker));
    const incomplete = renderToString(
      createElement(DateRangePicker, {
        value: { start: new Date(2024, 4, 10), end: null },
        locale: 'en-US',
      }),
    );

    expect(empty).toContain('Select period');
    expect(empty).not.toContain('aria-label=');
    expect(incomplete).toContain('5/10/2024 – …');
    expect(incomplete).not.toContain('aria-label=');
  });
});
