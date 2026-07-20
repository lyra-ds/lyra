import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  type AnimationEventHandler,
  type ForwardedRef,
  type HTMLAttributes,
  type KeyboardEventHandler,
  type ReactNode,
  type RefObject,
} from 'react';
import { cx } from '../internal/cx';
import { Portal } from '../internal/portal';
import { useFocusTrap } from '../internal/use-focus-trap';
import { usePresence, type PresenceState } from '../internal/use-presence';
import { useScrollLock } from '../internal/use-scroll-lock';

/**
 * Candidate selector for the panel's FIRST focusable element (D-20 initial focus). The panel
 * itself carries `tabindex="-1"`, so it is excluded here and used only as the fallback target.
 */
const INITIAL_FOCUS_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Props for {@link Dialog}.
 *
 * Extends the native `<div>` attributes so DOM props (`id`, `data-*`, `aria-*`, `onKeyDown`,
 * …) pass through onto the panel element. The native `title` attribute (a `string`) is
 * `Omit`-ted first so the Lyra `title` can be redefined as `ReactNode` — without the `Omit`
 * the interface fails strict typecheck (native `HTMLAttributes.title` is a string attribute).
 */
export interface DialogProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Controls visibility. `true` mounts the overlay + panel; `false` plays the exit then unmounts. */
  open: boolean;
  /** Called by every close path (Esc, overlay click, the × button). The × renders only when this is provided. */
  onClose?: () => void;
  /** Heading rendered in the panel header and wired as the accessible name via `aria-labelledby`. */
  title: ReactNode;
  /** Action buttons rendered in the footer. Omitted → no `.lyra-dialog__footer` chrome. */
  footer?: ReactNode;
  /** Close on the Escape key. Default `true`. */
  closeOnEsc?: boolean;
  /** Close on a click on the overlay backdrop (never on panel content). Default `true`. */
  closeOnOverlayClick?: boolean;
  /** Portal host. Defaults to `document.body`. */
  container?: HTMLElement;
  /** Body content. */
  children: ReactNode;
}

/**
 * Props threaded into {@link DialogPanel}. `rest` carries the caller's remaining `<div>`
 * attributes (already stripped of the Lyra-owned props) to spread on the panel (D-10).
 */
interface DialogPanelProps {
  /** Ref object read by the initial-focus effect and the focus trap (points INTO the portal). */
  panelRef: RefObject<HTMLDivElement | null>;
  /** Merged ref callback that populates {@link panelRef} AND the consumer's forwarded ref. */
  attachPanel: (node: HTMLDivElement | null) => void;
  titleId: string;
  title: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
  closeOnEsc: boolean;
  closeOnOverlayClick: boolean;
  closing: boolean;
  onAnimationEnd: PresenceState['onAnimationEnd'];
  /** Records the element focused at open time, so focus can be restored on close (D-20). */
  captureOpener: (el: Element | null) => void;
  className?: string;
  children: ReactNode;
  rest: HTMLAttributes<HTMLDivElement>;
}

/**
 * The overlay + panel, rendered as the Portal's CHILD. Every DOM-dependent effect lives here —
 * inside the portal subtree — so it runs only after the portaled DOM exists. An open-keyed
 * focus effect in the OUTER component would fire while `panelRef.current` is still `null` and
 * never re-run when the portal content lands (review fix — the Portal mount race, Pitfall 8).
 */
function DialogPanel({
  panelRef,
  attachPanel,
  titleId,
  title,
  footer,
  onClose,
  closeOnEsc,
  closeOnOverlayClick,
  closing,
  onAnimationEnd,
  captureOpener,
  className,
  children,
  rest,
}: DialogPanelProps): ReactNode {
  // Initial focus (D-20): first focusable in the panel, else the panel itself via tabIndex -1.
  // Runs on mount — panelRef.current is guaranteed set because this component lives inside the
  // portal subtree. The opener is captured BEFORE focus moves so restore has the right target.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    captureOpener(document.activeElement);
    const focusable = panel.querySelector<HTMLElement>(INITIAL_FOCUS_SELECTOR);
    (focusable ?? panel).focus();
  }, [panelRef, captureOpener]);

  // Trap Tab/Shift+Tab inside the panel (Pitfall 8 — the ref points into the portal subtree).
  // The zero-candidate branch of the trap keeps focus on the panel (tabIndex -1, below).
  useFocusTrap(panelRef, true);

  const { onKeyDown: restOnKeyDown, onAnimationEnd: restOnAnimationEnd, ...restProps } = rest;

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    restOnKeyDown?.(event);
    if (event.key === 'Escape' && closeOnEsc) {
      onClose?.();
    }
  };

  const handleAnimationEnd: AnimationEventHandler<HTMLDivElement> = (event) => {
    restOnAnimationEnd?.(event);
    onAnimationEnd(event);
  };

  return (
    // The overlay backdrop is a MOUSE convenience for closing (target-identity check below).
    // The keyboard-accessible close paths are Escape (handleKeyDown) and the × button — so the
    // static-element/keyboard-listener a11y rules do not apply to this supplementary handler.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      className={cx('lyra-dialog-overlay', closing && 'lyra-dialog-overlay--closing')}
      onClick={(event) => {
        if (closeOnOverlayClick && event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      {/* The dialog panel owns the Escape-to-close keydown; the aria dialog role is
          non-interactive so jsx-a11y flags the listener, but a modal MUST handle Esc. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        {...restProps}
        ref={attachPanel}
        className={cx('lyra-dialog', closing && 'lyra-dialog--closing', className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onAnimationEnd={handleAnimationEnd}
      >
        <div className="lyra-dialog__header">
          <h2 id={titleId} className="lyra-dialog__title">
            {title}
          </h2>
          {onClose && (
            <button
              type="button"
              className="lyra-dialog__close"
              aria-label="Close"
              onClick={onClose}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="lyra-dialog__body">{children}</div>
        {footer && <div className="lyra-dialog__footer">{footer}</div>}
      </div>
    </div>
  );
}

/**
 * Lyra DS modal dialog (D-15…D-22) — the overlay pilot that locks the portal + focus-trap +
 * presence + scroll-lock recipe every Phase 4 overlay (Drawer, CommandPalette, Toast) reuses.
 *
 * All appearance comes from `@lyra-ds/styles` (`.lyra-dialog-overlay` / `.lyra-dialog`); this
 * component only wires behavior: it renders through {@link Portal} (SSR-guarded, `container`
 * default `document.body`, D-21), keeps the panel mounted through its exit animation via
 * {@link usePresence} (D-17/D-18), traps focus on the portal-subtree panel ref (D-15), moves
 * initial focus into the panel and restores it to the opener when `open` transitions to false
 * (D-20), and locks body scroll while open (D-22). The close glyph is a self-contained inline
 * SVG — Dialog imports NO sibling component, so importing it pulls no `lucide-react`.
 *
 * The panel `<div>` (role="dialog", aria-modal) receives the forwarded ref (D-08).
 *
 * @example
 * const [open, setOpen] = useState(false);
 * <Dialog open={open} onClose={() => setOpen(false)} title="Delete project"
 *   footer={<Button variant="danger" onClick={remove}>Delete</Button>}>
 *   This action cannot be undone.
 * </Dialog>
 */
export const Dialog = /*#__PURE__*/ forwardRef<HTMLDivElement, DialogProps>(function Dialog(
  {
    open,
    onClose,
    title,
    footer,
    closeOnEsc = true,
    closeOnOverlayClick = true,
    container,
    className,
    children,
    ...rest
  },
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<Element | null>(null);

  const { mounted, closing, onAnimationEnd } = usePresence(open);

  // Body scroll lock keys on `open` (not `mounted`) so the page is scrollable again immediately
  // once close is requested, while the exit animation still plays (D-22).
  useScrollLock(open);

  // Focus restore (D-20 + APG): restore ONLY when the controlled `open` prop actually flips to
  // false — not merely when a close is requested. A parent that ignores `onClose` keeps `open`
  // true, so focus stays inside the panel. The opener is captured inside the panel's mount
  // effect (before focus moves in), so this runs after the capture on any open→close cycle.
  useEffect(() => {
    if (open) return;
    const opener = openerRef.current;
    if (opener instanceof HTMLElement) {
      opener.focus();
    }
    openerRef.current = null;
  }, [open]);

  const captureOpener = useCallback((el: Element | null) => {
    openerRef.current = el;
  }, []);

  // Merge the internal panel ref (needed by the focus effect + trap) with the consumer's
  // forwarded ref, both targeting the panel div (D-08).
  const attachPanel = useCallback(
    (node: HTMLDivElement | null) => {
      panelRef.current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    },
    [forwardedRef],
  );

  if (!mounted) {
    return null;
  }

  return (
    <Portal container={container}>
      <DialogPanel
        panelRef={panelRef}
        attachPanel={attachPanel}
        titleId={titleId}
        title={title}
        footer={footer}
        onClose={onClose}
        closeOnEsc={closeOnEsc}
        closeOnOverlayClick={closeOnOverlayClick}
        closing={closing}
        onAnimationEnd={onAnimationEnd}
        captureOpener={captureOpener}
        className={className}
        rest={rest}
      >
        {children}
      </DialogPanel>
    </Portal>
  );
});
