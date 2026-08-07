import { observeFlipPlacement } from './internal/flip-placement';
import type { FlipPlacement } from './internal/flip-placement';

/** Initial configuration accepted by `x-data="lyraDropdown(...)"`. */
export interface LyraDropdownOptions {
  /** Whether the menu starts open. Default: `false`. */
  defaultOpen?: boolean;
  /** Popup alignment. Default: `"start"`. */
  align?: 'start' | 'end';
}

type Binding = Record<string, unknown>;

interface LyraDropdownData {
  open: boolean;
  align: 'start' | 'end';
  menuId: string;
  root: HTMLElement | null;
  pendingFocus: number | null;
  placement: FlipPlacement;
  stopMeasuring: (() => void) | null;
  removeDocumentMouseDown: (() => void) | null;
  init(): void;
  destroy(): void;
  commandItems(): HTMLElement[];
  triggerElement(): HTMLElement | null;
  menuElement(): HTMLElement | null;
  focusPendingItem(): void;
  restoreTriggerFocus(): void;
  closeMenu(restoreFocus?: boolean): void;
  openMenu(focusIndex: number | null): void;
  startPlacement(): void;
  stopPlacement(): void;
  startOutsideClick(): void;
  stopOutsideClick(): void;
  handleTriggerKeyDown(event: KeyboardEvent): void;
  handleMenuItemKeyDown(event: KeyboardEvent): void;
  trigger: Binding;
  menu: Binding;
  item: Binding;
}

interface LyraDropdownMagics {
  $el: HTMLElement;
  $nextTick(callback: () => void): void;
  $watch(path: string, callback: (value: boolean) => void): void;
}

type LyraDropdownState = LyraDropdownData & LyraDropdownMagics;

let nextDropdownId = 0;

/** An APG menu button with real focus roving across its commands. */
export function lyraDropdown({
  defaultOpen = false,
  align = 'start',
}: LyraDropdownOptions = {}): LyraDropdownData {
  const state: LyraDropdownData & ThisType<LyraDropdownState> = {
    open: defaultOpen,
    align,
    menuId: '',
    root: null,
    pendingFocus: null,
    placement: { side: 'down', align: 'start' },
    stopMeasuring: null,
    removeDocumentMouseDown: null,

    init() {
      // In x-bind object handlers Alpine's $el is the BOUND element (a menu item button),
      // not the component root — structural queries must go through the root captured here.
      this.root = this.$el;
      if (!this.$el.id) this.$el.id = `lyra-dropdown-${++nextDropdownId}`;
      this.menuId = `${this.$el.id}-menu`;
      this.$watch('open', (open) => {
        if (!open) {
          this.stopPlacement();
          this.stopOutsideClick();
          return;
        }

        // This $watch effect runs BEFORE the menu's x-show effect (it was registered first,
        // in init()), so at this point the menu is still display:none — focusing it would
        // no-op and measuring it would read offsetHeight 0. $nextTick runs after Alpine
        // finishes flushing the whole batch, i.e. after x-show reveals the menu.
        // The document-level listener does not depend on the menu being visible — arm it
        // immediately (mirrors the React effect). Placement and focus need the revealed menu.
        this.startOutsideClick();
        this.$nextTick(() => {
          if (!this.open) return;
          this.startPlacement();
          this.focusPendingItem();
        });
      });
      if (this.open) {
        this.startOutsideClick();
        this.$nextTick(() => {
          if (!this.open) return;
          this.startPlacement();
        });
      }
    },

    destroy() {
      this.stopPlacement();
      this.stopOutsideClick();
    },

    commandItems() {
      return Array.from(
        this.menuElement()?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
      );
    },

    triggerElement() {
      return this.root?.querySelector<HTMLElement>('.lyra-dropdown__trigger') ?? null;
    },

    menuElement() {
      return this.root?.querySelector<HTMLElement>('[role="menu"]') ?? null;
    },

    focusPendingItem() {
      if (!this.open || this.pendingFocus === null) return;
      const commands = this.commandItems();
      if (commands.length === 0) return;
      const index = this.pendingFocus < 0 ? commands.length - 1 : this.pendingFocus;
      commands[Math.min(index, commands.length - 1)]?.focus({ preventScroll: true });
      this.pendingFocus = null;
    },

    restoreTriggerFocus() {
      this.triggerElement()?.focus();
    },

    closeMenu(restoreFocus = false) {
      this.open = false;
      this.pendingFocus = null;
      if (restoreFocus) this.restoreTriggerFocus();
    },

    openMenu(focusIndex) {
      this.pendingFocus = focusIndex;
      this.open = true;
    },

    startPlacement() {
      this.stopPlacement();
      const trigger = this.triggerElement();
      const menu = this.menuElement();
      if (!trigger || !menu) return;
      this.stopMeasuring = observeFlipPlacement(trigger, menu, (placement) => {
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
        if (!this.root?.contains(event.target as Node)) this.closeMenu();
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
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        this.openMenu(0);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.openMenu(-1);
      }
    },

    handleMenuItemKeyDown(event) {
      if (event.defaultPrevented) return;
      const commands = this.commandItems();
      const currentIndex = commands.indexOf(event.currentTarget as HTMLElement);
      if (currentIndex < 0 || commands.length === 0) return;

      let nextIndex: number | undefined;
      if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % commands.length;
      if (event.key === 'ArrowUp')
        nextIndex = (currentIndex - 1 + commands.length) % commands.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = commands.length - 1;
      if (nextIndex !== undefined) {
        event.preventDefault();
        commands[nextIndex]?.focus();
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        this.closeMenu(true);
      } else if (event.key === 'Tab') {
        // Do not prevent Tab: closing must leave native sequential focus navigation intact.
        this.closeMenu();
      }
    },

    trigger: {
      class: 'lyra-dropdown__trigger',
      role: 'button',
      // Inert on non-button elements; on a native <button> inside a form it prevents the
      // submit the React wrapper avoids by using span[role="button"].
      type: 'button',
      tabindex: 0,
      'aria-haspopup': 'menu',
      [':aria-expanded']() {
        return String(this.open);
      },
      [':aria-controls']() {
        return this.menuId;
      },
      ['@click']() {
        if (this.open) this.closeMenu();
        else this.openMenu(null);
      },
      ['@keydown'](event: KeyboardEvent) {
        this.handleTriggerKeyDown(event);
      },
    },

    menu: {
      role: 'menu',
      [':id']() {
        return this.menuId;
      },
      [':class']() {
        return `lyra-menu lyra-menu--${this.align}${
          this.placement.side === 'up' ? ' lyra-menu--up' : ''
        }`;
      },
      ['x-show']() {
        return this.open;
      },
    },

    item: {
      class: 'lyra-menu__item',
      role: 'menuitem',
      // Parity with the React item (dropdown.tsx renders type="button"): selecting a command
      // inside a form must close the menu, never submit the form.
      type: 'button',
      ['@click']() {
        this.closeMenu(true);
      },
      ['@keydown'](event: KeyboardEvent) {
        this.handleMenuItemKeyDown(event);
      },
    },
  };

  return state;
}
