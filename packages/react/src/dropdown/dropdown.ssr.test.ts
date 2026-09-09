import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Dropdown } from './index';

describe('Dropdown — SSR', () => {
  it('renders an open menu without accessing browser globals', () => {
    const html = renderToString(
      createElement(Dropdown, {
        trigger: 'Actions',
        items: [
          { type: 'label', label: 'Actions' },
          { id: 'edit', label: 'Edit' },
          { type: 'separator' },
          { id: 'archive', label: 'Archive' },
        ],
        defaultOpen: true,
      }),
    );
    const menu = html.slice(html.indexOf('role="menu"'));
    expect(html).toContain('lyra-dropdown');
    expect(html).toContain('role="menu"');
    expect(menu.match(/tabindex="0"/g)).toHaveLength(1);
    expect(menu.match(/tabindex="-1"/g)).toHaveLength(1);
  });
});
