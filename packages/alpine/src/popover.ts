import { observeFlipPlacement, type FlipPlacement } from './internal/flip-placement';
import { whenVisible } from './internal/when-visible';

/** Initial configuration accepted by `x-data="lyraPopover(...)"`. */
export interface LyraPopoverOptions {
  /** Whether the panel starts open. Default: `false`. */
  defaultOpen?: boolean;
  /** Preferred vertical side. Default: automatic placement. */
  side?: 'auto' | 'bottom' | 'top';
  /** Preferred horizontal alignment. Defaults to automatic placement. */
  align?: 'start' | 'end' | 'center';
  /** Fixed panel width in CSS pixels. */
  width?: number;
  /** Accessible name for the non-modal dialog panel. Default: `"Popover"`. */
  ariaLabel?: string;
}

type Binding = Record<string, unknown>;

interface LyraPopoverData {
  open: boolean;
  side: 'auto' | 'bottom' | 'top';
  align?: 'start' | 'end' | 'center';
  width?: number;
  ariaLabel: string;
  panelId: string;
  root: HTMLElement | null;
  placement: FlipPlacement;
  stopMeasuring: (() => void) | null;
  removeDocumentListeners: (() => void) | null;
  init(): void;
  destroy(): void;
  triggerElement(): HTMLElement | null;
  panelElement(): HTMLElement | null;
  closePopover(restoreFocus?: boolean): void;
  startPlacement(): void;
  stopPlacement(): void;
  startDocumentListeners(): void;
  stopDocumentListeners(): void;
  trigger: Binding;
  panel: Binding;
}

interface LyraPopoverMagics {
  $el: HTMLElement;
  $watch(path: string, callback: (value: boolean) => void): void;
}

type LyraPopoverState = LyraPopoverData & LyraPopoverMagics;

let nextPopoverId = 0;

/** A trigger-anchored, non-modal dialog driven by consumer-rendered markup. */
export function lyraPopover({
  defaultOpen = false,
  side = 'auto',
  align,
  width,
  ariaLabel = 'Popover',
}: LyraPopoverOptions = {}): LyraPopoverData {
  const state: LyraPopoverData & ThisType<LyraPopoverState> = {
    open: defaultOpen,
    side,
    align,
    width,
    ariaLabel,
    panelId: '',
    root: null,
    placement: { side: 'down', align: 'start' },
    stopMeasuring: null,
    removeDocumentListeners: null,

    init() {
      // In x-bind object handlers Alpine's $el is the bound element, not the x-data root.
      // Capture the root once so structural lookup and outside-click containment stay scoped.
      this.root = this.$el;
      if (!this.root.id) this.root.id = `lyra-popover-${++nextPopoverId}`;
      this.panelId = `${this.root.id}-panel`;
      this.$watch('open', (open) => {
        if (!open) {
          this.stopPlacement();
          this.stopDocumentListeners();
          return;
        }

        // React's effect installs document listeners as soon as open changes. The panel still
        // needs to become visible before it can be measured, because x-show reveals it later.
        this.startDocumentListeners();
        const panel = this.panelElement();
        if (panel) {
          whenVisible(
            panel,
            () => !this.open,
            () => this.startPlacement(),
          );
        }
      });
      if (this.open) {
        this.startDocumentListeners();
        const panel = this.panelElement();
        if (panel) {
          whenVisible(
            panel,
            () => !this.open,
            () => this.startPlacement(),
          );
        }
      }
    },

    destroy() {
      this.stopPlacement();
      this.stopDocumentListeners();
    },

    triggerElement() {
      return this.root?.querySelector<HTMLElement>('[x-bind="trigger"]') ?? null;
    },

    panelElement() {
      return this.root?.querySelector<HTMLElement>('[x-bind="panel"]') ?? null;
    },

    closePopover(restoreFocus = false) {
      this.open = false;
      if (restoreFocus) this.triggerElement()?.focus();
    },

    startPlacement() {
      this.stopPlacement();
      const trigger = this.triggerElement();
      const panel = this.panelElement();
      if (!trigger || !panel) return;
      this.stopMeasuring = observeFlipPlacement(
        trigger,
        panel,
        (placement) => {
          this.placement = placement;
        },
        8,
      );
    },

    stopPlacement() {
      this.stopMeasuring?.();
      this.stopMeasuring = null;
      this.placement = { side: 'down', align: 'start' };
    },

    startDocumentListeners() {
      this.stopDocumentListeners();
      const onDocumentMouseDown = (event: MouseEvent): void => {
        if (!this.root?.contains(event.target as Node)) this.closePopover();
      };
      const onDocumentKeyDown = (event: KeyboardEvent): void => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        this.closePopover(true);
      };
      document.addEventListener('mousedown', onDocumentMouseDown);
      document.addEventListener('keydown', onDocumentKeyDown);
      this.removeDocumentListeners = () => {
        document.removeEventListener('mousedown', onDocumentMouseDown);
        document.removeEventListener('keydown', onDocumentKeyDown);
      };
    },

    stopDocumentListeners() {
      this.removeDocumentListeners?.();
      this.removeDocumentListeners = null;
    },

    trigger: {
      type: 'button',
      'aria-haspopup': 'dialog',
      [':aria-expanded']() {
        return String(this.open);
      },
      [':aria-controls']() {
        return this.panelId;
      },
      ['@click']() {
        this.open = !this.open;
      },
      ['@keydown'](event: KeyboardEvent) {
        if (event.defaultPrevented) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this.open = !this.open;
        }
      },
    },

    panel: {
      role: 'dialog',
      [':id']() {
        return this.panelId;
      },
      [':aria-label']() {
        return this.ariaLabel;
      },
      [':style']() {
        return this.width === undefined ? {} : { width: `${this.width}px` };
      },
      [':class']() {
        const resolvedSide =
          this.side === 'auto' ? this.placement.side : this.side === 'bottom' ? 'down' : 'up';
        const resolvedAlign = this.align ?? this.placement.align;
        return `lyra-popover--${resolvedSide === 'down' ? 'bottom' : 'top'} lyra-popover--align-${resolvedAlign}`;
      },
      ['x-show']() {
        return this.open;
      },
    },
  };

  return state;
}
