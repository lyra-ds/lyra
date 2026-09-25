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
    expect(html).toContain('tabindex="0"');
  });

  it('renders named table and scroll semantics, scoped headers, and loading status', () => {
    const html = renderToString(
      createElement(DataTable, {
        caption: 'Projects',
        captionHidden: true,
        columns: [{ key: 'name', label: 'Name', rowHeader: true }],
        rows: [{ id: 'north', name: 'North' }],
        selectable: true,
      }),
    );
    expect(html).toMatch(/class="lyra-table-scroll"[^>]*role="region" tabindex="0"/);
    expect(html).toMatch(/aria-labelledby="[^"]+"/);
    expect(html).toMatch(/<caption[^>]*class="lyra-visually-hidden"/);
    expect(html).toContain('scope="col"');
    expect(html).toContain('scope="row"');
    expect(html).toContain('<th scope="row" class="lyra-table__primary">North</th>');

    const loading = renderToString(
      createElement(DataTable, {
        columns: [{ key: 'name', label: 'Name' }],
        rows: [],
        loading: true,
        'aria-label': 'Projects',
        scrollLabel: 'Scrollable projects',
        labels: { loading: 'Carregando dados…' },
      }),
    );
    expect(loading).toContain('aria-label="Scrollable projects"');
    expect(loading).toContain('<table aria-label="Projects" aria-busy="true"');
    expect(loading).toContain('role="status" class="lyra-visually-hidden">Carregando dados…');

    const labelled = renderToString(
      createElement(DataTable, {
        columns: [{ key: 'name', label: 'Name' }],
        rows: [],
        'aria-labelledby': 'projects-heading',
      }),
    );
    expect(labelled).toContain('<table aria-labelledby="projects-heading"');
    expect(labelled).toContain('role="region" tabindex="0" aria-labelledby="projects-heading"');
  });
});
