import { Children, cloneElement, forwardRef, isValidElement } from 'react';
import type { CSSProperties, HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cx } from '../internal/cx';
import { useControllableState } from '../internal/use-controllable-state';
import { SidebarGroup } from '../sidebar-group';
import type { SidebarGroupItem } from '../sidebar-group';

type AppSidebarStyle = CSSProperties & {
  '--appsidebar-width'?: string;
};

type RailChildProps = {
  children?: ReactNode;
  href?: unknown;
  title?: string;
  'aria-label'?: string;
};

function textFromChildren(children: ReactNode): string {
  let text = '';
  Children.forEach(children, (child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      text += child;
    } else if (isValidElement(child)) {
      text += textFromChildren((child.props as RailChildProps).children);
    }
  });
  return text.trim();
}

function addRailLinkLabels(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement(child)) return child;

    const element = child as ReactElement<RailChildProps>;
    const nestedChildren = addRailLinkLabels(element.props.children);
    const label =
      element.props['aria-label'] ??
      element.props.title ??
      textFromChildren(element.props.children);
    const isLink = element.props.href !== undefined;

    return cloneElement(element, {
      children: nestedChildren,
      ...(isLink && label
        ? {
            title: element.props.title ?? label,
            'aria-label': element.props['aria-label'] ?? label,
          }
        : {}),
    });
  });
}

/** A data-driven navigation item rendered by {@link AppSidebar}. */
export interface AppSidebarGroupItem {
  /** Stable item identifier passed to the selection callback. */
  id: string;
  /**
   * Visible item text. This is a string so icon-rail mode can always provide a native tooltip and
   * accessible name; use composition mode with {@link SidebarGroup} children for rich labels.
   */
  label: string;
  /** Optional icon displayed before the item label. */
  icon?: ReactNode;
  /** Optional count or status displayed after the item label. */
  badge?: ReactNode;
  /** Mark this item as the current page. */
  active?: boolean;
  /** Called before the sidebar-level selection callback when this item is selected. */
  onSelect?: () => void;
}

/** A data-driven section rendered by {@link AppSidebar}. */
export interface AppSidebarGroup {
  /** Optional section heading. */
  heading?: ReactNode;
  /** Items rendered in the supplied order. */
  items: AppSidebarGroupItem[];
}

/** Localized labels used by the collapse control. */
export interface AppSidebarLabels {
  /** Accessible name and native tooltip when the sidebar is expanded. */
  collapse?: string;
  /** Accessible name and native tooltip when the sidebar is displayed as a rail. */
  expand?: string;
}

/** Props for {@link AppSidebar}. */
export interface AppSidebarProps extends Omit<HTMLAttributes<HTMLElement>, 'onSelect'> {
  /** Optional brand content placed above the navigation groups. */
  brand?: ReactNode;
  /**
   * Convenience data mode. Each group is composed through {@link SidebarGroup} and renders its
   * items as buttons.
   */
  groups?: AppSidebarGroup[];
  /** Optional utility links or user content separated below the navigation groups. */
  footer?: ReactNode;
  /** Sidebar width in pixels while expanded. Default: `260`. */
  width?: number;
  /** Whether to render a control that switches between expanded and icon-rail modes. */
  collapsible?: boolean;
  /** Controlled icon-rail state. */
  collapsed?: boolean;
  /** Initial icon-rail state when uncontrolled. */
  defaultCollapsed?: boolean;
  /** Called whenever the icon-rail state changes. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Called after an item-level callback in data mode. */
  onSelect?: (id: string, item: AppSidebarGroupItem) => void;
  /** Localized labels for the collapse control. */
  labels?: AppSidebarLabels;
  /**
   * Composition mode. Pass {@link SidebarGroup} children (including link children) to preserve
   * their original element type and routing behavior instead of using data-mode buttons.
   */
  children?: ReactNode;
}

/**
 * An application navigation sidebar with brand, grouped navigation, and footer slots. Use
 * `groups` for button-based data navigation, or compose `SidebarGroup` children to retain links.
 */
export const AppSidebar = /*#__PURE__*/ forwardRef<HTMLElement, AppSidebarProps>(
  function AppSidebar(
    {
      brand,
      groups = [],
      footer,
      width = 260,
      collapsible = false,
      collapsed,
      defaultCollapsed = false,
      onCollapsedChange,
      onSelect,
      labels,
      className,
      style,
      children,
      ...rest
    },
    ref,
  ) {
    const [isCollapsed, setCollapsed] = useControllableState<boolean>({
      value: collapsed,
      defaultValue: defaultCollapsed,
      onChange: onCollapsedChange,
    });
    const controlLabel = isCollapsed
      ? (labels?.expand ?? 'Expand sidebar')
      : (labels?.collapse ?? 'Collapse sidebar');
    const sidebarStyle: AppSidebarStyle = {
      '--appsidebar-width': `${isCollapsed ? 64 : width}px`,
      width: 'var(--appsidebar-width)',
      ...style,
    };

    return (
      <nav
        {...rest}
        ref={ref}
        className={cx('lyra-appsidebar', isCollapsed && 'lyra-appsidebar--rail', className)}
        style={sidebarStyle}
      >
        {brand != null && <div className="lyra-appsidebar__brand">{brand}</div>}
        <div className="lyra-appsidebar__groups">
          {groups.map((group, index) => (
            <SidebarGroup
              key={index}
              label={isCollapsed ? undefined : (group.heading as string | undefined)}
              items={
                group.items.map((item) => ({
                  ...item,
                  title: isCollapsed && typeof item.label === 'string' ? item.label : undefined,
                })) as SidebarGroupItem[]
              }
              onSelect={(id, item) => onSelect?.(id, item as AppSidebarGroupItem)}
            />
          ))}
          {isCollapsed ? addRailLinkLabels(children) : children}
        </div>
        {footer != null && <div className="lyra-appsidebar__footer">{footer}</div>}
        {collapsible && (
          <button
            type="button"
            className="lyra-appsidebar__toggle"
            aria-label={controlLabel}
            title={controlLabel}
            onClick={() => setCollapsed(!isCollapsed)}
          >
            <svg
              aria-hidden="true"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isCollapsed ? <path d="m9 18 6-6-6-6" /> : <path d="m15 18-6-6 6-6" />}
            </svg>
          </button>
        )}
      </nav>
    );
  },
);
