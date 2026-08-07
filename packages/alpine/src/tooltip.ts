import { observeTooltipPlacement } from './internal/tooltip-placement';
import type { TooltipPlacement } from './internal/tooltip-placement';

/** Initial configuration accepted by `x-data="lyraTooltip(...)"`. */
export interface LyraTooltipOptions {
  /** Short, non-interactive text shown for the target. */
  tip: string;
  /** Preferred side of the target. Default: `"top"`. */
  placement?: TooltipPlacement;
}

type Binding = Record<string, unknown>;

interface LyraTooltipData {
  open: boolean;
  tip: string;
  placement: TooltipPlacement;
  resolvedPlacement: TooltipPlacement;
  bubbleId: string;
  targetDescribedBy: string | null;
  host: HTMLElement | null;
  stopMeasuring: (() => void) | null;
  removeDocumentKeyDown: (() => void) | null;
  init(): void;
  destroy(): void;
  targetElement(): HTMLElement | null;
  startPlacement(): void;
  stopPlacement(): void;
  startDocumentKeyDown(): void;
  stopDocumentKeyDown(): void;
  root: Binding;
  target: Binding;
  bubble: Binding;
}

interface LyraTooltipMagics {
  $el: HTMLElement;
  $nextTick(callback: () => void): void;
  $watch(path: string, callback: (value: boolean) => void): void;
}

type LyraTooltipState = LyraTooltipData & LyraTooltipMagics;

let nextTooltipId = 0;

/** A hover- and focus-triggered tooltip over consumer-rendered target and hidden bubble markup. */
export function lyraTooltip({ tip, placement = 'top' }: LyraTooltipOptions): LyraTooltipData {
  const state: LyraTooltipData & ThisType<LyraTooltipState> = {
    // React Tooltip has no controlled/default-open surface: every tooltip starts closed.
    open: false,
    tip,
    placement,
    resolvedPlacement: placement,
    bubbleId: '',
    targetDescribedBy: null,
    host: null,
    stopMeasuring: null,
    removeDocumentKeyDown: null,

    init() {
      // In x-bind object handlers Alpine's $el is the bound element, not this root. Capture the
      // x-data element once so placement and the pre-existing target description stay scoped.
      this.host = this.$el;
      if (!this.host.id) this.host.id = `lyra-tooltip-${++nextTooltipId}`;
      this.bubbleId = `${this.host.id}-tooltip`;
      this.targetDescribedBy = this.targetElement()?.getAttribute('aria-describedby') ?? null;
      this.$watch('open', (open) => {
        if (!open) {
          this.stopPlacement();
          this.stopDocumentKeyDown();
          return;
        }

        // Document Escape must be armed synchronously: a hover-opened tooltip has no focus inside.
        this.startDocumentKeyDown();
        // Placement measures a pseudo-element, so wait until Alpine has applied state bindings.
        this.$nextTick(() => {
          if (this.open) this.startPlacement();
        });
      });
    },

    destroy() {
      this.stopPlacement();
      this.stopDocumentKeyDown();
    },

    targetElement() {
      return this.host?.querySelector<HTMLElement>('[x-bind="target"]') ?? null;
    },

    startPlacement() {
      this.stopPlacement();
      if (!this.host) return;
      this.stopMeasuring = observeTooltipPlacement(
        this.host,
        this.placement,
        (resolvedPlacement) => {
          this.resolvedPlacement = resolvedPlacement;
        },
      );
    },

    stopPlacement() {
      this.stopMeasuring?.();
      this.stopMeasuring = null;
      // React resets the resolved side synchronously when open changes to false.
      this.resolvedPlacement = this.placement;
    },

    startDocumentKeyDown() {
      this.stopDocumentKeyDown();
      const onDocumentKeyDown = (event: KeyboardEvent): void => {
        if (event.key === 'Escape') this.open = false;
      };
      document.addEventListener('keydown', onDocumentKeyDown);
      this.removeDocumentKeyDown = () => {
        document.removeEventListener('keydown', onDocumentKeyDown);
      };
    },

    stopDocumentKeyDown() {
      this.removeDocumentKeyDown?.();
      this.removeDocumentKeyDown = null;
    },

    root: {
      [':data-state']() {
        return this.open ? 'open' : 'closed';
      },
      [':data-tip']() {
        return this.tip;
      },
      [':class']() {
        return this.resolvedPlacement === 'top' ? '' : `lyra-tooltip--${this.resolvedPlacement}`;
      },
      ['@mouseenter']() {
        this.open = true;
      },
      ['@mouseleave']() {
        this.open = false;
      },
      ['@focusin']() {
        this.open = true;
      },
      ['@focusout']() {
        this.open = false;
      },
      ['@keydown'](event: KeyboardEvent) {
        if (event.key === 'Escape') {
          event.preventDefault();
          this.open = false;
        }
      },
    },

    target: {
      [':aria-describedby']() {
        return [this.targetDescribedBy, this.bubbleId].filter(Boolean).join(' ');
      },
    },

    bubble: {
      [':id']() {
        return this.bubbleId;
      },
    },
  };

  return state;
}
