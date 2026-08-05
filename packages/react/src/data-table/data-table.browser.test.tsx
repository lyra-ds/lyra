import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { DataTable } from './index';

const themes = ['light', 'dark'] as const;
const columns = [
  { key: 'name', label: 'Name', sortable: true },
  {
    key: 'total',
    label: 'Total',
    align: 'right' as const,
    sortable: true,
    sortValue: (row: Record<string, unknown>) => Number(row.total),
  },
];
const rows = [
  { id: 'north', name: 'North', total: 240 },
  { id: 'south', name: 'South', total: 180 },
];

function setTheme(theme: (typeof themes)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}

afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('DataTable', () => {
  for (const theme of themes) {
    it(`renders a selectable, sortable table and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const { container } = await render(
          <DataTable
            columns={columns}
            rows={rows}
            selectable
            stickyHeader
            density="compact"
            maxHeight={320}
            footer={<span>Showing 2 of 2</span>}
          />,
        );
        expect(container.querySelector('.lyra-table-wrap')!.className).toBe('lyra-table-wrap');
        expect(container.querySelector('.lyra-table-scroll')!).not.toBeNull();
        expect(container.querySelector('table')!.className).toBe(
          'lyra-table lyra-table--compact lyra-table--sticky',
        );
        expect(container.querySelector('.lyra-table__primary')!.textContent).toBe('North');
        expect(container.querySelector('.lyra-table__footer')!.textContent).toBe('Showing 2 of 2');
        expect(errorSpy).not.toHaveBeenCalled();
        await expectNoAxeViolations(container);
      } finally {
        errorSpy.mockRestore();
      }
    });
  }

  it('cycles sort state and updates uncontrolled row selection', async () => {
    const onSortChange = vi.fn();
    const onSelectionChange = vi.fn();
    const screen = await render(
      <DataTable
        columns={columns}
        rows={rows}
        selectable
        defaultSelected={['north']}
        onSortChange={onSortChange}
        onSelectionChange={onSelectionChange}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Total' }));
    expect(onSortChange).toHaveBeenLastCalledWith({ key: 'total', dir: 'asc' });
    expect(screen.container.querySelector('tbody tr')!.textContent).toContain('South');
    expect(screen.container.querySelectorAll('th')[2]!.getAttribute('aria-sort')).toBe('ascending');

    await userEvent.click(screen.getByRole('button', { name: 'Total' }));
    expect(onSortChange).toHaveBeenLastCalledWith({ key: 'total', dir: 'desc' });
    expect(screen.container.querySelector('tbody tr')!.textContent).toContain('North');

    await userEvent.click(screen.getByRole('button', { name: 'Total' }));
    expect(onSortChange).toHaveBeenLastCalledWith(null);
    expect(screen.container.querySelectorAll('th')[2]!.hasAttribute('aria-sort')).toBe(false);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all' }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(['north', 'south']);
    expect(screen.container.querySelectorAll('.lyra-table__row--selected')).toHaveLength(2);
  });

  it('honors controlled sorting and selection while requesting updates', async () => {
    const onSortChange = vi.fn();
    const onSelectionChange = vi.fn();
    const screen = await render(
      <DataTable
        columns={columns}
        rows={rows}
        selectable
        sorting={{ key: 'name', dir: 'asc' }}
        selected={['north']}
        onSortChange={onSortChange}
        onSelectionChange={onSelectionChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Name' }));
    await userEvent.click(screen.getByRole('row', { name: /North/ }).getByRole('checkbox'));
    expect(onSortChange).toHaveBeenCalledWith({ key: 'name', dir: 'desc' });
    expect(onSelectionChange).toHaveBeenCalledWith([]);
    expect(screen.container.querySelectorAll('.lyra-table__row--selected')).toHaveLength(1);
    expect(screen.container.querySelector('tbody tr')!.textContent).toContain('North');
  });

  it('uses default and translated labels for empty, loading, and selection states', async () => {
    const emptyScreen = await render(<DataTable columns={columns} rows={[]} selectable />);
    await expect.element(emptyScreen.getByText('No records.')).toBeInTheDocument();
    await expect
      .element(emptyScreen.getByRole('checkbox', { name: 'Select all' }))
      .toBeInTheDocument();

    await cleanup();
    const translatedScreen = await render(
      <DataTable
        columns={columns}
        rows={[]}
        loading={2}
        selectable
        labels={{ selectAll: 'Selecionar tudo', empty: 'Sem registros.' }}
      />,
    );
    expect(translatedScreen.container.querySelectorAll('tbody tr')).toHaveLength(2);
    await expect
      .element(translatedScreen.getByRole('checkbox', { name: 'Selecionar tudo' }))
      .toBeInTheDocument();

    await cleanup();
    const translatedEmptyScreen = await render(
      <DataTable columns={columns} rows={[]} labels={{ empty: 'Sem registros.' }} />,
    );
    await expect.element(translatedEmptyScreen.getByText('Sem registros.')).toBeInTheDocument();
  });

  it('uses distinct accessible row-checkbox names from a selectRow label function', async () => {
    const screen = await render(
      <DataTable
        columns={columns}
        rows={rows}
        selectable
        labels={{ selectRow: (row) => `Select ${String(row.name)}` }}
      />,
    );

    await expect
      .element(screen.getByRole('checkbox', { name: 'Select North' }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole('checkbox', { name: 'Select South' }))
      .toBeInTheDocument();
  });
  it('keeps selection attached to the same row after sorting when rows have no id', async () => {
    const screen = await render(
      <DataTable
        columns={columns}
        rows={[
          { name: 'North', total: 240 },
          { name: 'South', total: 180 },
        ]}
        selectable
        defaultSorting={null}
        labels={{ selectRow: (row) => `Select ${String(row.name)}` }}
      />,
    );

    // Sort ascending by name flips nothing; sort again for descending, which
    // flips the display order (South first) while fallback ids stay by the
    // ORIGINAL rows order.
    await userEvent.click(screen.getByRole('button', { name: 'Name' }));
    await userEvent.click(screen.getByRole('button', { name: 'Name' }));

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select South' }));

    // A third header click cycles sorting off, restoring the original display
    // order. Selection must FOLLOW THE ROW, not the display position: with ids
    // derived from the sorted index, the highlight jumps from South to North.
    await userEvent.click(screen.getByRole('button', { name: 'Name' }));

    const south = screen
      .getByRole('checkbox', { name: 'Select South' })
      .element() as HTMLInputElement;
    const north = screen
      .getByRole('checkbox', { name: 'Select North' })
      .element() as HTMLInputElement;
    expect(south.checked).toBe(true);
    expect(north.checked).toBe(false);
  });
});
