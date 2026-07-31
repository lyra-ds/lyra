import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { NavLink } from './index';

describe('NavLink SSR', () => {
  it('renders an active link without throwing', () =>
    expect(
      renderToString(createElement(NavLink, { href: '/docs', active: true }, 'Docs')),
    ).toContain('aria-current="page"'));
});
