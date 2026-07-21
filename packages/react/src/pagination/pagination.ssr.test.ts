import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Pagination } from './index';
describe('Pagination — SSR', () => {
  it('renders gaps and current-page state', () => {
    const html = renderToString(createElement(Pagination, { page: 5, total: 10 }));
    expect(html).toContain('lyra-page--gap');
    expect(html).toContain('aria-current="page"');
  });
});
