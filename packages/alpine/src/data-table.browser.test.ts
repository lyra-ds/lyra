import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

const mountedHosts: HTMLElement[] = [];

Alpine.plugin(lyra);

/** The canonical served-table composition. `data-sort-value` belongs on the matching td. */
function dataTableTemplate(
  options = '{}',
  wrapperAttributes = '',
  componentAttributes = '',
  controls = '',
): string {
  return `
    <div ${wrapperAttributes}>
      <div class="lyra-data-table" x-data='lyraDataTable(${options})' ${componentAttributes}>
        <table class="lyra-table">
          <thead>
            <tr>
              <th class="lyra-table__check">
                <input class="lyra-checkbox" type="checkbox" aria-label="Select all" x-bind="selectAll">
              </th>
              <th data-sort-key="name" x-bind="header">
                <button class="lyra-table__sortbtn" x-bind="sortButton">Name
                  <span data-testid="name-unsorted" :hidden="sortDir('name') !== null">↕</span>
                  <span data-testid="name-asc" :hidden="sortDir('name') !== 'asc'">↑</span>
                  <span data-testid="name-desc" :hidden="sortDir('name') !== 'desc'">↓</span>
                </button>
              </th>
              <th data-sort-key="total" x-bind="header">
                <button class="lyra-table__sortbtn" x-bind="sortButton">Total
                  <span data-testid="total-unsorted" :hidden="sortDir('total') !== null">↕</span>
                  <span data-testid="total-asc" :hidden="sortDir('total') !== 'asc'">↑</span>
                  <span data-testid="total-desc" :hidden="sortDir('total') !== 'desc'">↓</span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr data-row-id="north" class="lyra-table__row--selected" x-bind="row">
              <td class="lyra-table__check"><input class="lyra-checkbox" type="checkbox" aria-label="Select North" x-bind="rowCheckbox"></td>
              <td data-sort-value="North">North</td><td data-sort-value="10">10</td>
            </tr>
            <tr data-row-id="south" x-bind="row">
              <td class="lyra-table__check"><input class="lyra-checkbox" type="checkbox" aria-label="Select South" x-bind="rowCheckbox"></td>
              <td data-sort-value="South">South</td><td data-sort-value="2">2</td>
            </tr>
            <tr data-row-id="west" x-bind="row">
              <td class="lyra-table__check"><input class="lyra-checkbox" type="checkbox" aria-label="Select West" x-bind="rowCheckbox"></td>
              <td>West</td><td>—</td>
            </tr>
          </tbody>
        </table>
        ${controls}
      </div>
    </div>
  `;
}

function mountDataTable(
  options = '{}',
  wrapperAttributes = '',
  componentAttributes = '',
  controls = '',
): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = dataTableTemplate(options, wrapperAttributes, componentAttributes, controls);
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);
  return host;
}

function root(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-data-table');
  if (!element) throw new Error('Expected data-table root');
  return element;
}

function bodyRows(host: HTMLElement): HTMLTableRowElement[] {
  return Array.from(host.querySelectorAll<HTMLTableRowElement>('tbody tr[data-row-id]'));
}

function row(host: HTMLElement, id: string): HTMLTableRowElement {
  const element = host.querySelector<HTMLTableRowElement>(`tbody tr[data-row-id="${id}"]`);
  if (!element) throw new Error(`Expected ${id} row`);
  return element;
}

function header(host: HTMLElement, key: string): HTMLTableCellElement {
  const element = host.querySelector<HTMLTableCellElement>(`th[data-sort-key="${key}"]`);
  if (!element) throw new Error(`Expected ${key} header`);
  return element;
}

function sortButton(host: HTMLElement, key: string): HTMLButtonElement {
  const element = header(host, key).querySelector<HTMLButtonElement>('button');
  if (!element) throw new Error(`Expected ${key} sort button`);
  return element;
}

function selectAll(host: HTMLElement): HTMLInputElement {
  const element = host.querySelector<HTMLInputElement>('thead input[type="checkbox"]');
  if (!element) throw new Error('Expected select-all checkbox');
  return element;
}

function rowCheckbox(host: HTMLElement, id: string): HTMLInputElement {
  const element = row(host, id).querySelector<HTMLInputElement>('input[type="checkbox"]');
  if (!element) throw new Error(`Expected ${id} row checkbox`);
  return element;
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Alpine.nextTick();
}

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
});

describe('lyraDataTable', () => {
  it('selects original row ids, clears them, and sets select-all indeterminate imperatively', async () => {
    const host = mountDataTable();
    const selections: string[][] = [];
    root(host).addEventListener('lyra:selection', (event) => {
      selections.push((event as CustomEvent<{ selected: string[] }>).detail.selected);
    });

    await userEvent.click(selectAll(host));
    await flush();
    expect(selections).toEqual([['north', 'south', 'west']]);
    expect(
      bodyRows(host).every((entry) => entry.classList.contains('lyra-table__row--selected')),
    ).toBe(true);
    expect(selectAll(host).checked).toBe(true);
    expect(selectAll(host).indeterminate).toBe(false);

    await userEvent.click(selectAll(host));
    await flush();
    expect(selections).toEqual([['north', 'south', 'west'], []]);
    expect(selectAll(host).checked).toBe(false);
    expect(selectAll(host).indeterminate).toBe(false);

    await userEvent.click(rowCheckbox(host, 'south'));
    await flush();
    expect(selectAll(host).indeterminate).toBe(true);
    expect(selectAll(host).hasAttribute('indeterminate')).toBe(false);
  });

  it('toggles the served row and stops checkbox clicks before row click handlers', async () => {
    const host = mountDataTable();
    let rowClicks = 0;
    row(host, 'north').addEventListener('click', () => {
      rowClicks += 1;
    });

    expect(row(host, 'north').classList.contains('lyra-table__row--selected')).toBe(false);
    await userEvent.click(rowCheckbox(host, 'north'));
    await flush();
    expect(row(host, 'north').classList.contains('lyra-table__row--selected')).toBe(true);
    expect(rowClicks).toBe(0);

    await userEvent.click(rowCheckbox(host, 'north'));
    await flush();
    expect(row(host, 'north').classList.contains('lyra-table__row--selected')).toBe(false);
  });

  it('cycles the active header through ascending, descending, and unsorted states', async () => {
    const host = mountDataTable();
    const sorts: Array<{ key: string; dir: string } | null> = [];
    root(host).addEventListener('lyra:sort', (event) => {
      sorts.push(
        (event as CustomEvent<{ sorting: { key: string; dir: string } | null }>).detail.sorting,
      );
    });

    await userEvent.click(sortButton(host, 'name'));
    await flush();
    expect(header(host, 'name').getAttribute('aria-sort')).toBe('ascending');
    expect(sortButton(host, 'name').classList.contains('lyra-table__sortbtn--active')).toBe(true);
    expect(host.querySelector<HTMLElement>('[data-testid="name-asc"]')?.hidden).toBe(false);

    await userEvent.click(sortButton(host, 'name'));
    await flush();
    expect(header(host, 'name').getAttribute('aria-sort')).toBe('descending');

    await userEvent.click(sortButton(host, 'name'));
    await flush();
    expect(header(host, 'name').hasAttribute('aria-sort')).toBe(false);
    expect(sortButton(host, 'name').classList.contains('lyra-table__sortbtn--active')).toBe(false);
    expect(sorts).toEqual([{ key: 'name', dir: 'asc' }, { key: 'name', dir: 'desc' }, null]);
  });

  it('moves sort state to a second column without retaining the first header state', async () => {
    const host = mountDataTable();

    await userEvent.click(sortButton(host, 'name'));
    await userEvent.click(sortButton(host, 'total'));
    await flush();
    expect(header(host, 'name').hasAttribute('aria-sort')).toBe(false);
    expect(sortButton(host, 'name').classList.contains('lyra-table__sortbtn--active')).toBe(false);
    expect(header(host, 'total').getAttribute('aria-sort')).toBe('ascending');
  });

  it('never reorders served rows in server mode', async () => {
    const host = mountDataTable();

    await userEvent.click(sortButton(host, 'total'));
    await flush();
    expect(bodyRows(host).map((entry) => entry.dataset.rowId)).toEqual(['north', 'south', 'west']);
  });

  it('client-sorts matching td data-sort-value values, keeps nulls last, and restores served order', async () => {
    const host = mountDataTable('{ clientSort: true }');

    await userEvent.click(sortButton(host, 'total'));
    await flush();
    expect(bodyRows(host).map((entry) => entry.dataset.rowId)).toEqual(['south', 'north', 'west']);

    await userEvent.click(sortButton(host, 'total'));
    await flush();
    expect(bodyRows(host).map((entry) => entry.dataset.rowId)).toEqual(['north', 'south', 'west']);

    await userEvent.click(sortButton(host, 'total'));
    await flush();
    expect(bodyRows(host).map((entry) => entry.dataset.rowId)).toEqual(['north', 'south', 'west']);

    // Reach the unsorted state from an order that DIFFERS from the served one
    // (desc by name: south, north, west) so the restore branch is actually proven.
    await userEvent.click(sortButton(host, 'name'));
    await userEvent.click(sortButton(host, 'name'));
    await flush();
    expect(bodyRows(host).map((entry) => entry.dataset.rowId)).toEqual(['south', 'north', 'west']);
    await userEvent.click(sortButton(host, 'name'));
    await flush();
    expect(bodyRows(host).map((entry) => entry.dataset.rowId)).toEqual(['north', 'south', 'west']);
  });

  it('keeps a selected id attached to its original row after client sorting', async () => {
    const host = mountDataTable('{ clientSort: true }');

    await userEvent.click(rowCheckbox(host, 'south'));
    await userEvent.click(sortButton(host, 'name'));
    await userEvent.click(sortButton(host, 'name'));
    await flush();
    // West's name cell has no data-sort-value, so it stays last even descending.
    expect(bodyRows(host).map((entry) => entry.dataset.rowId)).toEqual(['south', 'north', 'west']);
    expect(rowCheckbox(host, 'south').checked).toBe(true);
    expect(rowCheckbox(host, 'north').checked).toBe(false);
  });

  it('re-sorts external model writes without dispatching a sort event', async () => {
    const host = mountDataTable(
      '{ clientSort: true }',
      'x-data="{ outerSorting: null }"',
      'x-modelable="sorting" x-model="outerSorting"',
      '<button type="button" data-testid="external-sort" @click="outerSorting = { key: \'total\', dir: \'asc\' }">Sort externally</button>',
    );
    const sorts: unknown[] = [];
    root(host).addEventListener('lyra:sort', (event) => sorts.push(event));
    const external = host.querySelector<HTMLButtonElement>('[data-testid="external-sort"]');
    if (!external) throw new Error('Expected external sorting control');

    await userEvent.click(external);
    await flush();
    expect(bodyRows(host).map((entry) => entry.dataset.rowId)).toEqual(['south', 'north', 'west']);
    expect(sorts).toEqual([]);
  });

  it('synchronizes modelable selected state in both directions without dispatching external writes', async () => {
    const host = mountDataTable(
      '{}',
      'x-data="{ outerSelected: [] }"',
      'x-modelable="selected" x-model="outerSelected"',
      '<button type="button" data-testid="external-selection" @click="outerSelected = [\'west\']">Select externally</button>',
    );
    const outer = host.firstElementChild as HTMLElement;
    const externalSelection = host.querySelector<HTMLButtonElement>(
      '[data-testid="external-selection"]',
    );
    if (!externalSelection) throw new Error('Expected external selection control');
    const selections: unknown[] = [];
    root(host).addEventListener('lyra:selection', (event) => selections.push(event));

    await userEvent.click(externalSelection);
    await flush();
    expect(rowCheckbox(host, 'west').checked).toBe(true);
    expect(selections).toEqual([]);
    await userEvent.click(rowCheckbox(host, 'north'));
    await flush();
    expect((Alpine.$data(outer) as { outerSelected: string[] }).outerSelected).toEqual([
      'west',
      'north',
    ]);
  });

  it('synchronizes modelable sorting state in both directions without dispatching external writes', async () => {
    const host = mountDataTable(
      '{}',
      'x-data="{ outerSorting: null }"',
      'x-modelable="sorting" x-model="outerSorting"',
      '<button type="button" data-testid="external-sorting" @click="outerSorting = { key: \'total\', dir: \'asc\' }">Sort externally</button>',
    );
    const outer = host.firstElementChild as HTMLElement;
    const externalSorting = host.querySelector<HTMLButtonElement>(
      '[data-testid="external-sorting"]',
    );
    if (!externalSorting) throw new Error('Expected external sorting control');
    const sorts: unknown[] = [];
    root(host).addEventListener('lyra:sort', (event) => sorts.push(event));

    await userEvent.click(externalSorting);
    await flush();
    expect(header(host, 'total').getAttribute('aria-sort')).toBe('ascending');
    expect(sorts).toEqual([]);

    await userEvent.click(sortButton(host, 'name'));
    await flush();
    expect(
      (Alpine.$data(outer) as { outerSorting: { key: string; dir: string } | null }).outerSorting,
    ).toEqual({
      key: 'name',
      dir: 'asc',
    });
  });

  it('is axe clean with selectable unsorted and sorted served tables', async () => {
    const host = mountDataTable();
    await expectNoAxeViolations(host);
    await userEvent.click(sortButton(host, 'name'));
    await flush();
    await expectNoAxeViolations(host);
  });
});
