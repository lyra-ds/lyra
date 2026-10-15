import { forwardRef, useCallback, useRef } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Drawer } from '../drawer';
import type { DrawerProps } from '../drawer';
import { cx } from '../internal/cx';

/**
 * Props for {@link AppSidebarOffcanvas}. Mobile width uses `--appsidebar-width-mobile` with an
 * 18rem fallback, capped to the owner document's visual viewport. Panel height and start position
 * follow live viewport size and offsets during zoom, resize and scrolling.
 */
export interface AppSidebarOffcanvasProps extends Omit<
  DrawerProps,
  'children' | 'footer' | 'onClose'
> {
  /** Controls visibility. Closed navigation is absent; the exiting panel is inert. */
  open: boolean;
  /** Heading rendered in the existing Drawer header and used as the dialog name. */
  title: ReactNode;
  /** Accessible name for the close button. Default `"Close"`. */
  closeLabel?: string;
  /** Portal host. Defaults to `document.body`; use a scoped host to retain local tokens. */
  container?: HTMLElement;
  /** Resolves the initial focus target inside the panel on each accepted opening. */
  initialFocusTo?: () => HTMLElement | null;
  /** Resolves the current eligible focus destination after an accepted close. */
  returnFocusTo?: () => HTMLElement | null;
  /** Requests closure; the application owns `open`. */
  onClose: () => void;
  /** One AppSidebar element, filling the panel regardless of its desktop width, retaining its native nav and ref. */
  children: ReactElement;
}

/**
 * A start-edge sidebar adapter using the existing Drawer focus, presence and modal lifecycle.
 * Width uses `--appsidebar-width-mobile` (18rem fallback), capped to the owner document's visual
 * viewport. Panel height and start position follow live viewport size and offsets, including zoom.
 */
export const AppSidebarOffcanvas = /*#__PURE__*/ forwardRef<
  HTMLDivElement,
  AppSidebarOffcanvasProps
>(function AppSidebarOffcanvas({ className, ...props }, ref) {
  const cleanupViewport = useRef<(() => void) | null>(null);
  const attachPanel = useCallback(
    (node: HTMLDivElement | null) => {
      cleanupViewport.current?.();
      cleanupViewport.current = null;
      const view = node?.ownerDocument.defaultView;
      if (node && view) {
        const viewport = view.visualViewport;
        const measure = () => {
          node.style.setProperty(
            '--lyra-appsidebar-viewport-width',
            `${viewport?.width ?? view.innerWidth}px`,
          );
          node.style.setProperty(
            '--lyra-appsidebar-viewport-height',
            `${viewport?.height ?? view.innerHeight}px`,
          );
          node.style.setProperty(
            '--lyra-appsidebar-viewport-left',
            `${viewport?.offsetLeft ?? 0}px`,
          );
          node.style.setProperty('--lyra-appsidebar-viewport-top', `${viewport?.offsetTop ?? 0}px`);
        };
        measure();
        view.addEventListener('resize', measure);
        viewport?.addEventListener('resize', measure);
        viewport?.addEventListener('scroll', measure);
        cleanupViewport.current = () => {
          view.removeEventListener('resize', measure);
          viewport?.removeEventListener('resize', measure);
          viewport?.removeEventListener('scroll', measure);
        };
      }
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  return (
    <Drawer {...props} ref={attachPanel} className={cx('lyra-appsidebar-offcanvas', className)} />
  );
});
