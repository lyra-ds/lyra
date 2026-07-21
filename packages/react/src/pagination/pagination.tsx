import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cx } from '../internal/cx';

/** Props for {@link Pagination}. */
export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
  /** Current one-based page. */
  page: number;
  /** Total number of pages. */
  total: number;
  /** Called with the requested one-based page. */
  onChange?: (page: number) => void;
}

function range(start: number, end: number): number[] {
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);
}

function visiblePages(page: number, total: number): Array<number | '…'> {
  if (total <= 7) return range(1, total);
  if (page <= 4) return [...range(1, 5), '…', total];
  if (page >= total - 3) return [1, '…', ...range(total - 4, total)];
  return [1, '…', page - 1, page, page + 1, '…', total];
}

/** Numeric page navigation. Each enabled page button remains in the normal Tab order. */
export const Pagination = /*#__PURE__*/ forwardRef<HTMLElement, PaginationProps>(function Pagination(
  { page, total, onChange, className, 'aria-label': ariaLabel, ...rest },
  ref,
) {
  const goTo = (nextPage: number): void => {
    if (nextPage >= 1 && nextPage <= total) onChange?.(nextPage);
  };
  const pages = visiblePages(page, total);

  return (
    <nav
      {...rest}
      ref={ref}
      className={cx('lyra-pagination', className)}
      aria-label={ariaLabel ?? 'Pagination'}
    >
      <button
        type="button"
        className="lyra-page"
        disabled={page <= 1}
        onClick={() => goTo(page - 1)}
        aria-label="Previous page"
      >
        ‹
      </button>
      {pages.map((item, index) =>
        item === '…' ? (
          <span key={`gap-${index}`} className="lyra-page lyra-page--gap" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className={cx('lyra-page', item === page && 'lyra-page--active')}
            aria-current={item === page ? 'page' : undefined}
            onClick={() => goTo(item)}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        className="lyra-page"
        disabled={page >= total}
        onClick={() => goTo(page + 1)}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  );
});
