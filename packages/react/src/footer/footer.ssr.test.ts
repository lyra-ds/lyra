import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Footer } from './index';

describe('Footer SSR', () => {
  it('renders supplied slots without throwing', () => {
    const html = renderToString(
      createElement(Footer, {
        brand: 'Brand',
        note: 'Note',
        links: 'Links',
        linksLabel: 'Resources',
      }),
    );

    expect(html).toContain('<footer');
    expect(html).toContain('aria-label="Resources"');
  });
});
