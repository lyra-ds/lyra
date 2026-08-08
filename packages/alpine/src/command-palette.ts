import { moveActiveIndex, scrollActiveIntoView } from './internal/active-descendant';
import { attachFocusTrap } from './internal/focus-trap';
import { createPresence, type PresenceController } from './internal/presence';
import { lockScroll, unlockScroll } from './internal/scroll-lock';
import { whenVisible } from './internal/when-visible';

/** A command rendered by {@link lyraCommandPalette}. */
export interface LyraCommandPaletteItem {
  /** Stable consumer-owned item key. */
  id: string;
  /** Primary command text and search term. */
  label: string;
  /** Optional secondary text rendered by the consumer template and included in filtering. */
  hint?: string;
  /** Optional displayed keyboard shortcut. */
  shortcut?: string;
}

/** A labelled collection of command items. */
export interface LyraCommandPaletteGroup {
  /** Optional visible group label. */
  label?: string;
  /** Commands in this group. */
  items: LyraCommandPaletteItem[];
}

/** Labels for the keyboard hints in a command palette footer. */
export interface LyraCommandPaletteHints {
  /** Label after the ↑↓ keys. */
  navigate?: string;
  /** Label after the ↵ key. */
  select?: string;
  /** Label after the esc key. */
  close?: string;
}

/** Initial configuration accepted by `x-data="lyraCommandPalette(...)"`. */
export interface LyraCommandPaletteOptions {
  /** Command groups rendered through nested consumer `x-for` templates. Default: `[]`. */
  groups?: LyraCommandPaletteGroup[];
  /** Overlay visibility; modelable with `x-modelable="open"`. Ignored in inline mode. */
  open?: boolean;
  /** Search input placeholder. Default: `"Type a command or search…"`. */
  placeholder?: string;
  /** Text shown before a quoted unmatched query. Default: `"No results for"`. */
  emptyMessage?: string;
  /** Accessible search-input name. Default: `"Search commands"`. */
  searchLabel?: string;
  /** Partial override for footer hint labels. */
  hints?: LyraCommandPaletteHints;
  /** Command/Ctrl key used to toggle the overlay. Falsy disables it. Default: `"k"`. */
  hotkey?: string | false;
  /** Render only the panel, without modal behavior. Default: `false`. */
  inline?: boolean;
  /** Accessible dialog name in overlay mode. Default: `"Command palette"`. */
  label?: string;
}

interface IndexedCommandItem {
  item: LyraCommandPaletteItem;
  index: number;
}

interface VisibleCommandGroup {
  label?: string;
  index: number;
  items: IndexedCommandItem[];
}

type Binding = Record<string, unknown>;

interface LyraCommandPaletteData {
  open: boolean;
  mounted: boolean;
  closing: boolean;
  query: string;
  activeIndex: number;
  hints: Required<LyraCommandPaletteHints>;
  root: HTMLElement | null;
  baseId: string;
  opener: Element | null;
  presence: PresenceController | null;
  focusTrapCleanup: (() => void) | null;
  scrollLocked: boolean;
  removeDocumentKeyDown: (() => void) | null;
  init(): void;
  destroy(): void;
  visibleGroups(): VisibleCommandGroup[];
  flatItems(): IndexedCommandItem[];
  activeOptionId(): string | undefined;
  optionId(index: number): string;
  itemClass(index: number): Record<string, boolean>;
  item(index: number): Binding;
  isActive(index: number): boolean;
  groupLabelId(group: VisibleCommandGroup): string;
  groupLabelledby(group: VisibleCommandGroup): string | undefined;
  emptyText(): string;
  panelElement(): HTMLElement | null;
  searchElement(): HTMLInputElement | null;
  listElement(): HTMLElement | null;
  activateOpen(): void;
  activateClose(): void;
  focusSearch(): void;
  attachFocusTrap(): void;
  detachFocusTrap(): void;
  restoreOpener(): void;
  scheduleActiveScroll(): void;
  onSearchInput(value: string): void;
  onSearchKeydown(event: KeyboardEvent): void;
  setActive(index: number): void;
  pick(item: LyraCommandPaletteItem): void;
  overlay: Binding;
  panel: Binding;
  search: Binding;
  list: Binding;
  empty: Binding;
}

interface LyraCommandPaletteMagics {
  $dispatch(name: string, detail?: Record<string, unknown>): void;
  $el: HTMLElement;
  $nextTick(callback: () => void): void;
  $watch(path: string, callback: (value: boolean) => void): void;
}

type LyraCommandPaletteState = LyraCommandPaletteData & LyraCommandPaletteMagics;

const DEFAULT_HINTS: Required<LyraCommandPaletteHints> = {
  navigate: 'navigate',
  select: 'select',
  close: 'close',
};

let nextCommandPaletteId = 0;

/**
 * A Command/Ctrl+K command palette with grouped filtering and APG `aria-activedescendant`
 * navigation. It owns behavior only: the consumer serves the overlay, panel, icon slot, and
 * nested group/item templates.
 *
 * ```html
 * <div x-data="lyraCommandPalette({ groups })" x-modelable="open" x-model="commandOpen">
 *   <!-- Trigger is ordinary consumer markup; its click only changes the modelable state. -->
 *   <button class="lyra-cmdk-trigger" type="button" aria-label="Search commands" @click="open = true">
 *     <svg class="lyra-cmdk-trigger__icon" aria-hidden="true" viewBox="0 0 24 24" fill="none"
 *       stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
 *       <circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>
 *     </svg>
 *     <span class="lyra-cmdk-trigger__label">Search commands</span><kbd class="lyra-kbd">⌘ K</kbd>
 *   </button>
 *   <div class="lyra-cmdk-overlay" x-bind="overlay">
 *     <div class="lyra-cmdk" x-bind="panel">
 *       <div class="lyra-cmdk__search"><!-- consumer search icon slot --><input x-bind="search"><kbd class="lyra-kbd">esc</kbd></div>
 *       <div class="lyra-cmdk__body" x-bind="list">
 *         <p class="lyra-cmdk__empty" x-bind="empty" x-text="emptyText()"></p>
 *         <template x-for="group in visibleGroups()" :key="group.index">
 *           <div class="lyra-cmdk__group" role="group" :aria-labelledby="groupLabelledby(group)">
 *             <template x-if="group.label"><span class="lyra-cmdk__group-label" :id="groupLabelId(group)" x-text="group.label"></span></template>
 *             <template x-for="entry in group.items" :key="entry.item.id">
 *               <button class="lyra-cmdk__item" x-bind="item(entry.index)" :id="optionId(entry.index)"
 *                 :class="itemClass(entry.index)" :aria-selected="isActive(entry.index) ? 'true' : 'false'"
 *                 @mouseenter="setActive(entry.index)" @click="pick(entry.item)">
 *                 <span class="lyra-cmdk__item-icon"><!-- consumer icon template slot --></span>
 *                 <span class="lyra-cmdk__item-label" x-text="entry.item.label"></span>
 *                 <span class="lyra-cmdk__item-hint" x-show="entry.item.hint" x-text="entry.item.hint"></span>
 *                 <span class="lyra-cmdk__shortcut" x-show="entry.item.shortcut"><kbd class="lyra-kbd" x-text="entry.item.shortcut"></kbd></span>
 *               </button>
 *             </template>
 *           </div>
 *         </template>
 *       </div>
 *       <div class="lyra-cmdk__footer">
 *         <span><kbd class="lyra-kbd">↑</kbd><kbd class="lyra-kbd">↓</kbd> <span x-text="hints.navigate"></span></span>
 *         <span><kbd class="lyra-kbd">↵</kbd> <span x-text="hints.select"></span></span>
 *         <span><kbd class="lyra-kbd">esc</kbd> <span x-text="hints.close"></span></span>
 *       </div>
 *     </div>
 *   </div>
 * </div>
 * ```
 *
 * ```html
 * <!-- Inline mode uses the same panel contents, but deliberately has no overlay. -->
 * <div class="lyra-cmdk" x-data="lyraCommandPalette({ groups, inline: true })" x-bind="panel">
 *   <div class="lyra-cmdk__search"><input x-bind="search"><kbd class="lyra-kbd">esc</kbd></div>
 *   <div class="lyra-cmdk__body" x-bind="list">
 *     <p class="lyra-cmdk__empty" x-bind="empty" x-text="emptyText()"></p>
 *     <template x-for="group in visibleGroups()" :key="group.index">
 *       <div class="lyra-cmdk__group" role="group" :aria-labelledby="groupLabelledby(group)">
 *         <template x-if="group.label"><span class="lyra-cmdk__group-label" :id="groupLabelId(group)" x-text="group.label"></span></template>
 *         <template x-for="entry in group.items" :key="entry.item.id">
 *           <button class="lyra-cmdk__item" x-bind="item(entry.index)" :id="optionId(entry.index)"
 *             :class="itemClass(entry.index)" :aria-selected="isActive(entry.index) ? 'true' : 'false'"
 *             @mouseenter="setActive(entry.index)" @click="pick(entry.item)">
 *             <span class="lyra-cmdk__item-icon"><!-- consumer icon template slot --></span>
 *             <span class="lyra-cmdk__item-label" x-text="entry.item.label"></span>
 *             <span class="lyra-cmdk__item-hint" x-show="entry.item.hint" x-text="entry.item.hint"></span>
 *             <span class="lyra-cmdk__shortcut" x-show="entry.item.shortcut"><kbd class="lyra-kbd" x-text="entry.item.shortcut"></kbd></span>
 *           </button>
 *         </template>
 *       </div>
 *     </template>
 *   </div>
 *   <div class="lyra-cmdk__footer">
 *     <span><kbd class="lyra-kbd">↑</kbd><kbd class="lyra-kbd">↓</kbd> <span x-text="hints.navigate"></span></span>
 *     <span><kbd class="lyra-kbd">↵</kbd> <span x-text="hints.select"></span></span>
 *     <span><kbd class="lyra-kbd">esc</kbd> <span x-text="hints.close"></span></span>
 *   </div>
 * </div>
 * ```
 */
export function lyraCommandPalette({
  groups = [],
  open = false,
  placeholder = 'Type a command or search…',
  emptyMessage = 'No results for',
  searchLabel = 'Search commands',
  hints,
  hotkey = 'k',
  inline = false,
  label = 'Command palette',
}: LyraCommandPaletteOptions = {}): LyraCommandPaletteData {
  const state: LyraCommandPaletteData & ThisType<LyraCommandPaletteState> = {
    open,
    mounted: inline || open,
    closing: false,
    query: '',
    activeIndex: 0,
    hints: { ...DEFAULT_HINTS, ...hints },
    root: null,
    baseId: '',
    opener: null,
    presence: null,
    focusTrapCleanup: null,
    scrollLocked: false,
    removeDocumentKeyDown: null,

    init() {
      this.root = this.$el;
      this.baseId = this.root.id || `lyra-command-palette-${++nextCommandPaletteId}`;
      if (!this.root.id) this.root.id = this.baseId;

      if (inline) {
        this.focusSearch();
        this.$watch('activeIndex', () => this.scheduleActiveScroll());
        this.$watch('query', () => this.scheduleActiveScroll());
        return;
      }

      this.presence = createPresence(this.open, (closing) => {
        this.closing = closing;
        this.mounted = this.open || closing;
        if (!closing && !this.open && this.scrollLocked) {
          unlockScroll();
          this.scrollLocked = false;
        }
      });
      this.$watch('open', (nextOpen) => {
        if (nextOpen) this.activateOpen();
        else this.activateClose();
      });
      this.$watch('activeIndex', () => this.scheduleActiveScroll());
      this.$watch('query', () => this.scheduleActiveScroll());
      if (hotkey) {
        const onDocumentKeyDown = (event: KeyboardEvent): void => {
          if (
            (event.metaKey || event.ctrlKey) &&
            event.key.toLocaleLowerCase() === hotkey.toLocaleLowerCase()
          ) {
            event.preventDefault();
            this.open = !this.open;
          }
        };
        document.addEventListener('keydown', onDocumentKeyDown);
        this.removeDocumentKeyDown = () =>
          document.removeEventListener('keydown', onDocumentKeyDown);
      }
      if (this.open) this.activateOpen();
    },

    destroy() {
      this.detachFocusTrap();
      this.presence?.destroy();
      this.presence = null;
      this.removeDocumentKeyDown?.();
      this.removeDocumentKeyDown = null;
      if (this.scrollLocked) unlockScroll();
      this.scrollLocked = false;
      this.opener = null;
      this.root = null;
    },

    visibleGroups() {
      const normalizedQuery = this.query.toLocaleLowerCase();
      const flat: IndexedCommandItem[] = [];
      const visible: VisibleCommandGroup[] = [];
      groups.forEach((group, groupIndex) => {
        const matches = group.items.filter(
          (item) =>
            !normalizedQuery ||
            item.label.toLocaleLowerCase().includes(normalizedQuery) ||
            item.hint?.toLocaleLowerCase().includes(normalizedQuery),
        );
        if (matches.length === 0) return;
        const items = matches.map((item) => {
          const indexed = { item, index: flat.length };
          flat.push(indexed);
          return indexed;
        });
        visible.push({ label: group.label, index: groupIndex, items });
      });
      return visible;
    },

    flatItems() {
      return this.visibleGroups().flatMap((group) => group.items);
    },

    activeOptionId() {
      return this.flatItems()[this.activeIndex] ? this.optionId(this.activeIndex) : undefined;
    },

    optionId(index) {
      return `${this.baseId}-option-${index}`;
    },

    itemClass(index) {
      return { 'lyra-cmdk__item--active': this.isActive(index) };
    },

    item(_index) {
      return { type: 'button', tabindex: '-1', role: 'option' };
    },

    isActive(index) {
      return index === this.activeIndex;
    },

    groupLabelId(group) {
      return `${this.baseId}-group-${group.index}`;
    },

    groupLabelledby(group) {
      return group.label ? this.groupLabelId(group) : undefined;
    },

    emptyText() {
      return `${emptyMessage} “${this.query}”.`;
    },

    panelElement() {
      return this.root?.querySelector<HTMLElement>('.lyra-cmdk') ?? null;
    },

    searchElement() {
      return this.root?.querySelector<HTMLInputElement>('[role="combobox"]') ?? null;
    },

    listElement() {
      return this.root?.querySelector<HTMLElement>('[role="listbox"]') ?? null;
    },

    activateOpen() {
      this.mounted = true;
      this.presence?.update(true);
      this.query = '';
      this.activeIndex = 0;
      this.opener = document.activeElement;
      if (!this.scrollLocked) {
        lockScroll();
        this.scrollLocked = true;
      }
      this.focusSearch();
    },

    activateClose() {
      this.presence?.update(false);
      this.detachFocusTrap();
      this.restoreOpener();
    },

    focusSearch() {
      this.$nextTick(() => {
        const panel = this.panelElement();
        if (!panel) return;
        whenVisible(
          panel,
          () => !inline && !this.open,
          () => {
            if (!inline) this.attachFocusTrap();
            this.searchElement()?.focus({ preventScroll: true });
            this.scheduleActiveScroll();
          },
        );
      });
    },

    attachFocusTrap() {
      this.detachFocusTrap();
      const panel = this.panelElement();
      if (panel) this.focusTrapCleanup = attachFocusTrap(panel);
    },

    detachFocusTrap() {
      this.focusTrapCleanup?.();
      this.focusTrapCleanup = null;
    },

    restoreOpener() {
      if (this.opener instanceof HTMLElement) this.opener.focus();
      this.opener = null;
    },

    scheduleActiveScroll() {
      this.$nextTick(() => {
        const list = this.listElement();
        const activeId = this.activeOptionId();
        if (list) scrollActiveIntoView(list, activeId ? document.getElementById(activeId) : null);
      });
    },

    onSearchInput(value) {
      this.query = value;
      this.activeIndex = 0;
    },

    onSearchKeydown(event) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const next = moveActiveIndex(event.key, this.activeIndex, this.flatItems().length);
        if (next !== null) this.activeIndex = next;
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        const active = this.flatItems()[this.activeIndex];
        if (active) this.pick(active.item);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        if (!inline) this.open = false;
      }
    },

    setActive(index) {
      this.activeIndex = index;
    },

    pick(item) {
      this.$dispatch('lyra:select', { item });
      if (!inline) this.open = false;
    },

    overlay: {
      ['x-show']() {
        return this.mounted;
      },
      [':class']() {
        return { 'lyra-cmdk-overlay--closing': this.closing };
      },
      ['@click'](event: MouseEvent) {
        if (event.target === event.currentTarget) this.open = false;
      },
      ['@animationend'](event: AnimationEvent) {
        this.presence?.onAnimationEnd(event);
      },
    },

    panel: {
      [':class']() {
        return { 'lyra-cmdk--closing': this.closing };
      },
      [':role']() {
        return inline ? undefined : 'dialog';
      },
      [':aria-modal']() {
        return inline ? undefined : 'true';
      },
      [':aria-label']() {
        return inline ? undefined : label;
      },
      ['@animationend'](event: AnimationEvent) {
        this.presence?.onAnimationEnd(event);
      },
    },

    search: {
      role: 'combobox',
      'aria-expanded': 'true',
      [':aria-controls']() {
        return `${this.baseId}-listbox`;
      },
      'aria-autocomplete': 'list',
      [':aria-activedescendant']() {
        return this.activeOptionId();
      },
      [':aria-label']() {
        return searchLabel;
      },
      [':value']() {
        return this.query;
      },
      [':placeholder']() {
        return placeholder;
      },
      ['@input'](event: InputEvent) {
        this.onSearchInput((event.currentTarget as HTMLInputElement).value);
      },
      ['@keydown'](event: KeyboardEvent) {
        this.onSearchKeydown(event);
      },
    },

    list: {
      [':id']() {
        return `${this.baseId}-listbox`;
      },
      role: 'listbox',
    },

    empty: {
      ['x-show']() {
        return this.flatItems().length === 0;
      },
    },
  };

  return state;
}
