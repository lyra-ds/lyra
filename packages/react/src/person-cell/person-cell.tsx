import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Avatar } from '../avatar';
import { cx } from '../internal/cx';

/** Props for {@link PersonCell}. */
export interface PersonCellProps extends HTMLAttributes<HTMLDivElement> {
  /** Primary person name. */
  name: ReactNode;
  /** Optional secondary detail, such as an email address or role. */
  detail?: ReactNode;
  /** Avatar image URL. When absent, string names render Avatar initials. */
  src?: string;
}

/** A table-cell composition with an Avatar, a person name, and optional secondary detail. */
export const PersonCell = /*#__PURE__*/ forwardRef<HTMLDivElement, PersonCellProps>(
  function PersonCell({ name, detail, src, className, ...rest }, ref) {
    const avatarName = typeof name === 'string' ? name : undefined;
    return (
      <div {...rest} ref={ref} className={cx('lyra-personcell', className)}>
        <Avatar src={src} name={avatarName} />
        <span className="lyra-personcell__text">
          <span className="lyra-personcell__name">{name}</span>
          {detail != null && <span className="lyra-personcell__detail">{detail}</span>}
        </span>
      </div>
    );
  },
);
