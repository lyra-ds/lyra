import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TimePicker } from './index';

describe('TimePicker — SSR', () => {
  it('renders its trigger without accessing browser globals', () => {
    const html = renderToString(
      createElement(TimePicker, { defaultValue: '09:30', label: 'Meeting time' }),
    );

    expect(html).toContain('lyra-datepicker');
    expect(html).toContain('Meeting time');
  });
});
