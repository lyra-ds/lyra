import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { WorkspaceSwitcher } from './index';

describe('WorkspaceSwitcher — SSR', () => {
  it('renders an open inner listbox without accessing browser globals', () => {
    const html = renderToString(
      createElement(WorkspaceSwitcher, {
        defaultOpen: true,
        workspaces: [{ id: 'acme', name: 'Acme', plan: 'Pro', members: 3 }],
        onCreate: () => {},
      }),
    );
    expect(html).toContain('lyra-wssw');
    expect(html).toContain('role="listbox"');
    expect(html).toContain('role="option"');
    expect(html).toContain('Create workspace');
    expect(html.match(/role="option"/g)).toHaveLength(1);
    const listboxEnd = html.indexOf('</div><hr', html.indexOf('role="listbox"'));
    expect(listboxEnd).toBeGreaterThan(-1);
    expect(html.indexOf('lyra-wssw__create')).toBeGreaterThan(listboxEnd);
  });
});
