import { lyraDropdown } from './dropdown';
import type { LyraDropdownOptions } from './dropdown';
import { lyraDialog } from './dialog';
import type { LyraDialogOptions } from './dialog';
import { lyraDrawer } from './drawer';
import type { LyraDrawerOptions } from './drawer';
import { lyraTabs } from './tabs';
import type { LyraTabsOptions } from './tabs';
import { lyraAccordion } from './accordion';
import type { LyraAccordionOptions } from './accordion';
import { lyraTooltip } from './tooltip';
import type { LyraTooltipOptions } from './tooltip';
import { lyraPopover } from './popover';
import type { LyraPopoverOptions } from './popover';

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
}
