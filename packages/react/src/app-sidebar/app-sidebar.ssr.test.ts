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
});
