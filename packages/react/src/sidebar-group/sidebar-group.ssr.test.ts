import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SidebarGroup } from './index';

describe('SidebarGroup — SSR', () => {
  it('renders an initially collapsed disclosure without throwing', () => {
    const html = renderToString(
      createElement(SidebarGroup, {
        label: 'Projects',
        collapsible: true,
        defaultCollapsed: true,
        items: [{ id: 'one', label: 'One' }],
      }),
    );
    expect(html).toContain('lyra-sbgroup--collapsed');
    expect(html).toContain('aria-expanded="false"');
  });
});
