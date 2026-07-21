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

export { IconButton } from './icon-button';
export type { IconButtonProps } from './icon-button';
export { Badge } from './badge';
export type { BadgeProps } from './badge';
export { Tag } from './tag';
export type { TagProps } from './tag';
export { Card } from './card';
export type { CardProps } from './card';
export { Avatar, AvatarGroup } from './avatar';
export type { AvatarProps, AvatarGroupProps } from './avatar';
export { Alert } from './alert';
export type { AlertProps } from './alert';
export { Spinner } from './spinner';
export type { SpinnerProps } from './spinner';
export { Skeleton } from './skeleton';
export type { SkeletonProps } from './skeleton';
export { Progress } from './progress';
export type { ProgressProps } from './progress';
export { Stat } from './stat';
export type { StatProps } from './stat';
export { EmptyState } from './empty-state';
export type { EmptyStateProps } from './empty-state';
export { Breadcrumb } from './breadcrumb';
export type { BreadcrumbItem, BreadcrumbProps } from './breadcrumb';
