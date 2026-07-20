// Public barrel for @lyra-ds/react — the root import surface (D-13).
//
// Named exports only (D-12): every binding below is a named re-export, matching the
// handoff `export declare function` contracts. Each component and its Props type is
// re-exported from its per-folder entry (the same entries the `./button`, `./input`,
// `./dialog`, `./icon` subpaths expose), so `@lyra-ds/react` and `@lyra-ds/react/button`
// resolve to identical implementations. `IconName` (the curated-registry literal union,
// D-04) is re-exported alongside Icon so consumers can type icon names off the root.
export { Button } from './button';
export type { ButtonProps } from './button';

export { Input } from './input';
export type { InputProps } from './input';

export { Dialog } from './dialog';
export type { DialogProps } from './dialog';

export { Icon } from './icon';
export type { IconProps, IconName } from './icon';
