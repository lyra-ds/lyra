import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { Table } from './index';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'total', label: 'Total', align: 'right' as const },
];
const rows = [
  { id: 'one', name: 'North', total: '$240' },
  { id: 'two', name: 'South', total: '$180' },
];

function setTheme(theme: 'light' | 'dark'): void {
  document.documentElement.toggleAttribute('data-theme', theme === 'dark');
}

afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('Table', () => {
  for (const theme of ['light', 'dark'] as const) {
    for (const hover of [false, true]) {
      it(`renders ${hover ? 'hover' : 'default'} rows with exact classes and no axe violations in ${theme}`, async () => {
        setTheme(theme);
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        try {
          const { container } = await render(<Table columns={columns} rows={rows} hover={hover} />);
          expect(container.querySelector('.lyra-table-wrap')!.className).toBe('lyra-table-wrap');
          expect(container.querySelector('table')!.className).toBe(
            hover ? 'lyra-table lyra-table--hover' : 'lyra-table',
          );
          expect(container.querySelector('thead th')!.textContent).toBe('Name');
          expect(container.querySelector('tbody td')!.className).toBe('lyra-table__primary');
          expect(container.querySelectorAll('tbody tr')).toHaveLength(2);
          expect(error).not.toHaveBeenCalled();
          await expectNoAxeViolations(container);
        } finally {
          error.mockRestore();
        }
      });
    }
  }

  for (const theme of ['light', 'dark'] as const) {
    it(`is axe clean on the column headings in ${theme}`, async () => {
      setTheme(theme);
      const { container } = await render(<Table columns={columns} rows={rows} />);
      await expectNoAxeViolations(container.querySelector<HTMLElement>('thead')!);
    });
  }

  it('forwards its ref and native div attributes to the wrapper', async () => {
    let node: HTMLDivElement | null = null;
    const { container } = await render(
      <Table
        ref={(element) => {
          node = element;
        }}
        columns={columns}
        rows={rows}
        data-testid="sales"
      />,
    );
    expect(node).toBe(container.querySelector('[data-testid=sales]'));
  });
});
