import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Dropdown } from './index';

describe('Dropdown — SSR', () => {
  it('renders an open menu without accessing browser globals', () => {
    const html = renderToString(
      createElement(Dropdown, {
        trigger: 'Actions',
        items: [{ id: 'edit', label: 'Edit' }],
        defaultOpen: true,
      }),
    );
    expect(html).toContain('lyra-dropdown');
    expect(html).toContain('role="menu"');
  });
});
