import { cloneElement, forwardRef } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cx } from '../internal/cx';
import { Slot } from '../internal/slot';

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
  /** Native destination. Items without a destination remain buttons. */
  href?: string;
  /** Native link target, for example `_blank`. */
  target?: string;
  /** Native link relationship. */
  rel?: string;
  /** Router link element that receives the item's content, classes and active state. */
  asChild?: ReactElement;
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
      {items.map((item) => {
        const content = (
          <>
            <span className="lyra-bottomnav__icon">{item.icon}</span>
            <span className="lyra-bottomnav__label">{item.label}</span>
          </>
        );
        const props = {
          className: cx('lyra-bottomnav__item', item.active && 'lyra-bottomnav__item--active'),
          'aria-current': item.active ? ('page' as const) : undefined,
          onClick: () => {
            item.onClick?.();
            onSelect?.(item.id, item);
          },
        };
        if (item.asChild)
          return (
            <Slot key={item.id} {...props}>
              {cloneElement(item.asChild, undefined, content)}
            </Slot>
          );
        if (item.href !== undefined)
          return (
            <a key={item.id} {...props} href={item.href} target={item.target} rel={item.rel}>
              {content}
            </a>
          );
        return (
          <button key={item.id} {...props} type="button">
            {content}
          </button>
        );
      })}
    </nav>
  );
});
