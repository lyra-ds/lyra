import { useSyncExternalStore, type ReactNode, type ReactPortal } from 'react';
import { createPortal } from 'react-dom';

export interface PortalProps {
  /** Target host element. Defaults to `document.body` once mounted. */
  container?: HTMLElement;
  children: ReactNode;
}

// The store never changes, so the subscribe callback is a no-op. `getSnapshot` returns
// `true` on the client and `getServerSnapshot` returns `false` on the server pass and the
// first (hydration) client render — the lint-clean SSR guard that replaces the classic
// `useState(false)` + `useEffect(setMounted)` pattern (which trips react-hooks/set-state-in-effect).
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * SSR-safe portal (D-21). Renders `null` on the server pass and on the very first client
 * render, then — after a mount effect flips `mounted` — portals `children` into
 * `container ?? document.body`.
 *
 * No `document`/`window` is referenced at module scope; the only DOM access happens inside
 * the render path AFTER the mount guard, so `renderToString` never touches the DOM.
 *
 * TIMING CONSEQUENCE (consumer-visible): because children mount one effect-tick after the
 * owner, any effect that must observe the portaled DOM (e.g. moving initial focus into a
 * Dialog panel) has to live INSIDE the portaled subtree, not in the owner component — the
 * owner's effects run before the portal's children exist. Plan 03-07 relies on this to fix
 * the Dialog initial-focus race.
 *
 * Named export only (D-12).
 */
export function Portal({ container, children }: PortalProps): ReactPortal | null {
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  if (!mounted) {
    return null;
  }

  return createPortal(children, container ?? document.body);
}
