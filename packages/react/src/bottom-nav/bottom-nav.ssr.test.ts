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
});
