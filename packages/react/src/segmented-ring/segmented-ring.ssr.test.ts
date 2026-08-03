import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SegmentedRing } from './index';

describe('SegmentedRing SSR', () => {
  it('renders without accessing browser globals', () => {
    const html = renderToString(
      createElement(SegmentedRing, {
        centerLabel: 'Sessions',
        centerValue: '5',
        segments: [{ value: 5, label: 'Completed', tone: 'success' }],
      }),
    );
    expect(html).toContain('lyra-ring');
    expect(html).toContain('aria-hidden="true"');
  });
});
