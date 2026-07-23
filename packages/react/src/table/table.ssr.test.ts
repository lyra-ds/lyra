import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Table } from './index';

describe('Table — SSR', () => {
  it('renders table semantics without throwing', () => {
    const html = renderToString(
      createElement(Table, {
        columns: [{ key: 'name', label: 'Name' }],
        rows: [{ id: 'one', name: 'North' }],
      }),
    );
    expect(html).toContain('lyra-table-wrap');
    expect(html).toContain('lyra-table__primary');
  });
});
