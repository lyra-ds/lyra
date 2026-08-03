import { forwardRef, useEffect, useMemo, useRef } from 'react';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { cx } from '../internal/cx';
import { useControllableState } from '../internal/use-controllable-state';
import { Skeleton } from '../skeleton';

type RowShape = Record<string, ReactNode>;

/** A column rendered by {@link DataTable}. */
export interface DataTableColumn {
  /** Key used to read this column's value from each row. */
  key: string;
  /** Accessible column heading content. */
  label: ReactNode;
  /** Horizontal alignment for the heading and every cell in this column. */
  align?: 'left' | 'center' | 'right';
  /** Whether this heading cycles through ascending, descending, and unsorted states. */
  sortable?: boolean;
  /** Value used for sorting rich cell content. */
  sortValue?: (row: RowShape) => string | number | null;
  /** CSS width for this column. */
  width?: number | string;
}

/** The active sort column and direction. */
export interface DataTableSorting {
  /** Key of the sorted column. */
  key: string;
  /** Sort direction. */
  dir: 'asc' | 'desc';
}

/** Labels for DataTable controls and empty state. Merged over the English defaults. */
export interface DataTableLabels {
  /** Accessible name for the select-all checkbox. Default: `"Select all"`. */
  selectAll?: string;
  /**
   * Accessible name for each row checkbox. Default: `"Select row"`.
   * Pass a function to create a distinct name per row, for example
   * `(row) => 'Select ' + String(row.name)`.
   */
  selectRow?: string | ((row: RowShape) => string);
  /** Content shown when there are no rows. Default: `"No records."`. */
  empty?: ReactNode;
}

const DEFAULT_DATA_TABLE_LABELS: Required<DataTableLabels> = {
  selectAll: 'Select all',
  selectRow: 'Select row',
  empty: 'No records.',
};

/** Props for {@link DataTable}. */
export interface DataTableProps extends HTMLAttributes<HTMLDivElement> {
  /** Columns rendered in the supplied order. */
  columns: DataTableColumn[];
  /** Row records whose values may be any renderable React node. An `id` value is used for keys and selection. */
  rows: RowShape[];
  /** Controlled sorting state. Pass `null` for unsorted rows. */
  sorting?: DataTableSorting | null;
  /** Initial sorting state when uncontrolled. Default: `null`. */
  defaultSorting?: DataTableSorting | null;
  /** Called after sorting changes. */
  onSortChange?: (sorting: DataTableSorting | null) => void;
  /** Whether to render row and select-all checkboxes. */
  selectable?: boolean;
  /** Controlled selected row identifiers. */
  selected?: Array<string | number>;
  /** Initial selected row identifiers when uncontrolled. */
  defaultSelected?: Array<string | number>;
  /** Called after the selected row identifiers change. */
  onSelectionChange?: (selected: Array<string | number>) => void;
  /** Whether the header remains visible while the table scrolls. */
  stickyHeader?: boolean;
  /** Maximum height for the scrollable table area. */
  maxHeight?: number | string;
  /** Row density. Default: `"comfortable"`. */
  density?: 'comfortable' | 'compact';
  /** Whether to render loading placeholders, or the number of placeholder rows. */
  loading?: boolean | number;
  /** Content shown instead of the default empty-state label. */
  empty?: ReactNode;
  /** Content rendered below the scrollable table area. */
  footer?: ReactNode;
  /** Whether rows highlight on hover. Automatically enabled when `onRowClick` is supplied. */
  hover?: boolean;
  /** Called when a data row is clicked. */
  onRowClick?: (row: RowShape) => void;
  /** Labels for controls and the default empty state. Merged over the English defaults. */
  labels?: DataTableLabels;
}

function compareValues(left: string | number | null, right: string | number | null): number {
  if (left == null) return 1;
  if (right == null) return -1;
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

function rowId(row: RowShape, index: number): string | number {
  const id = row.id;
  return typeof id === 'string' || typeof id === 'number' ? id : index;
}

function columnStyle(column: DataTableColumn): CSSProperties | undefined {
  if (!column.align && column.width == null) return undefined;
  return { textAlign: column.align, width: column.width };
}

function SortIcon({ direction }: { direction: DataTableSorting['dir'] | null }): ReactNode {
  return (
    <svg
      aria-hidden="true"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {direction === 'asc' ? (
        <path d="m18 15-6-6-6 6" />
      ) : direction === 'desc' ? (
        <path d="m6 9 6 6 6-6" />
      ) : (
        <>
          <path d="m7 15 5 5 5-5" />
          <path d="m7 9 5-5 5 5" />
        </>
      )}
    </svg>
  );
}

/**
 * An operational data grid with optional sorting, multi-row selection, sticky headers, loading,
 * and empty states. It renders its own table rather than composing {@link Table}; its first data
 * column receives `.lyra-table__primary` to preserve the repository's Table convention.
 */
export const DataTable = /*#__PURE__*/ forwardRef<HTMLDivElement, DataTableProps>(
  function DataTable(
    {
      columns,
      rows,
      sorting: sortingProp,
      defaultSorting = null,
      onSortChange,
      selectable = false,
      selected: selectedProp,
      defaultSelected = [],
      onSelectionChange,
      stickyHeader = false,
      maxHeight,
      density = 'comfortable',
      loading = false,
      empty,
      footer,
      hover = false,
      onRowClick,
      labels: labelsProp,
      className,
      ...rest
    },
    ref,
  ) {
    const [sorting, setSorting] = useControllableState<DataTableSorting | null>({
      value: sortingProp,
      defaultValue: defaultSorting,
      onChange: onSortChange,
    });
    const [selected, setSelected] = useControllableState<Array<string | number>>({
      value: selectedProp,
      defaultValue: defaultSelected,
      onChange: onSelectionChange,
    });
    const selectAllRef = useRef<HTMLInputElement>(null);
    const labels = { ...DEFAULT_DATA_TABLE_LABELS, ...labelsProp };
    // Fallback ids must come from the ORIGINAL rows order: deriving them from the
    // sorted display index makes selection toggle the wrong row after a sort.
    const idByRow = useMemo(
      () => new Map(rows.map((row, index) => [row, rowId(row, index)])),
      [rows],
    );
    const rowIds = useMemo(
      () => rows.map((row) => idByRow.get(row) as string | number),
      [rows, idByRow],
    );
    const allSelected = rowIds.length > 0 && rowIds.every((id) => selected.includes(id));
    const someSelected = selected.length > 0 && !allSelected;

    useEffect(() => {
      if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected;
    }, [someSelected]);

    const sortedRows = useMemo(() => {
      if (!sorting) return rows;
      const column = columns.find((candidate) => candidate.key === sorting.key);
      if (!column) return rows;
      const valueFor = column.sortValue ?? ((row: RowShape) => row[sorting.key]);
      const sorted = rows.slice().sort((left, right) => {
        const leftValue = valueFor(left);
        const rightValue = valueFor(right);
        return compareValues(
          typeof leftValue === 'string' || typeof leftValue === 'number' ? leftValue : null,
          typeof rightValue === 'string' || typeof rightValue === 'number' ? rightValue : null,
        );
      });
      return sorting.dir === 'desc' ? sorted.reverse() : sorted;
    }, [columns, rows, sorting]);

    const toggleSort = (column: DataTableColumn): void => {
      if (!sorting || sorting.key !== column.key) {
        setSorting({ key: column.key, dir: 'asc' });
      } else if (sorting.dir === 'asc') {
        setSorting({ key: column.key, dir: 'desc' });
      } else {
        setSorting(null);
      }
    };

    const columnSpan = Math.max(1, columns.length + (selectable ? 1 : 0));
    const loadingRows = typeof loading === 'number' ? loading : 5;

    return (
      <div {...rest} ref={ref} className={cx('lyra-table-wrap', className)}>
        <div className="lyra-table-scroll" style={maxHeight == null ? undefined : { maxHeight }}>
          <table
            className={cx(
              'lyra-table',
              (hover || onRowClick) && 'lyra-table--hover',
              density === 'compact' && 'lyra-table--compact',
              stickyHeader && 'lyra-table--sticky',
            )}
          >
            <thead>
              <tr>
                {selectable && (
                  <th className="lyra-table__check">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      className="lyra-checkbox"
                      aria-label={labels.selectAll}
                      checked={allSelected}
                      onChange={() => setSelected(allSelected ? [] : rowIds.slice())}
                    />
                  </th>
                )}
                {columns.map((column) => {
                  const active = sorting?.key === column.key;
                  const sortDirection = active ? sorting.dir : null;
                  return (
                    <th
                      key={column.key}
                      style={columnStyle(column)}
                      aria-sort={
                        active ? (sorting.dir === 'asc' ? 'ascending' : 'descending') : undefined
                      }
                    >
                      {column.sortable ? (
                        <button
                          type="button"
                          className={cx(
                            'lyra-table__sortbtn',
                            active && 'lyra-table__sortbtn--active',
                          )}
                          onClick={() => toggleSort(column)}
                        >
                          {column.label}
                          <SortIcon direction={sortDirection} />
                        </button>
                      ) : (
                        column.label
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: loadingRows }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    {selectable && (
                      <td className="lyra-table__check">
                        <Skeleton width={16} height={16} style={{ display: 'inline-block' }} />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={column === columns[0] ? 'lyra-table__primary' : undefined}
                      >
                        <Skeleton width="60%" height={12} style={{ display: 'inline-block' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={columnSpan} className="lyra-table__emptycell">
                    {empty ?? labels.empty}
                  </td>
                </tr>
              ) : (
                sortedRows.map((row, index) => {
                  const id = idByRow.get(row) ?? rowId(row, index);
                  const isSelected = selected.includes(id);
                  const selectRowLabel =
                    typeof labels.selectRow === 'function'
                      ? labels.selectRow(row)
                      : labels.selectRow;
                  return (
                    <tr
                      key={id}
                      className={isSelected ? 'lyra-table__row--selected' : undefined}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                    >
                      {selectable && (
                        <td className="lyra-table__check">
                          <input
                            type="checkbox"
                            className="lyra-checkbox"
                            aria-label={selectRowLabel}
                            checked={isSelected}
                            onClick={(event) => event.stopPropagation()}
                            onChange={() =>
                              setSelected(
                                isSelected
                                  ? selected.filter((selectedId) => selectedId !== id)
                                  : [...selected, id],
                              )
                            }
                          />
                        </td>
                      )}
                      {columns.map((column, columnIndex) => (
                        <td
                          key={column.key}
                          className={columnIndex === 0 ? 'lyra-table__primary' : undefined}
                          style={columnStyle(column)}
                        >
                          {row[column.key]}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {footer && <div className="lyra-table__footer">{footer}</div>}
      </div>
    );
  },
);
