import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AppSidebar } from './index';
import { SidebarGroup } from '../sidebar-group';

describe('AppSidebar — SSR', () => {
  it('renders supplied slots and a data-driven rail without throwing', () => {
    const html = renderToString(
      createElement(AppSidebar, {
        brand: 'Lyra',
        groups: [{ heading: 'Workspace', items: [{ id: 'overview', label: 'Overview' }] }],
        footer: 'Account',
        collapsed: true,
      }),
    );

    expect(html).toContain('lyra-appsidebar--rail');
    expect(html).toContain('--appsidebar-width:64px');
    expect(html).toContain('title="Overview"');
  });

  it('gives composed links an accessible name and native rail tooltip', () => {
    const html = renderToString(
      createElement(
        AppSidebar,
        { collapsed: true },
        createElement(
          SidebarGroup,
          { label: 'Documentation' },
          createElement(
            'a',
            { className: 'lyra-sbgroup__item', href: '/guides' },
            createElement('span', { className: 'lyra-sbgroup__item-label' }, 'Guides'),
          ),
        ),
      ),
    );

    expect(html).toContain('href="/guides"');
    expect(html).toContain('title="Guides"');
    expect(html).toContain('aria-label="Guides"');
  });

  it('renders data destinations as links and preserves button-only items', () => {
    const html = renderToString(
      createElement(AppSidebar, {
        collapsed: true,
        labels: { collapse: 'Recolher barra lateral', expand: 'Expandir barra lateral' },
        collapsible: true,
        groups: [
          {
            items: [
              {
                id: 'home',
                label: 'Início',
                href: '/inicio',
                active: true,
                target: '_blank',
                rel: 'noopener',
              },
              { id: 'action', label: 'Ação', onSelect: () => {} },
              { id: 'router', label: 'Rotas', asChild: createElement('a', { href: '/rotas' }) },
            ],
          },
        ],
      }),
    );
    expect(html).toContain('href="/inicio"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('href="/rotas"');
    expect(html).toContain('<button type="button"');
    expect(html).toContain('Expandir barra lateral');
  });
});
