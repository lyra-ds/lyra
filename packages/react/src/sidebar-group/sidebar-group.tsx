import { forwardRef, useState } from 'react';
import type { ReactNode } from 'react';
import { cx } from '../internal/cx';

/** An item rendered by {@link SidebarGroup}. */
export interface SidebarGroupItem {
  /** Stable item identifier passed to the group selection callback. */
  id: string;
  /** Text displayed for the item. */
  label: string;
  /** Optional icon displayed before the item label. */
  icon?: ReactNode;
  /** Optional count or status displayed after the item label. */
  badge?: ReactNode;
  /** Mark this item as the current page. */
  active?: boolean;
  /** Called before the group-level selection callback when this item is selected. */
  onSelect?: () => void;
}

/** Props for {@link SidebarGroup}. */
export interface SidebarGroupProps {
  /** Section label, rendered in uppercase by the styles package. */
  label?: string;
  /** Items rendered in the supplied order. */
  items?: SidebarGroupItem[];
  /** Whether the section label can collapse the item list. */
  collapsible?: boolean;
  /** Whether a collapsible group is initially collapsed. */
  defaultCollapsed?: boolean;
  /** Called with the selected item's id and full item record. */
  onSelect?: (id: string, item: SidebarGroupItem) => void;
  /** Additional class names appended after Lyra classes. */
  className?: string;
  /** Extra content rendered after the group items. */
  children?: ReactNode;
}

/** A sidebar section with optional disclosure behavior and selectable navigation items. */
export const SidebarGroup = /*#__PURE__*/ forwardRef<HTMLDivElement, SidebarGroupProps>(
  function SidebarGroup(
    {
      label,
      items = [],
      collapsible = false,
      defaultCollapsed = false,
      onSelect,
      className,
      children,
    },
    ref,
  ) {
    const [collapsed, setCollapsed] = useState(defaultCollapsed);
    const showItems = !collapsible || !collapsed;

    return (
      <div
        ref={ref}
        className={cx(
          'lyra-sbgroup',
          collapsible && collapsed && 'lyra-sbgroup--collapsed',
          className,
        )}
      >
        {label &&
          (collapsible ? (
            <button
              type="button"
              className="lyra-sbgroup__label lyra-sbgroup__label--btn"
              aria-expanded={!collapsed}
              onClick={() => setCollapsed((previous) => !previous)}
            >
              <span>{label}</span>
              {/*
                The handoff draws this chevron with an Icon and the class only supplies the
                rotation; converting it to a bare span left a 0x0 element, so a collapsible group
                had no visible affordance at all. The SVG is inlined rather than imported from
                Icon — importing Icon here pulls the whole name registry into every consumer that
                imports SidebarGroup, which cost 5.4kB and blew the package's size budget. Drawer's
                close button and Stepper's check mark inline theirs for the same reason.
              */}
              <svg
                className="lyra-sbgroup__chev"
                aria-hidden="true"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          ) : (
            <div className="lyra-sbgroup__label">{label}</div>
          ))}
        {showItems && (
          <div className="lyra-sbgroup__items">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cx('lyra-sbgroup__item', item.active && 'lyra-sbgroup__item--active')}
                aria-current={item.active ? 'page' : undefined}
                onClick={() => {
                  item.onSelect?.();
                  onSelect?.(item.id, item);
                }}
              >
                {item.icon && <span className="lyra-sbgroup__item-icon">{item.icon}</span>}
                <span className="lyra-sbgroup__item-label">{item.label}</span>
                {item.badge != null && (
                  <span className="lyra-sbgroup__item-badge">{item.badge}</span>
                )}
              </button>
            ))}
            {children}
          </div>
        )}
      </div>
    );
  },
);
