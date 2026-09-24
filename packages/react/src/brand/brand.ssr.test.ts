import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Brand } from './index';

describe('Brand SSR', () => {
  it('renders a themed linked wordmark without throwing', () =>
    expect(
      renderToString(
        createElement(Brand, {
          mark: '/mark.svg',
          markDark: '/mark-light.svg',
          href: '/',
          children: 'Lyra',
        }),
      ),
    ).toContain('lyra-brand'));

  it('renders without a mark, falling back to the wordmark initial', () => {
    const html = renderToString(createElement(Brand, { children: 'Lyra' }));
    expect(html).toContain('lyra-brand__mark--initial');
    expect(html).toContain('>L</span>');
    expect(html).not.toContain('<img');
  });

  it('falls back to the aria-label initial for a mark-only brand without a mark', () =>
    expect(renderToString(createElement(Brand, { 'aria-label': 'Acme' }))).toContain('>A</span>'));
});
