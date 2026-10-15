import { forwardRef, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { IconButton } from '../icon-button';
import type { IconButtonProps } from '../icon-button';
import { cx } from '../internal/cx';
import { requestSidebarChange, useAppSidebarHotkey } from '../internal/use-app-sidebar-hotkey';

/** Props for {@link AppSidebarTrigger}. */
export interface AppSidebarTriggerProps extends Omit<IconButtonProps, 'label' | 'children'> {
  /** Application-owned state: `true` means the controlled sidebar is collapsed or closed. */
  collapsed: boolean;
  /** Requests the next state without keeping an internal mirror. */
  onCollapsedChange: (collapsed: boolean) => void;
  /** Id of the controlled navigation or offcanvas panel. */
  controls: string;
  /** Opt into document-scoped Cmd/Ctrl+B ownership. Default `false`. */
  hotkey?: boolean;
  /** Accessible name and native tooltip. Default `"Toggle sidebar"`. */
  label?: string;
  /** Visual variant. Default `"ghost"`. */
  variant?: IconButtonProps['variant'];
  /** Glyph sizing preset. Default `"md"`; the target is at least 44px for every size. */
  size?: IconButtonProps['size'];
  /** Optional glyph; defaults to an inline panel-left icon. */
  children?: ReactNode;
}

/** A controlled native sidebar button for topbars and other application-owned placements. */
export const AppSidebarTrigger = /*#__PURE__*/ forwardRef<
  HTMLButtonElement,
  AppSidebarTriggerProps
>(function AppSidebarTrigger(
  {
    collapsed,
    onCollapsedChange,
    controls,
    hotkey = false,
    label = 'Toggle sidebar',
    variant = 'ghost',
    size = 'md',
    children,
    className,
    disabled,
    onClick,
    ...rest
  },
  forwardedRef,
) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const attach = useCallback(
    (node: HTMLButtonElement | null) => {
      ref.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );
  useAppSidebarHotkey(ref, controls, collapsed, onCollapsedChange, hotkey && !disabled);
  return (
    <IconButton
      {...rest}
      ref={attach}
      type="button"
      label={label}
      variant={variant}
      size={size}
      className={cx('lyra-appsidebar-trigger', className)}
      disabled={disabled}
      aria-controls={controls}
      aria-expanded={!collapsed}
      onClick={(event) => {
        if (disabled) return;
        onClick?.(event);
        if (!event.defaultPrevented)
          requestSidebarChange({
            trigger: event.currentTarget,
            controls,
            collapsed,
            change: onCollapsedChange,
          });
      }}
    >
      {children ?? (
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18" />
        </svg>
      )}
    </IconButton>
  );
});
