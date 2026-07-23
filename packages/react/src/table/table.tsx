import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../internal/cx';

/** A column rendered by {@link Table}. */
export interface TableColumn {
  /** Key used to read this column's value from each row. */
  key: string;
  /** Accessible column heading content. */
  label: ReactNode;
  /** Horizontal alignment for the heading and every cell in this column. */
  align?: 'left' | 'center' | 'right';
}

/** Props for {@link Table}. */
export interface TableProps extends HTMLAttributes<HTMLDivElement> {
  /** Columns rendered in the supplied order. */
  columns: TableColumn[];
  /** Row records whose values may be any renderable React node. */
  rows: Array<Record<string, ReactNode>>;
  /** Highlight rows on hover. */
  hover?: boolean;
}

/** A declarative data table with semantic header and body sections. */
export const Table = /*#__PURE__*/ forwardRef<HTMLDivElement, TableProps>(function Table(
  { columns, rows, hover = false, className, ...rest },
  ref,
) {
  return (
    <div {...rest} ref={ref} className={cx('lyra-table-wrap', className)}>
      <table className={cx('lyra-table', hover && 'lyra-table--hover')}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={column.align ? { textAlign: column.align } : undefined}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const id = row.id;
            const rowKey = typeof id === 'string' || typeof id === 'number' ? id : rowIndex;
            return (
              <tr key={rowKey}>
                {columns.map((column, columnIndex) => (
                  <td
                    key={column.key}
                    className={columnIndex === 0 ? 'lyra-table__primary' : undefined}
                    style={column.align ? { textAlign: column.align } : undefined}
                  >
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
