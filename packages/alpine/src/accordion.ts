/** Initial configuration accepted by `x-data="lyraAccordion(...)"`. */
export interface LyraAccordionOptions {
  /** Id of the item initially open. */
  defaultOpen?: string;
  /** Whether more than one item may be open at once. Default: `false`. */
  multiple?: boolean;
}

type Binding = Record<string, unknown>;

interface LyraAccordionData {
  openItems: string[];
  multiple: boolean;
  root: HTMLElement | null;
  init(): void;
  itemElements(): HTMLElement[];
  itemForElement(element: HTMLElement): HTMLElement | null;
  itemIndex(item: HTMLElement): number;
  itemValue(item: HTMLElement): string;
  triggerElement(item: HTMLElement): HTMLElement | null;
  panelElement(item: HTMLElement): HTMLElement | null;
  triggerId(item: HTMLElement): string;
  panelId(item: HTMLElement): string;
  isItemOpen(item: HTMLElement): boolean;
  toggleItem(item: HTMLElement): void;
  item: Binding;
  trigger: Binding;
  panelWrap: Binding;
  panel: Binding;
}

interface LyraAccordionMagics {
  $el: HTMLElement;
}

type LyraAccordionState = LyraAccordionData & LyraAccordionMagics;

let nextAccordionId = 0;

/** An uncontrolled disclosure list over consumer-rendered accordion markup. */
export function lyraAccordion({
  defaultOpen,
  multiple = false,
}: LyraAccordionOptions = {}): LyraAccordionData {
  const state: LyraAccordionData & ThisType<LyraAccordionState> = {
    openItems: defaultOpen === undefined ? [] : [defaultOpen],
    multiple,
    root: null,

    init() {
      // In x-bind object handlers Alpine's $el is the bound item part, not this root.
      // Capture it once so item identity and ARIA links stay within this accordion.
      this.root = this.$el;
      if (!this.root.id) this.root.id = `lyra-accordion-${++nextAccordionId}`;
    },

    itemElements() {
      return Array.from(this.root?.querySelectorAll<HTMLElement>('.lyra-acc__item') ?? []);
    },

    itemForElement(element) {
      const item = element.closest<HTMLElement>('.lyra-acc__item');
      return item && this.root?.contains(item) ? item : null;
    },

    itemIndex(item) {
      return this.itemElements().indexOf(item);
    },

    itemValue(item) {
      return item.dataset.value ?? '';
    },

    triggerElement(item) {
      return item.querySelector<HTMLElement>('[x-bind="trigger"]');
    },

    panelElement(item) {
      return item.querySelector<HTMLElement>('[x-bind="panel"]');
    },

    triggerId(item) {
      const trigger = this.triggerElement(item);
      return trigger?.id || `${this.root?.id ?? ''}-trigger-${this.itemIndex(item)}`;
    },

    panelId(item) {
      const panel = this.panelElement(item);
      return panel?.id || `${this.root?.id ?? ''}-panel-${this.itemIndex(item)}`;
    },

    isItemOpen(item) {
      return this.openItems.includes(this.itemValue(item));
    },

    toggleItem(item) {
      const value = this.itemValue(item);
      const next = this.multiple ? [...this.openItems] : [];
      if (this.openItems.includes(value))
        this.openItems = next.filter((itemValue) => itemValue !== value);
      else this.openItems = [...next, value];
    },

    item: {
      [':class']() {
        // Object syntax so the class is also removed when the server rendered it statically.
        return { 'lyra-acc__item--open': this.isItemOpen(this.$el) };
      },
    },

    trigger: {
      type: 'button',
      [':id']() {
        const item = this.itemForElement(this.$el);
        return item ? this.triggerId(item) : '';
      },
      [':aria-expanded']() {
        const item = this.itemForElement(this.$el);
        return String(item !== null && this.isItemOpen(item));
      },
      [':aria-controls']() {
        const item = this.itemForElement(this.$el);
        return item ? this.panelId(item) : '';
      },
      ['@click']() {
        const item = this.itemForElement(this.$el);
        if (item) this.toggleItem(item);
      },
    },

    panelWrap: {
      [':inert']() {
        const item = this.itemForElement(this.$el);
        return item !== null && !this.isItemOpen(item);
      },
    },

    panel: {
      [':id']() {
        const item = this.itemForElement(this.$el);
        return item ? this.panelId(item) : '';
      },
      [':aria-labelledby']() {
        const item = this.itemForElement(this.$el);
        return item ? this.triggerId(item) : '';
      },
    },
  };

  return state;
}
