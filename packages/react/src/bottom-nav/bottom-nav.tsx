import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../internal/cx';

/** An item rendered by {@link BottomNav}. */
export interface BottomNavItem {
  /** Stable item identifier passed to the selection callback. */
  id: string;
  /** Icon displayed above the item label. */
  icon: ReactNode;
  /** Visible item label. */
  label: ReactNode;
  /** Mark this item as the current page. */
  active?: boolean;
  /** Called before the navigation-level selection callback when this item is selected. */
  onClick?: () => void;
}

/** Props for {@link BottomNav}. */
export interface BottomNavProps extends Omit<HTMLAttributes<HTMLElement>, 'onSelect'> {
  /** Navigation items, typically three to five destinations. */
  items: BottomNavItem[];
  /** Called after an item-level callback with the selected item. */
  onSelect?: (id: string, item: BottomNavItem) => void;
}

/** A compact mobile navigation bar with active-page semantics. */
export const BottomNav = /*#__PURE__*/ forwardRef<HTMLElement, BottomNavProps>(function BottomNav(
  { items, onSelect, className, ...rest },
  ref,
) {
  return (
    <nav {...rest} ref={ref} className={cx('lyra-bottomnav', className)}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={cx('lyra-bottomnav__item', item.active && 'lyra-bottomnav__item--active')}
          aria-current={item.active ? 'page' : undefined}
          onClick={() => {
            item.onClick?.();
            onSelect?.(item.id, item);
          }}
        >
          <span className="lyra-bottomnav__icon">{item.icon}</span>
          <span className="lyra-bottomnav__label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
});
