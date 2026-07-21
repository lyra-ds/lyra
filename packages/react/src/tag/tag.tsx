import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Icon } from '../icon';
import { cx } from '../internal/cx';

/** Props for {@link Tag}. */
export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  /** Called when the optional remove button is clicked. */
  onRemove?: () => void;
  /** Tag content. */
  children: ReactNode;
}

/** A neutral tag for labels and filters, optionally removable. */
export const Tag = /*#__PURE__*/ forwardRef<HTMLSpanElement, TagProps>(function Tag(
  { onRemove, className, children, ...rest },
  ref,
) {
  return (
    <span {...rest} ref={ref} className={cx('lyra-tag', className)}>
      {children}
      {onRemove && (
        <button type="button" className="lyra-tag__remove" aria-label="Remove" onClick={onRemove}>
          <Icon name="x" size={10} />
        </button>
      )}
    </span>
  );
});
