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
  });
});
