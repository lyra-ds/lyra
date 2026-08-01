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

export { Textarea } from './textarea';
export type { TextareaProps } from './textarea';

export { Checkbox } from './checkbox';
export type { CheckboxProps } from './checkbox';

export { Radio } from './radio';
export type { RadioProps } from './radio';

export { Switch } from './switch';
export type { SwitchProps } from './switch';

export { FileUpload } from './file-upload';
export type { FileUploadItem, FileUploadProps } from './file-upload';
export { FileManager } from './file-manager';
export type { FileManagerLabels, FileManagerProps, ManagedFile } from './file-manager';

export { Dialog } from './dialog';
export type { DialogProps } from './dialog';

export { Drawer } from './drawer';
export type { DrawerProps } from './drawer';

export { CreateWorkspaceDialog } from './create-workspace-dialog';
export type { CreateWorkspaceDialogProps } from './create-workspace-dialog';

export { WorkspaceSwitcher } from './workspace-switcher';
export type { Workspace, WorkspaceSwitcherProps } from './workspace-switcher';

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
export { Container } from './container';
export type { ContainerProps } from './container';
export { Shell } from './shell';
export type { ShellProps } from './shell';
export { Navbar } from './navbar';
export type { NavbarProps } from './navbar';
export { NavLink } from './nav-link';
export type { NavLinkProps } from './nav-link';
export { Footer } from './footer';
export type { FooterProps } from './footer';
export { TableOfContents, useScrollSpy } from './table-of-contents';
export type { TableOfContentsItem, TableOfContentsProps } from './table-of-contents';
export { CodeBlock } from './code-block';
export type { CodeBlockProps } from './code-block';
export { SegmentedControl } from './segmented-control';
export type { SegmentedControlOption, SegmentedControlProps } from './segmented-control';
export { Grid } from './grid';
export type { GridProps } from './grid';
export { PageHeader } from './page-header';
export type { PageHeaderProps } from './page-header';
export { Inline, Stack } from './stack';
export type { InlineProps, StackProps } from './stack';
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

export { Tabs } from './tabs';
export type { TabItem, TabsProps } from './tabs';
export { Accordion } from './accordion';
export type { AccordionItem, AccordionProps } from './accordion';
export { Stepper } from './stepper';
export type { StepperProps } from './stepper';
export { Pagination } from './pagination';
export type { PaginationProps } from './pagination';
export { Tooltip } from './tooltip';
export type { TooltipProps } from './tooltip';
export { Select } from './select';
export type { SelectProps } from './select';
export { Dropdown } from './dropdown';
export type { DropdownItem, DropdownProps } from './dropdown';
export { Combobox } from './combobox';
export type { ComboboxOption, ComboboxProps } from './combobox';

export { Table } from './table';
export type { TableColumn, TableProps } from './table';
export { SidebarGroup } from './sidebar-group';
export type { SidebarGroupItem, SidebarGroupProps } from './sidebar-group';
export { Toast, ToastStack } from './toast';
export type { ToastProps, ToastStackProps } from './toast';
export { CookieBanner } from './cookie-banner';
export type { CookieBannerProps } from './cookie-banner';

export { CommandPalette } from './command-palette';
export type {
  CommandGroup,
  CommandItem,
  CommandPaletteHints,
  CommandPaletteProps,
} from './command-palette';

export { ThemeProvider, useTheme } from './theme-provider';
export type { ThemeApi, ThemeProviderProps, Theme, ResolvedTheme } from './theme-provider';
