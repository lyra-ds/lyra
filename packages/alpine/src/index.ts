import { lyraDropdown } from './dropdown';
import type { LyraDropdownOptions } from './dropdown';
import { lyraDialog } from './dialog';
import type { LyraDialogOptions } from './dialog';
import { lyraDrawer } from './drawer';
import type { LyraDrawerOptions } from './drawer';
import { lyraBottomSheet } from './bottom-sheet';
import type { LyraBottomSheetOptions } from './bottom-sheet';
import { lyraTabs } from './tabs';
import type { LyraTabsOptions } from './tabs';
import { lyraAccordion } from './accordion';
import type { LyraAccordionOptions } from './accordion';
import { lyraTooltip } from './tooltip';
import type { LyraTooltipOptions } from './tooltip';
import { lyraPopover } from './popover';
import type { LyraPopoverOptions } from './popover';
import { lyraCodeBlock } from './code-block';
import { lyraCookieBanner } from './cookie-banner';
import type { LyraCookieBannerOptions } from './cookie-banner';
import { lyraSidebarGroup } from './sidebar-group';
import type { LyraSidebarGroupOptions } from './sidebar-group';
import { lyraSegmentedControl } from './segmented-control';
import type { LyraSegmentedControlOptions } from './segmented-control';
import { lyraWorkspaceSwitcher } from './workspace-switcher';
import type { LyraWorkspaceSwitcherOptions } from './workspace-switcher';
import { lyraTableOfContents } from './table-of-contents';
import type { LyraTableOfContentsOptions } from './table-of-contents';
import { lyraTimeInput } from './time-input';
import type { LyraTimeInputOptions } from './time-input';
import { lyraFileUpload } from './file-upload';
import type { LyraFileUploadOptions } from './file-upload';
import { lyraFileManager } from './file-manager';
import type { LyraFileManagerOptions } from './file-manager';
import { lyraTheme } from './theme';

/**
 * Structural slice of the Alpine instance that the Lyra plugin actually uses.
 *
 * Deliberately local instead of `import type { Alpine } from 'alpinejs'`: alpinejs
 * ships no types (they live in @types/alpinejs), so referencing them in the public
 * signature would break type resolution for every consumer without that devDep.
 * Structurally compatible with both the real Alpine instance and @types/alpinejs.
 */
export interface LyraAlpine {
  /** Registers a reusable `x-data` component (`Alpine.data(name, factory)`). */
  data(name: string, factory: (...args: unknown[]) => Record<string, unknown>): void;
  /** Registers a global reactive store (`Alpine.store(name, value)`). */
  store(name: string, value: unknown): void;
}

/**
 * Lyra DS plugin for Alpine.js — registers one `Alpine.data()` per interactive
 * component, porting the exact state machine of its `@lyra-ds/react` counterpart
 * (same modifier classes, ARIA, `inert`, focus/scroll-lock/keyboard handling).
 *
 * ```js
 * import Alpine from 'alpinejs';
 * import lyra from '@lyra-ds/alpine';
 *
 * Alpine.plugin(lyra);
 * Alpine.start();
 * ```
 */
export default function lyra(alpine: LyraAlpine): void {
  alpine.store('theme', lyraTheme());
  alpine.data(
    'lyraDialog',
    (...args) =>
      lyraDialog((args[0] ?? {}) as LyraDialogOptions) as unknown as Record<string, unknown>,
  );
  alpine.data(
    'lyraDropdown',
    (...args) =>
      lyraDropdown((args[0] ?? {}) as LyraDropdownOptions) as unknown as Record<string, unknown>,
  );
  alpine.data(
    'lyraDrawer',
    (...args) =>
      lyraDrawer((args[0] ?? {}) as LyraDrawerOptions) as unknown as Record<string, unknown>,
  );
  alpine.data(
    'lyraBottomSheet',
    (...args) =>
      lyraBottomSheet((args[0] ?? {}) as LyraBottomSheetOptions) as unknown as Record<
        string,
        unknown
      >,
  );
  alpine.data(
    'lyraTabs',
    (...args) => lyraTabs((args[0] ?? {}) as LyraTabsOptions) as unknown as Record<string, unknown>,
  );
  alpine.data(
    'lyraAccordion',
    (...args) =>
      lyraAccordion((args[0] ?? {}) as LyraAccordionOptions) as unknown as Record<string, unknown>,
  );
  alpine.data(
    'lyraTooltip',
    (...args) =>
      lyraTooltip((args[0] ?? {}) as LyraTooltipOptions) as unknown as Record<string, unknown>,
  );
  alpine.data(
    'lyraPopover',
    (...args) =>
      lyraPopover((args[0] ?? {}) as LyraPopoverOptions) as unknown as Record<string, unknown>,
  );
  alpine.data(
    'lyraSidebarGroup',
    (...args) =>
      lyraSidebarGroup((args[0] ?? {}) as LyraSidebarGroupOptions) as unknown as Record<
        string,
        unknown
      >,
  );
  alpine.data(
    'lyraWorkspaceSwitcher',
    (...args) =>
      lyraWorkspaceSwitcher((args[0] ?? {}) as LyraWorkspaceSwitcherOptions) as unknown as Record<
        string,
        unknown
      >,
  );
  alpine.data('lyraCodeBlock', () => lyraCodeBlock() as unknown as Record<string, unknown>);
  alpine.data(
    'lyraCookieBanner',
    (...args) =>
      lyraCookieBanner((args[0] ?? {}) as LyraCookieBannerOptions) as unknown as Record<
        string,
        unknown
      >,
  );
  alpine.data(
    'lyraSegmentedControl',
    (...args) =>
      lyraSegmentedControl((args[0] ?? {}) as LyraSegmentedControlOptions) as unknown as Record<
        string,
        unknown
      >,
  );
  alpine.data(
    'lyraTableOfContents',
    (...args) =>
      lyraTableOfContents((args[0] ?? {}) as LyraTableOfContentsOptions) as unknown as Record<
        string,
        unknown
      >,
  );
  alpine.data(
    'lyraTimeInput',
    (...args) =>
      lyraTimeInput((args[0] ?? {}) as LyraTimeInputOptions) as unknown as Record<string, unknown>,
  );
  alpine.data(
    'lyraFileUpload',
    (...args) =>
      lyraFileUpload((args[0] ?? {}) as LyraFileUploadOptions) as unknown as Record<
        string,
        unknown
      >,
  );
  alpine.data(
    'lyraFileManager',
    (...args) =>
      lyraFileManager((args[0] ?? {}) as LyraFileManagerOptions) as unknown as Record<
        string,
        unknown
      >,
  );
}
