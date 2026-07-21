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
});
