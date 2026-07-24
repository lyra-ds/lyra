import type { ComponentType } from 'react';
import { BadgeDot } from './badge/dot';
import { BadgeTones } from './badge/tones';
import { ButtonAsLink } from './button/as-link';
import { ButtonIconsAndStates } from './button/icons-and-states';
import { ButtonSizes } from './button/sizes';
import { ButtonVariants } from './button/variants';
import { DialogBasic } from './dialog/basic';
import { DialogDismissal } from './dialog/dismissal';
import { InputBasic } from './input/basic';
import { InputError } from './input/error';
import { InputInAForm } from './input/in-a-form';
import { InputSizesAndIcon } from './input/sizes-and-icon';

/**
 * Slug → example id → live component. The id MUST match the file name under
 * `examples/<slug>/`: the renderer reads `<id>.tsx` to print the source next to the
 * live render, so a mismatch fails the build loudly instead of showing stale code.
 *
 * Example files are consumer code, not docs code: no `.lw-*` classes, no next-intl,
 * no docs-only imports — whatever the panel prints must run when pasted into an app.
 * Arrangement comes from the example stage, so most examples return bare components.
 *
 * An example needs `'use client'` when it holds state/handlers OR when it introspects
 * children (`asChild`): a server-rendered child crossing into a client component is not
 * the plain element `Children.only` expects, so it throws. `next build` prerenders it
 * anyway — only `next dev` (Turbopack) surfaces it, as a 500 on the page.
 */
export const examples: Record<string, Record<string, ComponentType>> = {
  badge: {
    tones: BadgeTones,
    dot: BadgeDot,
  },
  button: {
    variants: ButtonVariants,
    sizes: ButtonSizes,
    'icons-and-states': ButtonIconsAndStates,
    'as-link': ButtonAsLink,
  },
  input: {
    basic: InputBasic,
    'sizes-and-icon': InputSizesAndIcon,
    error: InputError,
    'in-a-form': InputInAForm,
  },
  dialog: {
    basic: DialogBasic,
    dismissal: DialogDismissal,
  },
};
