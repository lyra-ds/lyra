/** The active sort column and direction. */
export interface LyraDataTableSorting {
  /** Consumer-owned `data-sort-key` of the active served header. */
  key: string;
  /** Sort direction. */
  dir: 'asc' | 'desc';
}

/** Initial configuration accepted by `x-data="lyraDataTable(...)"`. */
export interface LyraDataTableOptions {
  /** Controlled sort state. Modelable with `x-modelable="sorting"`. Default: `null`. */
  sorting?: LyraDataTableSorting | null;
  /** Controlled selected served row ids. Modelable with `x-modelable="selected"`. Default: `[]`. */
  selected?: string[];
  /** Reorder served rows in the browser after sorting. Default: `false`. */
  clientSort?: boolean;
}

type Binding = Record<string, unknown>;

interface LyraDataTableData {
  sorting: LyraDataTableSorting | null;
  selected: string[];
  root: HTMLElement | null;
  originalRows: HTMLTableRowElement[];
  rowIds: string[];
  init(): void;
  allSelected(): boolean;
  someSelected(): boolean;
  rowIdFor(element: Element): string | null;
  headerKeyFor(element: Element): string | null;
  setSelected(selected: string[], dispatch: boolean): void;
  toggleSelected(id: string): void;
  toggleAll(): void;
  setSorting(sorting: LyraDataTableSorting | null, dispatch: boolean): void;
  toggleSort(key: string): void;
  sortDir(key: string): 'asc' | 'desc' | null;
  syncSelectAll(): void;
  applySorting(): void;
  sortValue(row: HTMLTableRowElement, key: string): string | null;
  selectAll: Binding;
  rowCheckbox: Binding;
  row: Binding;
  header: Binding;
  sortButton: Binding;
}

interface LyraDataTableMagics {
  $dispatch(name: string, detail?: Record<string, unknown>): void;
  $el: HTMLElement;
  $watch(path: string, callback: () => void): void;
}

type LyraDataTableState = LyraDataTableData & LyraDataTableMagics;

function compareValues(left: string | null, right: string | null): number {
  if (left == null) return 1;
  if (right == null) return -1;
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Selection and sorting behavior for a consumer-served data table. It deliberately does not
 * render loading, empty, footer, density, sticky-header, width, alignment, or cell content:
 * those are server-rendered concerns.
 *
 * Every data row must carry a unique string `data-row-id` in the original served order. Serve
 * sortable headers as `th[data-sort-key][x-bind="header"]`, each with a descendant
 * `button[x-bind="sortButton"]`. For client sorting, every sortable data cell may carry
 * `data-sort-value`: its column is the index of the header among all sibling `th` elements,
 * matched to the td at that same index among the row's direct cells (including a selection
 * checkbox column). A missing attribute is sorted as null. Values use `localeCompare` with
 * `numeric: true` and `sensitivity: 'base'`, so numeric strings sort numerically. Consumer icon
 * slots can use `sortDir(key)`: `null` for the unsorted icon, `'asc'` for ascending, and `'desc'`
 * for descending.
 *
 * ```html
 * <div x-data="lyraDataTable({ selected: [], sorting: null, clientSort: false })"
 *   x-modelable="selected" x-model="selectedIds">
 *   <table class="lyra-table">
 *     <thead><tr>
 *       <th class="lyra-table__check"><input class="lyra-checkbox" type="checkbox" x-bind="selectAll"></th>
 *       <th data-sort-key="name" x-bind="header"><button class="lyra-table__sortbtn" x-bind="sortButton">
 *         Name <svg x-show="sortDir('name') === null"></svg><svg x-show="sortDir('name') === 'asc'"></svg><svg x-show="sortDir('name') === 'desc'"></svg>
 *       </button></th>
 *     </tr></thead>
 *     <tbody><tr data-row-id="north" x-bind="row">
 *       <td class="lyra-table__check"><input class="lyra-checkbox" type="checkbox" x-bind="rowCheckbox"></td>
 *       <td data-sort-value="North">North</td>
 *     </tr></tbody>
 *   </table>
 * </div>
 * ```
 */
export function lyraDataTable({
  sorting = null,
  selected = [],
  clientSort = false,
}: LyraDataTableOptions = {}): LyraDataTableData {
  const state: LyraDataTableData & ThisType<LyraDataTableState> = {
    sorting,
    selected: selected.slice(),
    root: null,
    originalRows: [],
    rowIds: [],

    init() {
      this.root = this.$el;
      this.originalRows = Array.from(
        this.root.querySelectorAll<HTMLTableRowElement>('tbody tr[data-row-id]'),
      );
      this.rowIds = this.originalRows.flatMap((row) => {
        const id = row.dataset.rowId;
        return id === undefined ? [] : [id];
      });
      this.syncSelectAll();
      this.$watch('selected', () => this.syncSelectAll());
      if (clientSort) {
        this.$watch('sorting', () => this.applySorting());
        this.applySorting();
      }
    },

    allSelected() {
      return this.rowIds.length > 0 && this.rowIds.every((id) => this.selected.includes(id));
    },

    someSelected() {
      return this.selected.length > 0 && !this.allSelected();
    },

    rowIdFor(element) {
      return element.closest<HTMLElement>('[data-row-id]')?.dataset.rowId ?? null;
    },

    headerKeyFor(element) {
      return element.closest<HTMLElement>('[data-sort-key]')?.dataset.sortKey ?? null;
    },

    setSelected(selected, dispatch) {
      this.selected = selected;
      if (dispatch) this.$dispatch('lyra:selection', { selected: this.selected });
    },

    toggleSelected(id) {
      this.setSelected(
        this.selected.includes(id)
          ? this.selected.filter((selectedId) => selectedId !== id)
          : [...this.selected, id],
        true,
      );
    },

    toggleAll() {
      this.setSelected(this.allSelected() ? [] : this.rowIds.slice(), true);
    },

    setSorting(sorting, dispatch) {
      this.sorting = sorting;
      if (clientSort) this.applySorting();
      if (dispatch) this.$dispatch('lyra:sort', { sorting: this.sorting });
    },

    toggleSort(key) {
      if (!this.sorting || this.sorting.key !== key) this.setSorting({ key, dir: 'asc' }, true);
      else if (this.sorting.dir === 'asc') this.setSorting({ key, dir: 'desc' }, true);
      else this.setSorting(null, true);
    },

    sortDir(key) {
      return this.sorting?.key === key ? this.sorting.dir : null;
    },

    syncSelectAll() {
      const checkbox = this.root?.querySelector<HTMLInputElement>(
        'thead input[x-bind="selectAll"]',
      );
      if (checkbox) checkbox.indeterminate = this.someSelected();
    },

    applySorting() {
      const tbody = this.originalRows[0]?.parentElement;
      if (!(tbody instanceof HTMLTableSectionElement)) return;
      if (!this.sorting) {
        for (const row of this.originalRows) tbody.insertBefore(row, null);
        return;
      }

      const sorted = this.originalRows
        .slice()
        .sort((left, right) =>
          compareValues(
            this.sortValue(left, this.sorting!.key),
            this.sortValue(right, this.sorting!.key),
          ),
        );
      const nonNull = sorted.filter((row) => this.sortValue(row, this.sorting!.key) !== null);
      const nulls = sorted.filter((row) => this.sortValue(row, this.sorting!.key) === null);
      const ordered = this.sorting.dir === 'desc' ? [...nonNull.reverse(), ...nulls] : sorted;
      for (const row of ordered) tbody.insertBefore(row, null);
    },

    sortValue(row, key) {
      const header = Array.from(
        this.root?.querySelectorAll<HTMLElement>('th[data-sort-key]') ?? [],
      ).find((candidate) => candidate.dataset.sortKey === key);
      if (!header) return null;
      const headerCells = Array.from(header.parentElement?.children ?? []);
      const index = headerCells.indexOf(header);
      if (index < 0) return null;
      const cell = row.children.item(index);
      return cell?.hasAttribute('data-sort-value') ? cell.getAttribute('data-sort-value') : null;
    },

    selectAll: {
      [':checked']() {
        return this.allSelected();
      },
      ['@change']() {
        this.toggleAll();
      },
    },

    rowCheckbox: {
      [':checked']() {
        const id = this.rowIdFor(this.$el);
        return id !== null && this.selected.includes(id);
      },
      ['@change']() {
        const id = this.rowIdFor(this.$el);
        if (id !== null) this.toggleSelected(id);
      },
      ['@click.stop']() {},
    },

    row: {
      [':class']() {
        const id = this.rowIdFor(this.$el);
        return { 'lyra-table__row--selected': id !== null && this.selected.includes(id) };
      },
    },

    header: {
      [':aria-sort']() {
        const key = this.headerKeyFor(this.$el);
        if (key === null || this.sorting?.key !== key) return undefined;
        return this.sorting.dir === 'asc' ? 'ascending' : 'descending';
      },
    },

    sortButton: {
      type: 'button',
      [':class']() {
        const key = this.headerKeyFor(this.$el);
        return { 'lyra-table__sortbtn--active': key !== null && this.sorting?.key === key };
      },
      ['@click']() {
        const key = this.headerKeyFor(this.$el);
        if (key !== null) this.toggleSort(key);
      },
    },
  };

  return state;
}
