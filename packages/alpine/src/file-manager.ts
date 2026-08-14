/** Initial configuration accepted by `x-data="lyraFileManager(...)"`. */
export interface LyraFileManagerOptions {
  /** Initial display mode. Default: `'list'`. */
  defaultView?: 'list' | 'grid';
  /** Initial file-name filter. Default: `''`. */
  defaultQuery?: string;
}

type View = 'list' | 'grid';
type Binding = Record<string, unknown>;

interface LyraFileManagerData {
  view: View;
  query: string;
  root: HTMLElement | null;
  init(): void;
  itemElements(): HTMLElement[];
  visibleTree(): HTMLElement | null;
  applyFilter(): void;
  matchCount(): number;
  selectView(view: View): void;
  search: Binding;
  listButton: Binding;
  gridButton: Binding;
  list: Binding;
  grid: Binding;
  empty: Binding;
}

interface LyraFileManagerMagics {
  $el: HTMLElement;
  $dispatch(name: string, detail?: unknown): void;
  $watch(path: string, callback: () => void): void;
}

type LyraFileManagerState = LyraFileManagerData & LyraFileManagerMagics;

/**
 * Searchable file-manager shell over consumer-rendered list and grid trees.
 *
 * This factory deliberately manages only query filtering, list/grid selection, and the empty
 * state. Consumers serve both trees with `data-name` on every row/card, keep folder ordering on
 * the server, provide breadcrumb and open links/forms, and attach per-item menus with
 * `lyraDropdown`. The match count is derived from the tree selected by `view`; the
 * equivalent hidden items in the other served tree are not counted twice.
 */
export function lyraFileManager({
  defaultView = 'list',
  defaultQuery = '',
}: LyraFileManagerOptions = {}): LyraFileManagerData {
  const state: LyraFileManagerData & ThisType<LyraFileManagerState> = {
    view: defaultView,
    query: defaultQuery,
    root: null,

    init() {
      this.root = this.$el;
      this.$watch('query', () => this.applyFilter());
      this.applyFilter();
    },

    itemElements() {
      return Array.from(this.root?.querySelectorAll<HTMLElement>('[data-name]') ?? []);
    },

    visibleTree() {
      return (
        this.root?.querySelector<HTMLElement>(
          this.view === 'list' ? '[x-bind="list"]' : '[x-bind="grid"]',
        ) ?? null
      );
    },

    applyFilter() {
      const normalizedQuery = this.query.trim().toLowerCase();
      for (const item of this.itemElements()) {
        item.hidden = !item.dataset.name?.toLowerCase().includes(normalizedQuery);
      }
    },

    // Derived on demand instead of held as watcher-written state: a reactive property mutated
    // inside a $watch callback can miss scheduling the dependent x-show effect during the same
    // flush, leaving the empty state stuck. Reading query and view here makes the x-show effect
    // itself re-run and recount from the served markup.
    matchCount() {
      const normalizedQuery = this.query.trim().toLowerCase();
      return Array.from(
        this.visibleTree()?.querySelectorAll<HTMLElement>('[data-name]') ?? [],
      ).filter((item) => (item.dataset.name ?? '').toLowerCase().includes(normalizedQuery)).length;
    },

    selectView(view) {
      if (this.view === view) return;
      this.view = view;
      this.$dispatch('lyra:view', { view });
    },

    search: {
      [':value']() {
        return this.query;
      },
      ['@input'](event: Event) {
        if (event.currentTarget instanceof HTMLInputElement) {
          this.query = event.currentTarget.value;
        }
      },
    },

    listButton: {
      type: 'button',
      [':aria-pressed']() {
        return String(this.view === 'list');
      },
      [':class']() {
        return { 'lyra-fm__view--on': this.view === 'list' };
      },
      ['@click']() {
        this.selectView('list');
      },
    },

    gridButton: {
      type: 'button',
      [':aria-pressed']() {
        return String(this.view === 'grid');
      },
      [':class']() {
        return { 'lyra-fm__view--on': this.view === 'grid' };
      },
      ['@click']() {
        this.selectView('grid');
      },
    },

    list: {
      [':style']() {
        return { display: this.view === 'list' ? null : 'none' };
      },
    },

    grid: {
      [':style']() {
        return { display: this.view === 'grid' ? null : 'none' };
      },
    },

    empty: {
      [':style']() {
        return { display: this.matchCount() === 0 ? null : 'none' };
      },
    },
  };

  return state;
}
