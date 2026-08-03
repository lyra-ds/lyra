import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TimeInput } from './index';

describe('TimeInput SSR', () => {
  it('renders without accessing browser globals', () => {
    const html = renderToString(
      createElement(TimeInput, { label: 'Start time', defaultValue: '09:00' }),
    );
    expect(html).toContain('lyra-timeinput');
    expect(html).toContain('value="09:00"');
  });
});
