import { lyraDropdown } from './dropdown';
import type { LyraDropdownOptions } from './dropdown';
import { lyraDialog } from './dialog';
import type { LyraDialogOptions } from './dialog';

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
}
