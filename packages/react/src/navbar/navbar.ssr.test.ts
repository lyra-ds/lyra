import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Navbar } from './index';

describe('Navbar SSR', () => {
  it('renders supplied slots without throwing', () => {
    const html = renderToString(
      createElement(Navbar, {
        brand: 'Brand',
        nav: 'Links',
        navLabel: 'Primary',
        actions: 'Actions',
      }),
    );

    expect(html).toContain('<header');
    expect(html).toContain('aria-label="Primary"');
  });
});
