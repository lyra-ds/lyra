/** Initial configuration accepted by `x-data="lyraTabs(...)"`. */
export interface LyraTabsOptions {
  /** Value of the active tab. This controllable state is required. */
  active: string;
}

type Binding = Record<string, unknown>;

interface LyraTabsData {
  active: string;
  root: HTMLElement | null;
  init(): void;
  listElement(): HTMLElement | null;
  tabElements(): HTMLElement[];
  panelElements(): HTMLElement[];
  activeIndex(): number;
  tabIndex(tab: HTMLElement): number;
  panelIndex(panel: HTMLElement): number;
  tabId(tab: HTMLElement): string;
  panelId(panel: HTMLElement): string;
  tabIdForValue(value: string): string;
  panelIdForValue(value: string): string;
  isActiveTab(tab: HTMLElement): boolean;
  isActivePanel(panel: HTMLElement): boolean;
  activateTab(tab: HTMLElement): void;
  handleTabKeyDown(event: KeyboardEvent): void;
  list: Binding;
  tab: Binding;
  panel: Binding;
}

interface LyraTabsMagics {
  $el: HTMLElement;
}

type LyraTabsState = LyraTabsData & LyraTabsMagics;

let nextTabsId = 0;

/** APG tabs with automatic activation over consumer-rendered tab and panel markup. */
export function lyraTabs({ active }: LyraTabsOptions): LyraTabsData {
  const state: LyraTabsData & ThisType<LyraTabsState> = {
    active,
    root: null,

    init() {
      // In x-bind object handlers Alpine's $el is the bound tab or panel, not this root.
      // Capture it once so all structural queries share the component's DOM boundary.
      this.root = this.$el;
      if (!this.root.id) this.root.id = `lyra-tabs-${++nextTabsId}`;
    },

    listElement() {
      return (
        this.root?.querySelector<HTMLElement>('[x-bind="list"]') ??
        this.root?.querySelector<HTMLElement>('[role="tablist"]') ??
        null
      );
    },

    tabElements() {
      return Array.from(
        this.listElement()?.querySelectorAll<HTMLElement>('[data-value]') ?? [],
      ).filter(
        (element) =>
          element.getAttribute('x-bind') === 'tab' || element.getAttribute('role') === 'tab',
      );
    },

    panelElements() {
      return Array.from(this.root?.querySelectorAll<HTMLElement>('[data-value]') ?? []).filter(
        (element) =>
          element.getAttribute('x-bind') === 'panel' || element.getAttribute('role') === 'tabpanel',
      );
    },

    activeIndex() {
      return Math.max(
        0,
        this.tabElements().findIndex((tab) => tab.dataset.value === this.active),
      );
    },

    tabIndex(tab) {
      return this.tabElements().indexOf(tab);
    },

    panelIndex(panel) {
      const matchingTabIndex = this.tabElements().findIndex(
        (tab) => tab.dataset.value === panel.dataset.value,
      );
      return matchingTabIndex >= 0 ? matchingTabIndex : this.panelElements().indexOf(panel);
    },

    tabId(tab) {
      return tab.id || `${this.root?.id ?? ''}-tab-${this.tabIndex(tab)}`;
    },

    panelId(panel) {
      return panel.id || `${this.root?.id ?? ''}-panel-${this.panelIndex(panel)}`;
    },

    tabIdForValue(value) {
      const tab = this.tabElements().find((element) => element.dataset.value === value);
      return tab ? this.tabId(tab) : '';
    },

    panelIdForValue(value) {
      const panel = this.panelElements().find((element) => element.dataset.value === value);
      return panel ? this.panelId(panel) : '';
    },

    isActiveTab(tab) {
      return this.tabIndex(tab) === this.activeIndex();
    },

    isActivePanel(panel) {
      return this.panelIndex(panel) === this.activeIndex();
    },

    activateTab(tab) {
      this.active = tab.dataset.value ?? '';
    },

    handleTabKeyDown(event) {
      if (event.defaultPrevented) return;
      const tabs = this.tabElements();
      const currentIndex = tabs.indexOf(event.currentTarget as HTMLElement);
      if (currentIndex < 0 || tabs.length === 0) return;

      let nextIndex: number | undefined;
      if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
      if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = tabs.length - 1;
      if (nextIndex === undefined) return;

      event.preventDefault();
      const nextTab = tabs[nextIndex];
      nextTab.focus();
      this.activateTab(nextTab);
    },

    list: {
      role: 'tablist',
    },

    tab: {
      role: 'tab',
      type: 'button',
      [':id']() {
        return this.tabId(this.$el);
      },
      [':aria-selected']() {
        return String(this.isActiveTab(this.$el));
      },
      [':aria-controls']() {
        return this.panelIdForValue(this.$el.dataset.value ?? '');
      },
      [':tabindex']() {
        return this.isActiveTab(this.$el) ? 0 : -1;
      },
      [':class']() {
        // Object syntax so the class is also removed when the server rendered it statically.
        return { 'lyra-tab--active': this.isActiveTab(this.$el) };
      },
      ['@click'](event: MouseEvent) {
        if (event.currentTarget instanceof HTMLElement) this.activateTab(event.currentTarget);
      },
      ['@keydown'](event: KeyboardEvent) {
        this.handleTabKeyDown(event);
      },
    },

    panel: {
      role: 'tabpanel',
      tabindex: '0',
      [':id']() {
        return this.panelId(this.$el);
      },
      [':aria-labelledby']() {
        return this.tabIdForValue(this.$el.dataset.value ?? '');
      },
      [':hidden']() {
        return !this.isActivePanel(this.$el);
      },
    },
  };

  return state;
}
