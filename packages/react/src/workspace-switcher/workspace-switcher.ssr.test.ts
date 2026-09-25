import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { WorkspaceSwitcher } from './index';

describe('WorkspaceSwitcher — SSR', () => {
  it('renders a labelled disclosure with selection and navigation controls without browser globals', () => {
    const html = renderToString(
      createElement(WorkspaceSwitcher, {
        defaultOpen: true,
        workspaces: [
          { id: 'acme', name: 'Acme', plan: 'Pro', members: 3, href: '/acme/staging' },
          { id: 'lyra', name: 'Lyra', members: 1 },
        ],
        onCreate: () => {},
        labels: {
          listLabel: 'Espaços',
          placeholder: 'Escolha um espaço',
          members: (count) => `${count} membro${count === 1 ? '' : 's'}`,
        },
      }),
    );
    expect(html).toContain('lyra-wssw');
    expect(html).toContain('role="group"');
    expect(html).not.toContain('role="listbox"');
    expect(html).not.toContain('role="option"');
    expect(html).toContain('Espaços');
    expect(html).toContain('3 membros');
    expect(html).toContain('1 membro');
    expect(html).toContain('href="/acme/staging"');
    expect(html).toContain('aria-current="true"');
    expect(html).toContain('Create workspace');
    expect(html.indexOf('lyra-wssw__create')).toBeGreaterThan(html.indexOf('href="/acme/staging"'));
  });

  it('uses the translated placeholder when no workspace is available', () => {
    const html = renderToString(
      createElement(WorkspaceSwitcher, { labels: { placeholder: 'Escolha um espaço' } }),
    );
    expect(html).toContain('Escolha um espaço');
  });
});
