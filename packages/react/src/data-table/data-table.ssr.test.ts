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

  it('renders consumer-owned native action cells without making rows commands', () => {
    const html = renderToString(
      createElement(DataTable, {
        columns: [
          { key: 'name', label: 'Project' },
          { key: 'actions', label: 'Actions' },
        ],
        rows: [
          {
            id: 'north',
            name: 'North',
            actions: createElement(
              'button',
              { type: 'button', 'aria-label': 'Open North' },
              'Open',
            ),
          },
        ],
      }),
    );
    expect(html).toContain('<button type="button" aria-label="Open North">Open</button>');
    expect(html).toContain('<tr><td class="lyra-table__primary">North</td>');
    expect(html).not.toContain('tabindex');
  });
});
