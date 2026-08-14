import { observeFlipPlacement, type FlipPlacement } from './internal/flip-placement';

/** Initial configuration accepted by `x-data="lyraWorkspaceSwitcher(...)"`. */
export interface LyraWorkspaceSwitcherOptions {
  /** Whether the workspace listbox starts open. Default: `false`. */
  defaultOpen?: boolean;
}

type Binding = Record<string, unknown>;

interface LyraWorkspaceSwitcherData {
  open: boolean;
  root: HTMLElement | null;
  pendingFocus: number | null;
  placement: FlipPlacement;
  stopMeasuring: (() => void) | null;
  removeDocumentMouseDown: (() => void) | null;
  init(): void;
  destroy(): void;
  optionElements(): HTMLElement[];
  triggerElement(): HTMLElement | null;
  popoverElement(): HTMLElement | null;
  focusPendingOption(): void;
  restoreTriggerFocus(): void;
  closePopover(restoreFocus?: boolean): void;
  openPopover(focusIndex: number): void;
  startPlacement(): void;
  stopPlacement(): void;
  startOutsideClick(): void;
  stopOutsideClick(): void;
  handleTriggerKeyDown(event: KeyboardEvent): void;
  handleOptionKeyDown(event: KeyboardEvent): void;
  trigger: Binding;
  popover: Binding;
  option: Binding;
}

interface LyraWorkspaceSwitcherMagics {
  $dispatch(name: string, detail?: Record<string, unknown>): void;
  $el: HTMLElement;
  $nextTick(callback: () => void): void;
  $watch(path: string, callback: (value: boolean) => void): void;
}

type LyraWorkspaceSwitcherState = LyraWorkspaceSwitcherData & LyraWorkspaceSwitcherMagics;

/** A listbox-style workspace chooser over consumer-rendered markup. */
export function lyraWorkspaceSwitcher({
  defaultOpen = false,
}: LyraWorkspaceSwitcherOptions = {}): LyraWorkspaceSwitcherData {
  const state: LyraWorkspaceSwitcherData & ThisType<LyraWorkspaceSwitcherState> = {
    open: defaultOpen,
    root: null,
    pendingFocus: null,
    placement: { side: 'down', align: 'start' },
    stopMeasuring: null,
    removeDocumentMouseDown: null,

    init() {
      // In x-bind object handlers Alpine's $el is the bound element, not the x-data root.
      // Capture the root once so option lookup and outside-click containment stay scoped.
      this.root = this.$el;
      this.$watch('open', (open) => {
        if (!open) {
          this.stopPlacement();
          this.stopOutsideClick();
          return;
        }

        this.startOutsideClick();
        this.$nextTick(() => {
          if (!this.open) return;
          this.startPlacement();
          this.focusPendingOption();
        });
      });
      if (this.open) {
        this.startOutsideClick();
        this.$nextTick(() => {
          if (this.open) this.startPlacement();
        });
      }
    },

    destroy() {
      this.stopPlacement();
      this.stopOutsideClick();
    },

    optionElements() {
      return Array.from(this.root?.querySelectorAll<HTMLElement>('[role="option"]') ?? []);
    },

    triggerElement() {
      return this.root?.querySelector<HTMLElement>('.lyra-wssw__trigger') ?? null;
    },

    popoverElement() {
      return this.root?.querySelector<HTMLElement>('[role="listbox"]') ?? null;
    },

    focusPendingOption() {
      if (!this.open || this.pendingFocus === null) return;
      const options = this.optionElements();
      if (options.length === 0) return;
      const selectedIndex = options.findIndex(
        (option) => option.getAttribute('aria-selected') === 'true',
      );
      const target =
        this.pendingFocus === -2
          ? Math.max(selectedIndex, 0)
          : this.pendingFocus < 0
            ? options.length - 1
            : this.pendingFocus;
      options[Math.min(target, options.length - 1)]?.focus({ preventScroll: true });
      this.pendingFocus = null;
    },

    restoreTriggerFocus() {
      this.triggerElement()?.focus();
    },

    closePopover(restoreFocus = false) {
      this.open = false;
      this.pendingFocus = null;
      if (restoreFocus) this.restoreTriggerFocus();
    },

    openPopover(focusIndex) {
      this.pendingFocus = focusIndex;
      this.open = true;
    },

    startPlacement() {
      this.stopPlacement();
      const trigger = this.triggerElement();
      const popover = this.popoverElement();
      if (!trigger || !popover) return;
      this.stopMeasuring = observeFlipPlacement(trigger, popover, (placement) => {
        this.placement = placement;
      });
    },

    stopPlacement() {
      this.stopMeasuring?.();
      this.stopMeasuring = null;
      this.placement = { side: 'down', align: 'start' };
    },

    startOutsideClick() {
      this.stopOutsideClick();
      const onDocumentMouseDown = (event: MouseEvent): void => {
        if (!this.root?.contains(event.target as Node)) this.closePopover();
      };
      document.addEventListener('mousedown', onDocumentMouseDown);
      this.removeDocumentMouseDown = () => {
        document.removeEventListener('mousedown', onDocumentMouseDown);
      };
    },

    stopOutsideClick() {
      this.removeDocumentMouseDown?.();
      this.removeDocumentMouseDown = null;
    },

    handleTriggerKeyDown(event) {
      if (event.defaultPrevented) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.openPopover(-2);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.openPopover(0);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.openPopover(-1);
      }
    },

    handleOptionKeyDown(event) {
      if (event.defaultPrevented) return;
      const options = this.optionElements();
      const currentIndex = options.indexOf(event.currentTarget as HTMLElement);
      if (currentIndex < 0 || options.length === 0) return;

      let nextIndex: number | undefined;
      if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % options.length;
      if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + options.length) % options.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = options.length - 1;
      if (nextIndex !== undefined) {
        event.preventDefault();
        options[nextIndex]?.focus();
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        this.closePopover(true);
      } else if (event.key === 'Tab') {
        this.closePopover();
      }
    },

    trigger: {
      type: 'button',
      'aria-haspopup': 'listbox',
      [':aria-expanded']() {
        return String(this.open);
      },
      ['@click']() {
        if (this.open) this.closePopover();
        else this.openPopover(-2);
      },
      ['@keydown'](event: KeyboardEvent) {
        this.handleTriggerKeyDown(event);
      },
    },

    popover: {
      role: 'listbox',
      [':class']() {
        // Object syntax removes a server-rendered up modifier again after placement changes.
        return { 'lyra-wssw__pop--up': this.placement.side === 'up' };
      },
      [':style']() {
        return { display: this.open ? null : 'none' };
      },
    },

    option: {
      type: 'button',
      role: 'option',
      ['@keydown'](event: KeyboardEvent) {
        this.handleOptionKeyDown(event);
      },
      ['@click']() {
        this.$dispatch('lyra:change', { id: this.$el.dataset.id ?? '' });
        this.closePopover(true);
      },
    },
  };

  return state;
}
