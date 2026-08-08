import { createPresence, type PresenceController } from './internal/presence';

const DEFAULT_STORAGE_KEY = 'lyra-cookie-consent';

/** Initial configuration accepted by `x-data="lyraCookieBanner(...)"`. */
export interface LyraCookieBannerOptions {
  storageKey?: string;
}

type CookieChoice = 'all' | 'essentials';
type Binding = Record<string, unknown>;

interface LyraCookieBannerData {
  visible: boolean;
  closing: boolean;
  mounted: boolean;
  storageKey: string;
  presence: PresenceController | null;
  init(): void;
  destroy(): void;
  decide(choice: CookieChoice): void;
  root: Binding;
  accept: Binding;
  essentials: Binding;
}

interface LyraCookieBannerMagics {
  $dispatch(name: string): void;
  $watch(path: string, callback: (value: boolean) => void): void;
}

type LyraCookieBannerState = LyraCookieBannerData & LyraCookieBannerMagics;

/**
 * A persisted cookie-consent banner driven entirely by consumer-rendered markup.
 *
 * The server cannot know the visitor's stored choice, so consumers MUST put `x-cloak` on the root:
 * the banner reveals only after `init()` checks storage, matching React's render-nothing default.
 */
export function lyraCookieBanner({
  storageKey = DEFAULT_STORAGE_KEY,
}: LyraCookieBannerOptions = {}): LyraCookieBannerData {
  const state: LyraCookieBannerData & ThisType<LyraCookieBannerState> = {
    visible: false,
    closing: false,
    mounted: false,
    storageKey,
    presence: null,

    init() {
      this.presence = createPresence(this.visible, (closing) => {
        this.closing = closing;
        this.mounted = this.visible || closing;
      });
      this.$watch('visible', (visible) => {
        if (visible) this.mounted = true;
        this.presence?.update(visible);
      });

      try {
        this.visible = localStorage.getItem(this.storageKey) === null;
      } catch {
        this.visible = true;
      }
    },

    destroy() {
      this.presence?.destroy();
      this.presence = null;
    },

    decide(choice) {
      try {
        localStorage.setItem(this.storageKey, choice);
      } catch {
        // Storage can be unavailable (for example, private browsing); the selection still applies.
      }
      this.visible = false;
      this.$dispatch(choice === 'all' ? 'lyra:accept' : 'lyra:essentials');
    },

    root: {
      ['x-show']() {
        return this.mounted;
      },
      [':class']() {
        return { 'lyra-cookies--closing': this.closing };
      },
      ['@animationend'](event: AnimationEvent) {
        this.presence?.onAnimationEnd(event);
      },
    },

    accept: {
      type: 'button',
      ['@click']() {
        this.decide('all');
      },
    },

    essentials: {
      type: 'button',
      ['@click']() {
        this.decide('essentials');
      },
    },
  };

  return state;
}
