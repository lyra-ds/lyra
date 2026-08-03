import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Calendar } from './index';

describe('Calendar — SSR', () => {
  it('renders a locale-aware month without browser globals', () => {
    const html = renderToString(createElement(Calendar, { defaultValue: '2024-05-15' }));
    expect(html).toContain('lyra-cal');
    expect(html).toContain('May');
  });
});
