import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BottomNav } from './index';

describe('BottomNav — SSR', () => {
  it('renders item content and active-page semantics without throwing', () => {
    const html = renderToString(
      createElement(BottomNav, {
        items: [
          { id: 'home', icon: createElement('span', null, 'H'), label: 'Home', active: true },
          { id: 'search', icon: createElement('span', null, 'S'), label: 'Search' },
        ],
      }),
    );

    expect(html).toContain('lyra-bottomnav');
    expect(html).toContain('lyra-bottomnav__item--active');
    expect(html).toContain('aria-current="page"');
  });

  it('renders native and composed destinations as links', () => {
    const html = renderToString(
      createElement(BottomNav, {
        items: [
          { id: 'home', icon: 'H', label: 'Home', href: '/home', target: '_blank', active: true },
          {
            id: 'router',
            icon: 'R',
            label: 'Router',
            asChild: createElement('a', { href: '/router' }),
          },
          { id: 'action', icon: 'A', label: 'Action' },
        ],
      }),
    );
    expect(html).toContain('href="/home"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('href="/router"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('<button');
  });
});
