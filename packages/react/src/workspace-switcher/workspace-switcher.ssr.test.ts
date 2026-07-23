import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { WorkspaceSwitcher } from './index';

describe('WorkspaceSwitcher — SSR', () => {
  it('renders an open listbox without accessing browser globals', () => {
    const html = renderToString(
      createElement(WorkspaceSwitcher, {
        defaultOpen: true,
        workspaces: [{ id: 'acme', name: 'Acme', plan: 'Pro', members: 3 }],
      }),
    );
    expect(html).toContain('lyra-wssw');
    expect(html).toContain('role="listbox"');
  });
});
