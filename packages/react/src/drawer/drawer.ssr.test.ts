import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Drawer } from './index';

describe('Drawer — SSR', () => {
  it('renders no markup for an open drawer because Portal is server guarded', () => {
    const html = renderToString(
      createElement(Drawer, { open: true, title: 'Server', children: 'Drawer body' }),
    );
    expect(html).not.toContain('lyra-drawer');
    expect(html).not.toContain('Drawer body');
  });

  it('renders no markup for a closed drawer and never accesses browser globals', () => {
    expect(() =>
      renderToString(createElement(Drawer, { open: false, title: 'Closed', children: 'Body' })),
    ).not.toThrow();
  });
});
