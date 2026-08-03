import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DatePicker } from './index';

describe('DatePicker — SSR', () => {
  it('renders its trigger without accessing matchMedia on the server', () => {
    const html = renderToString(
      createElement(DatePicker, {
        defaultValue: '2024-05-15',
        label: 'Start date',
        locale: 'en-US',
      }),
    );

    expect(html).toContain('lyra-datepicker');
    expect(html).toContain('Start date');
  });
});
