import { observeScrollSpy } from './internal/scroll-spy';

/** Initial configuration accepted by `x-data="lyraTableOfContents(...)"`. */
export interface LyraTableOfContentsOptions {
  /** Id of the active in-page target. */
  activeId?: string;
}

type Binding = Record<string, unknown>;

interface LyraTableOfContentsData {
  activeId: string;
  root: HTMLElement | null;
  stopSpy: () => void;
  init(): void;
  destroy(): void;
  targetIds(): string[];
  isActiveLink(link: HTMLAnchorElement): boolean;
  link: Binding;
}

interface LyraTableOfContentsMagics {
  $el: HTMLElement;
}

type LyraTableOfContentsState = LyraTableOfContentsData & LyraTableOfContentsMagics;

function fragmentId(link: HTMLAnchorElement): string {
  return decodeURIComponent((link.getAttribute('href') ?? '').slice(1));
}

/** In-page navigation state driven by consumer-rendered anchor links and target headings. */
export function lyraTableOfContents({
  activeId,
}: LyraTableOfContentsOptions = {}): LyraTableOfContentsData {
  const state: LyraTableOfContentsData & ThisType<LyraTableOfContentsState> = {
    activeId: typeof activeId === 'string' ? activeId : '',
    root: null,
    stopSpy: () => undefined,

    init() {
      // In x-bind object handlers Alpine's $el is the bound link, not this root.
      this.root = this.$el;
      this.stopSpy = observeScrollSpy(this.targetIds(), (id) => {
        this.activeId = id ?? '';
      });
    },

    destroy() {
      this.stopSpy();
      this.stopSpy = () => undefined;
    },

    targetIds() {
      return Array.from(this.root?.querySelectorAll<HTMLAnchorElement>('a[href^="#"]') ?? []).map(
        fragmentId,
      );
    },

    isActiveLink(link) {
      return fragmentId(link) === this.activeId;
    },

    link: {
      [':class']() {
        // Object syntax removes an active class that was rendered by the server.
        return { 'lyra-toc__link--active': this.isActiveLink(this.$el as HTMLAnchorElement) };
      },
      [':aria-current']() {
        return this.isActiveLink(this.$el as HTMLAnchorElement) ? 'location' : false;
      },
    },
  };

  return state;
}
