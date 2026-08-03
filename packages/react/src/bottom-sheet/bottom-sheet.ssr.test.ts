import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BottomSheet } from './index';

describe('BottomSheet — SSR', () => {
  it('renders no markup for an open sheet because Portal is server guarded', () => {
    const html = renderToString(
      createElement(BottomSheet, { open: true, title: 'Server', children: 'Sheet body' }),
    );

    expect(html).not.toContain('lyra-bottomsheet');
    expect(html).not.toContain('Sheet body');
  });

  it('renders no markup for a closed sheet and never accesses browser globals', () => {
    expect(() =>
      renderToString(
        createElement(BottomSheet, {
          open: false,
          'aria-label': 'Server sheet',
          children: 'Body',
        }),
      ),
    ).not.toThrow();
  });
});
