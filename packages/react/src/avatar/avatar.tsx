import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../internal/cx';

/** Props for {@link Avatar}. */
export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  /** Image URL. When absent, initials are derived from `name`. */
  src?: string;
  /** Full name, used for initials and the native tooltip. */
  name?: string;
  /** Avatar size. Default `"md"` (32px). */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Avatar shape. Default `"circle"`; use `"square"` for organizations. */
  shape?: 'circle' | 'square';
  /** Optional presence status. */
  status?: 'online' | 'busy' | 'away';
  /** Accessible name for the presence dot. Default: the `status` value itself. */
  statusLabel?: string;
}

/** An image or initials avatar with an optional presence indicator. */
export const Avatar = /*#__PURE__*/ forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { src, name = '', size = 'md', shape = 'circle', status, statusLabel, className, ...rest },
  ref,
) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
  return (
    <span
      {...rest}
      ref={ref}
      className={cx(
        'lyra-avatar',
        `lyra-avatar--${size}`,
        shape === 'square' && 'lyra-avatar--square',
        className,
      )}
      title={name}
    >
      {src ? <img src={src} alt={name} /> : <span aria-hidden="true">{initials}</span>}
      {status && (
        <span
          className={`lyra-avatar__status lyra-avatar__status--${status}`}
          role="status"
          aria-label={statusLabel ?? status}
        />
      )}
    </span>
  );
});

/** Props for {@link AvatarGroup}. */
export interface AvatarGroupProps extends HTMLAttributes<HTMLSpanElement> {
  /** Avatar elements displayed as an overlapping group. */
  children: ReactNode;
}

/** A group of overlapping avatars. */
export const AvatarGroup = /*#__PURE__*/ forwardRef<HTMLSpanElement, AvatarGroupProps>(
  function AvatarGroup({ children, className, ...rest }, ref) {
    return (
      <span {...rest} ref={ref} className={cx('lyra-avatar-group', className)}>
        {children}
      </span>
    );
  },
);
