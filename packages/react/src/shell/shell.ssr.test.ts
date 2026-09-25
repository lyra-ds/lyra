import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Shell } from './index';

describe('Shell SSR', () => {
  it('renders the main content and optional slots without throwing', () => {
    const html = renderToString(
      createElement(Shell, { sidebar: 'Navigation', topbar: 'Toolbar', aside: 'Contents' }, 'Body'),
    );

    expect(html).toContain('<main class="lyra-shell__main">');
    expect(html).toContain('lyra-shell__sidebar');
    expect(html).toContain('lyra-shell__topbar');
    expect(html).toContain('lyra-shell__aside');
  });

  it('renders a banner before navigation and links past it to a focusable main region', () => {
    const html = renderToString(
      createElement(
        Shell,
        {
          banner: 'Tenant: Acme',
          sidebar: createElement('nav', { 'aria-label': 'Primary' }, 'Navigation'),
          sidebarAs: 'div',
          skipLink: { label: 'Skip to content' },
          mainId: 'events',
          topbar: 'Filters',
        },
        'Events',
      ),
    );

    expect(html).toMatch(/<a class="lyra-shell__skip-link" href="#events">Skip to content<\/a>/);
    expect(html.indexOf('<header class="lyra-shell__banner">')).toBeLessThan(
      html.indexOf('<div class="lyra-shell__sidebar">'),
    );
    expect(html.indexOf('<div class="lyra-shell__sidebar">')).toBeLessThan(
      html.indexOf('<main class="lyra-shell__main"'),
    );
    expect(html).toContain('<main class="lyra-shell__main" id="events" tabindex="-1">');
    expect(html).toMatch(/<main[^>]*><div class="lyra-shell__topbar">Filters<\/div>/);
  });

  it('generates a stable skip target when mainId is omitted', () => {
    const html = renderToString(createElement(Shell, { skipLink: { label: 'Skip' } }, 'Body'));
    const href = html.match(/href="#([^"]+)"/)?.[1];
    expect(href).toBeTruthy();
    expect(html).toContain(`id="${href}"`);
  });
});
