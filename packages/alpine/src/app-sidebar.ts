/** Localized labels used by the sidebar collapse control. */
export interface LyraAppSidebarLabels {
  /** Accessible name and native tooltip while the sidebar is expanded. */
  collapse?: string;
  /** Accessible name and native tooltip while the sidebar is displayed as a rail. */
  expand?: string;
}

/** Initial configuration accepted by `x-data="lyraAppSidebar(...)"`. */
export interface LyraAppSidebarOptions {
  /** Whether the sidebar starts in its icon-rail state. Default: `false`. */
  defaultCollapsed?: boolean;
  /** Sidebar width in pixels while expanded. Default: `260`. */
  width?: number;
  /** Localized labels for the collapse control. */
  labels?: LyraAppSidebarLabels;
}

type Binding = Record<string, unknown>;

interface LyraAppSidebarData {
  collapsed: boolean;
  root: Binding;
  toggle: Binding;
}

interface LyraAppSidebarMagics {
  $dispatch(name: string, detail?: Record<string, unknown>): void;
}

type LyraAppSidebarState = LyraAppSidebarData & LyraAppSidebarMagics;

/**
 * App-sidebar rail behavior over consumer-rendered markup.
 *
 * ```html
 * <nav class="lyra-appsidebar" x-data="lyraAppSidebar({ width: 260 })"
 *   x-modelable="collapsed" x-model="sidebarCollapsed" x-bind="root">
 *   <div class="lyra-appsidebar__brand">…</div>
 *   <div class="lyra-appsidebar__groups">
 *     <div class="lyra-sbgroup">
 *       <a class="lyra-sbgroup__item" href="/overview" title="Overview" aria-label="Overview">
 *         <span class="lyra-sbgroup__item-label">Overview</span>
 *       </a>
 *     </div>
 *   </div>
 *   <div class="lyra-appsidebar__footer">…</div>
 *   <button class="lyra-appsidebar__toggle" x-bind="toggle">
 *     <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none"
 *       stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
 *       <path d="m15 18-6-6 6-6" x-show="!collapsed"></path>
 *       <path d="m9 18 6-6-6-6" x-show="collapsed"></path>
 *     </svg>
 *   </button>
 * </nav>
 * ```
 *
 * Consumers serve both chevron paths and use `x-show`; there is no chevron binding. The
 * SVG shown here is Lyra's default chevron appearance, not a requirement: consumers may
 * serve any icon markup because the binding only toggles visibility through `collapsed`
 * and never inspects or replaces the SVG. The only contract is that both directional states
 * are served and each carries the matching `x-show`. Consumers also serve `title` on every
 * `.lyra-sbgroup__item` permanently: the rail CSS hides its visual label, and the native
 * tooltip remains harmless when expanded. Composed links must likewise serve their own
 * `title` and `aria-label`; Alpine intentionally does not walk served markup to reproduce
 * React's `addRailLinkLabels`. A sidebar is collapsible exactly when its consumer renders
 * a toggle with `x-bind="toggle"`, matching `lyraSidebarGroup`'s label binding model.
 */
export function lyraAppSidebar({
  defaultCollapsed = false,
  width = 260,
  labels = {},
}: LyraAppSidebarOptions = {}): LyraAppSidebarData {
  const collapseLabel = labels.collapse ?? 'Collapse sidebar';
  const expandLabel = labels.expand ?? 'Expand sidebar';
  const state: LyraAppSidebarData & ThisType<LyraAppSidebarState> = {
    collapsed: defaultCollapsed,

    root: {
      [':class']() {
        // Object syntax also removes a rail modifier rendered by the server when expanded.
        return { 'lyra-appsidebar--rail': this.collapsed };
      },
      [':style']() {
        return {
          '--appsidebar-width': this.collapsed ? '64px' : `${width}px`,
          width: 'var(--appsidebar-width)',
        };
      },
    },

    toggle: {
      type: 'button',
      [':aria-label']() {
        return this.collapsed ? expandLabel : collapseLabel;
      },
      [':title']() {
        return this.collapsed ? expandLabel : collapseLabel;
      },
      ['@click']() {
        this.collapsed = !this.collapsed;
        this.$dispatch('lyra:collapse', { collapsed: this.collapsed });
      },
    },
  };

  return state;
}
