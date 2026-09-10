/** Initial configuration accepted by `x-data="lyraTabs(...)"`. */
export interface LyraTabsOptions {
  /** Value of the active tab. This controllable state is required. */
  active: string;
}

/** Detail carried by the interaction-only Tabs change events. */
export interface LyraTabsChangeDetail {
  /** The accepted destination value. */
  value: string;
  /** The active value before the accepted interaction. */
  previousValue: string;
}

type Binding = Record<string, unknown>;

interface LyraTabsData {
  active: string;
  ready: boolean;
  root: HTMLElement | null;
  destroyed: boolean;
  structurallyInvalid: boolean;
  clickListener: ((event: MouseEvent) => void) | null;
  keyDownListener: ((event: KeyboardEvent) => void) | null;
  init(): void;
  destroy(): void;
  listElement(): HTMLElement | null;
  fallbackElement(): HTMLElement | null;
  tabElements(): HTMLButtonElement[];
  panelElements(): HTMLElement[];
  fallbackLinks(): HTMLAnchorElement[];
  isEligibleFallbackLink(link: HTMLAnchorElement): boolean;
  owns(element: Element): boolean;
  hasValidStructure(): boolean;
  revalidate(): void;
  resetNativeContent(): void;
  tabId(tab: HTMLElement): string;
  panelId(panel: HTMLElement): string;
  tabIdForValue(value: string): string;
  panelIdForValue(value: string): string;
  isActiveTab(tab: HTMLElement): boolean;
  isActivePanel(panel: HTMLElement): boolean;
  isEligible(tab: HTMLButtonElement): boolean;
  eligibleTabs(): HTMLButtonElement[];
  isTabEntry(tab: HTMLButtonElement): boolean;
  requestChange(value: string, focusTarget?: HTMLButtonElement): void;
  handleRootClick(event: MouseEvent): void;
  handleRootKeyDown(event: KeyboardEvent): void;
  fallback: Binding;
  list: Binding;
  tab: Binding;
  panel: Binding;
}

interface LyraTabsMagics {
  $el: HTMLElement;
  $watch(path: string, callback: (value: string) => void): void;
}

type LyraTabsState = LyraTabsData & LyraTabsMagics;

let nextTabsId = 0;

function generatedId(root: HTMLElement | null, kind: 'tab' | 'panel', value: string): string {
  return `${root?.id ?? ''}-${kind}-${encodeURIComponent(value)}`;
}

function hasUsableId(element: HTMLElement): boolean {
  return element.id.length > 0 && !/\s/.test(element.id);
}

function hasHiddenPresentation(element: HTMLElement, boundary: HTMLElement | null): boolean {
  for (
    let candidate: HTMLElement | null = element;
    candidate;
    candidate = candidate.parentElement
  ) {
    const style = getComputedStyle(candidate);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.visibility === 'collapse'
    ) {
      return true;
    }
    if (candidate === boundary) break;
  }
  return false;
}

/**
 * Progressive-enhancement tabs over consumer-rendered native links, buttons, and sections.
 * The server fallback remains the source of truth until the complete paired structure is ready.
 */
export function lyraTabs({ active }: LyraTabsOptions): LyraTabsData {
  const state: LyraTabsData & ThisType<LyraTabsState> = {
    active,
    ready: false,
    root: null,
    destroyed: false,
    structurallyInvalid: false,
    clickListener: null,
    keyDownListener: null,

    init() {
      this.root = this.$el;
      if (!this.root.id) this.root.id = `lyra-tabs-${++nextTabsId}`;
      this.clickListener = (event) => this.handleRootClick(event);
      this.keyDownListener = (event) => this.handleRootKeyDown(event);
      this.root.addEventListener('click', this.clickListener);
      this.root.addEventListener('keydown', this.keyDownListener);
      this.$watch('active', () => this.revalidate());
      this.revalidate();
    },

    destroy() {
      if (this.destroyed) return;
      this.destroyed = true;
      const root = this.root;
      const activeElement = document.activeElement;
      const focusedTab =
        activeElement instanceof HTMLButtonElement && this.tabElements().includes(activeElement)
          ? activeElement
          : null;
      const focusedPanel =
        this.ready &&
        activeElement instanceof HTMLElement &&
        this.panelElements().includes(activeElement)
          ? activeElement
          : null;

      if (this.clickListener) root?.removeEventListener('click', this.clickListener);
      if (this.keyDownListener) root?.removeEventListener('keydown', this.keyDownListener);
      this.clickListener = null;
      this.keyDownListener = null;
      this.ready = false;
      this.resetNativeContent();

      const focusedValue = focusedTab?.dataset.value ?? focusedPanel?.dataset.value;
      if (root?.isConnected && focusedValue) {
        const destination =
          this.fallbackLinks().find(
            (link) =>
              this.isEligibleFallbackLink(link) &&
              link.getAttribute('href') === `#${this.panelIdForValue(focusedValue)}`,
          ) ?? this.fallbackLinks().find((link) => this.isEligibleFallbackLink(link));
        if (destination?.isConnected) destination.focus();
      }
      this.root = null;
    },

    owns(element) {
      return element.closest('[data-lyra-tabs]') === this.root;
    },

    listElement() {
      const lists = Array.from(
        this.root?.querySelectorAll<HTMLElement>('[x-bind="list"]') ?? [],
      ).filter((element) => this.owns(element));
      return lists.length === 1 ? lists[0] : null;
    },

    fallbackElement() {
      const fallbacks = Array.from(
        this.root?.querySelectorAll<HTMLElement>('[x-bind="fallback"][data-lyra-tabs-fallback]') ??
          [],
      ).filter((element) => this.owns(element));
      return fallbacks.length === 1 ? fallbacks[0] : null;
    },

    tabElements() {
      const list = this.listElement();
      return Array.from(
        list?.querySelectorAll<HTMLButtonElement>('button[x-bind="tab"][data-value]') ?? [],
      ).filter((element) => this.owns(element));
    },

    panelElements() {
      return Array.from(
        this.root?.querySelectorAll<HTMLElement>('[x-bind="panel"][data-value]') ?? [],
      ).filter((element) => this.owns(element));
    },

    fallbackLinks() {
      return Array.from(
        this.fallbackElement()?.querySelectorAll<HTMLAnchorElement>('a[href]') ?? [],
      ).filter((element) => this.owns(element));
    },

    isEligibleFallbackLink(link) {
      if (!this.owns(link) || link.closest('[hidden], [inert], [aria-disabled="true"]'))
        return false;
      return !hasHiddenPresentation(link, this.root);
    },

    hasValidStructure() {
      const root = this.root;
      const list = this.listElement();
      const fallback = this.fallbackElement();
      const tabs = this.tabElements();
      const panels = this.panelElements();
      if (!root || !root.hasAttribute('data-lyra-tabs') || !hasUsableId(root) || !list || !fallback)
        return false;
      if (
        fallback.tagName !== 'NAV' ||
        (!fallback.hasAttribute('aria-label') && !fallback.hasAttribute('aria-labelledby')) ||
        !list.matches('.lyra-tabs[data-lyra-tabs-enhanced]')
      ) {
        return false;
      }
      if (tabs.length === 0 || tabs.length !== panels.length) return false;

      const tabValues = new Set<string>();
      const panelValues = new Set<string>();
      const ids = new Set<string>([root.id]);
      for (const tab of tabs) {
        const value = tab.dataset.value;
        const id = this.tabId(tab);
        if (
          value === undefined ||
          value.length === 0 ||
          (tab.id.length > 0 && !hasUsableId(tab)) ||
          tabValues.has(value) ||
          ids.has(id)
        ) {
          return false;
        }
        tabValues.add(value);
        ids.add(id);
      }
      for (const panel of panels) {
        const value = panel.dataset.value;
        if (
          panel.tagName !== 'SECTION' ||
          value === undefined ||
          value.length === 0 ||
          panelValues.has(value) ||
          !panel.querySelector('h1, h2, h3, h4, h5, h6') ||
          !hasUsableId(panel) ||
          ids.has(panel.id)
        ) {
          return false;
        }
        panelValues.add(value);
        ids.add(panel.id);
      }
      if (
        tabValues.size !== panelValues.size ||
        [...tabValues].some((value) => !panelValues.has(value))
      ) {
        return false;
      }
      return panels.every((panel) =>
        this.fallbackLinks().some((link) => link.getAttribute('href') === `#${panel.id}`),
      );
    },

    revalidate() {
      if (this.destroyed) return;
      if (!this.hasValidStructure()) {
        this.structurallyInvalid = true;
        this.ready = false;
        this.resetNativeContent();
        return;
      }
      if (
        this.structurallyInvalid ||
        !this.tabElements().some((tab) => tab.dataset.value === this.active)
      ) {
        this.ready = false;
        this.resetNativeContent();
        return;
      }
      this.ready = true;
    },

    resetNativeContent() {
      this.fallbackElement()?.removeAttribute('hidden');
      const list = this.listElement();
      if (list) {
        list.hidden = true;
        list.removeAttribute('role');
      }
      for (const tab of this.tabElements()) {
        tab.removeAttribute('role');
        tab.removeAttribute('aria-selected');
        tab.removeAttribute('aria-controls');
        tab.removeAttribute('tabindex');
        tab.removeAttribute('data-state');
        tab.classList.remove('lyra-tab--active');
      }
      for (const panel of this.panelElements()) {
        panel.hidden = false;
        panel.removeAttribute('role');
        panel.removeAttribute('aria-labelledby');
        panel.removeAttribute('tabindex');
        panel.removeAttribute('data-state');
      }
    },

    tabId(tab) {
      return tab.id || generatedId(this.root, 'tab', tab.dataset.value ?? '');
    },

    panelId(panel) {
      return panel.id || generatedId(this.root, 'panel', panel.dataset.value ?? '');
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
      return tab.dataset.value === this.active;
    },

    isActivePanel(panel) {
      return panel.dataset.value === this.active;
    },

    isEligible(tab) {
      if (!this.ready || !this.owns(tab) || !this.listElement()?.contains(tab) || tab.disabled)
        return false;
      if (tab.matches(':disabled') || tab.closest('[hidden], [inert], [aria-disabled="true"]'))
        return false;
      return !hasHiddenPresentation(tab, this.root);
    },

    eligibleTabs() {
      return this.tabElements().filter((tab) => this.isEligible(tab));
    },

    isTabEntry(tab) {
      const eligible = this.eligibleTabs();
      const selected = eligible.find((candidate) => this.isActiveTab(candidate));
      return tab === (selected ?? eligible[0]);
    },

    requestChange(value, focusTarget) {
      if (!this.ready || !this.root?.isConnected) return;
      const tab = this.tabElements().find((element) => element.dataset.value === value);
      if (!tab || !this.isEligible(tab)) return;
      const detail: LyraTabsChangeDetail = { value, previousValue: this.active };
      const accepted = this.root.dispatchEvent(
        new CustomEvent<LyraTabsChangeDetail>('lyra:tabs-before-change', {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail,
        }),
      );
      if (!accepted || this.destroyed || !this.root?.isConnected || !this.isEligible(tab)) return;
      if (focusTarget) {
        focusTarget.focus();
        if (this.destroyed || !this.root?.isConnected || !this.isEligible(tab)) return;
      }
      this.active = value;
      if (this.destroyed || !this.root?.isConnected) return;
      this.root.dispatchEvent(
        new CustomEvent<LyraTabsChangeDetail>('lyra:tabs-change', {
          bubbles: true,
          composed: true,
          detail,
        }),
      );
    },

    handleRootClick(event) {
      if (event.defaultPrevented || !this.ready || !(event.target instanceof Element)) return;
      const tab = event.target.closest<HTMLButtonElement>('button[x-bind="tab"][data-value]');
      if (!tab || !this.owns(tab) || !this.isEligible(tab)) return;
      this.requestChange(tab.dataset.value ?? '');
    },

    handleRootKeyDown(event) {
      if (event.defaultPrevented || !this.ready || !(event.target instanceof Element)) return;
      const tab = event.target.closest<HTMLButtonElement>('button[x-bind="tab"][data-value]');
      if (!tab || !this.owns(tab) || !this.isEligible(tab)) return;
      const tabs = this.eligibleTabs();
      const index = tabs.indexOf(tab);
      if (index < 0 || tabs.length === 0) return;

      const rtl = getComputedStyle(this.listElement() as HTMLElement).direction === 'rtl';
      let nextIndex: number | undefined;
      if (event.key === 'ArrowRight')
        nextIndex = (index + (rtl ? -1 : 1) + tabs.length) % tabs.length;
      if (event.key === 'ArrowLeft')
        nextIndex = (index + (rtl ? 1 : -1) + tabs.length) % tabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = tabs.length - 1;
      if (nextIndex === undefined) return;

      event.preventDefault();
      const destination = tabs[nextIndex];
      this.requestChange(destination.dataset.value ?? '', destination);
    },

    fallback: {
      [':hidden']() {
        return this.ready;
      },
    },

    list: {
      [':hidden']() {
        return !this.ready;
      },
      [':role']() {
        return this.ready ? 'tablist' : null;
      },
    },

    tab: {
      type: 'button',
      [':id']() {
        return this.tabId(this.$el);
      },
      [':role']() {
        return this.ready ? 'tab' : null;
      },
      [':aria-selected']() {
        return this.ready ? String(this.isActiveTab(this.$el)) : null;
      },
      [':aria-controls']() {
        return this.ready ? this.panelIdForValue(this.$el.dataset.value ?? '') : null;
      },
      [':tabindex']() {
        return this.ready ? (this.isTabEntry(this.$el as HTMLButtonElement) ? 0 : -1) : null;
      },
      [':data-state']() {
        return this.ready ? (this.isActiveTab(this.$el) ? 'active' : 'inactive') : null;
      },
      [':class']() {
        return { 'lyra-tab--active': this.ready && this.isActiveTab(this.$el) };
      },
    },

    panel: {
      [':role']() {
        return this.ready ? 'tabpanel' : null;
      },
      [':aria-labelledby']() {
        return this.ready ? this.tabIdForValue(this.$el.dataset.value ?? '') : null;
      },
      [':tabindex']() {
        return this.ready ? 0 : null;
      },
      [':data-state']() {
        return this.ready ? (this.isActivePanel(this.$el) ? 'active' : 'inactive') : null;
      },
      [':hidden']() {
        return this.ready ? !this.isActivePanel(this.$el) : null;
      },
    },
  };

  return state;
}
