import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DataTable } from './index';

describe('DataTable — SSR', () => {
  it('renders table semantics without accessing browser globals', () => {
    const html = renderToString(
      createElement(DataTable, {
        columns: [{ key: 'name', label: 'Name' }],
        rows: [{ id: 'north', name: 'North' }],
        selectable: true,
      }),
    );
    expect(html).toContain('lyra-table-scroll');
    expect(html).toContain('lyra-table__primary');
    expect(html).toContain('Select all');
  });
});
