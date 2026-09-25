import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Breadcrumb } from './index';
describe('Breadcrumb SSR', () => {
  it('renders without throwing', () =>
    expect(
      renderToString(
        createElement(Breadcrumb, { items: [{ label: 'Home', href: '/' }, { label: 'Current' }] }),
      ),
    ).toContain('aria-current="page"'));
  it('renders router links, native targets and a localized landmark without placeholder links', () => {
    const html = renderToString(
      createElement(Breadcrumb, {
        locale: 'pt-BR',
        items: [
          { label: 'Início', href: '/', target: '_blank' },
          { label: 'Projetos', asChild: createElement('a', { href: '/projetos' }) },
          { label: 'Sem destino' },
          { label: 'Atual', href: '/atual' },
        ],
      }),
    );
    expect(html).toContain('aria-label="Navegação estrutural"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('href="/projetos"');
    expect(html).not.toContain('href="#"');
    expect(html).not.toContain('href="/atual"');
  });
});
