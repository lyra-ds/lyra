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
import { TextareaBasic } from './textarea/basic';
import { TextareaErrorAndRows } from './textarea/error-and-rows';
import { CheckboxBasic } from './checkbox/basic';
import { CheckboxStates } from './checkbox/states';
import { RadioBasic } from './radio/basic';
import { RadioDisabled } from './radio/disabled';
import { SwitchBasic } from './switch/basic';
import { SwitchDisabled } from './switch/disabled';
import { SelectBasic } from './select/basic';
import { SelectSizesAndError } from './select/sizes-and-error';
import { ComboboxBasic } from './combobox/basic';
import { ComboboxControlled } from './combobox/controlled';
import { FileUploadDefaultItems } from './file-upload/default-items';
import { FileUploadOnFiles } from './file-upload/on-files';
import { AvatarInitialsAndStatus } from './avatar/initials-and-status';
import { AvatarSizesAndShapes } from './avatar/sizes-and-shapes';
import { AvatarImage } from './avatar/image';
import { CardStructured } from './card/structured';
import { CardPlain } from './card/plain';
import { CardAsLink } from './card/as-link';
import { TagBasic } from './tag/basic';
import { TagRemovable } from './tag/removable';
import { IconRegistry } from './icon/registry';
import { IconSizeAndLabel } from './icon/size-and-label';
import { SkeletonContentShape } from './skeleton/content-shape';
import { SkeletonCard } from './skeleton/card';
import { AccordionBasic } from './accordion/basic';
import { AccordionMultiple } from './accordion/multiple';
import { IconButtonVariants } from './icon-button/variants';
import { IconButtonSizesAndDisabled } from './icon-button/sizes-and-disabled';
import { TableBasic } from './table/basic';
import { TableAlignment } from './table/alignment';
import { StatMetricsGrid } from './stat/metrics-grid';
import { StatDirections } from './stat/directions';
import { EmptyStateNoProjects } from './empty-state/no-projects';
import { EmptyStateNoResults } from './empty-state/no-results';
import { FileManagerBrowse } from './file-manager/browse';
import { FileManagerControlledView } from './file-manager/controlled-view';
import { FileManagerCustomActions } from './file-manager/custom-actions';
import { BreadcrumbBasic } from './breadcrumb/basic';
import { BreadcrumbPartialTrail } from './breadcrumb/partial-trail';
import { TabsLine } from './tabs/line';
import { TabsPillsAndCounts } from './tabs/pills-and-counts';
import { PaginationPages } from './pagination/pages';
import { PaginationBoundary } from './pagination/boundary';
import { StepperCurrentStep } from './stepper/current-step';
import { StepperStart } from './stepper/start';
import { DropdownActions } from './dropdown/actions';
import { DropdownAlignEnd } from './dropdown/align-end';
import { SidebarGroupProjects } from './sidebar-group/projects';
import { SidebarGroupCollapsible } from './sidebar-group/collapsible';
import { CommandPaletteInline } from './command-palette/inline';
import { CommandPaletteHints } from './command-palette/hints';
import { WorkspaceSwitcherSelection } from './workspace-switcher/selection';
import { WorkspaceSwitcherCreate } from './workspace-switcher/create';
import { AlertTones } from './alert/tones';
import { AlertTitleAndIcon } from './alert/title-and-icon';
import { ToastBasic } from './toast/basic';
import { ToastInAStack } from './toast/in-a-stack';
import { ProgressLabelled } from './progress/labelled';
import { ProgressTones } from './progress/tones';
import { SpinnerSizes } from './spinner/sizes';
import { SpinnerInContext } from './spinner/in-context';
import { TooltipButton } from './tooltip/button';
import { TooltipIconButton } from './tooltip/icon-button';
import { CookieBannerDefaultCopy } from './cookie-banner/default-copy';
import { CookieBannerCustomCopy } from './cookie-banner/custom-copy';
import { DrawerBasic } from './drawer/basic';
import { DrawerWithoutFooter } from './drawer/without-footer';
import { CreateWorkspaceDialogBasic } from './create-workspace-dialog/basic';
import { CreateWorkspaceDialogCustomCopy } from './create-workspace-dialog/custom-copy';
import { AvatarGroupPeople } from './avatar/group';
import { WhiteLabelBrands } from './white-label/brands';

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
  textarea: {
    basic: TextareaBasic,
    'error-and-rows': TextareaErrorAndRows,
  },
  checkbox: {
    basic: CheckboxBasic,
    states: CheckboxStates,
  },
  radio: {
    basic: RadioBasic,
    disabled: RadioDisabled,
  },
  switch: {
    basic: SwitchBasic,
    disabled: SwitchDisabled,
  },
  select: {
    basic: SelectBasic,
    'sizes-and-error': SelectSizesAndError,
  },
  combobox: {
    basic: ComboboxBasic,
    controlled: ComboboxControlled,
  },
  'file-upload': {
    'default-items': FileUploadDefaultItems,
    'on-files': FileUploadOnFiles,
  },
  avatar: {
    'initials-and-status': AvatarInitialsAndStatus,
    'sizes-and-shapes': AvatarSizesAndShapes,
    image: AvatarImage,
    group: AvatarGroupPeople,
  },
  card: {
    structured: CardStructured,
    plain: CardPlain,
    'as-link': CardAsLink,
  },
  tag: {
    basic: TagBasic,
    removable: TagRemovable,
  },
  icon: {
    registry: IconRegistry,
    'size-and-label': IconSizeAndLabel,
  },
  skeleton: {
    'content-shape': SkeletonContentShape,
    card: SkeletonCard,
  },
  accordion: {
    basic: AccordionBasic,
    multiple: AccordionMultiple,
  },
  'icon-button': {
    variants: IconButtonVariants,
    'sizes-and-disabled': IconButtonSizesAndDisabled,
  },
  table: {
    basic: TableBasic,
    alignment: TableAlignment,
  },
  stat: {
    'metrics-grid': StatMetricsGrid,
    directions: StatDirections,
  },
  'empty-state': {
    'no-projects': EmptyStateNoProjects,
    'no-results': EmptyStateNoResults,
  },
  'file-manager': {
    browse: FileManagerBrowse,
    'controlled-view': FileManagerControlledView,
    'custom-actions': FileManagerCustomActions,
  },
  breadcrumb: {
    basic: BreadcrumbBasic,
    'partial-trail': BreadcrumbPartialTrail,
  },
  tabs: {
    line: TabsLine,
    'pills-and-counts': TabsPillsAndCounts,
  },
  pagination: {
    pages: PaginationPages,
    boundary: PaginationBoundary,
  },
  stepper: {
    'current-step': StepperCurrentStep,
    start: StepperStart,
  },
  dropdown: {
    actions: DropdownActions,
    'align-end': DropdownAlignEnd,
  },
  'sidebar-group': {
    projects: SidebarGroupProjects,
    collapsible: SidebarGroupCollapsible,
  },
  'command-palette': {
    inline: CommandPaletteInline,
    hints: CommandPaletteHints,
  },
  'workspace-switcher': {
    selection: WorkspaceSwitcherSelection,
    create: WorkspaceSwitcherCreate,
  },
  alert: {
    tones: AlertTones,
    'title-and-icon': AlertTitleAndIcon,
  },
  toast: {
    basic: ToastBasic,
    'in-a-stack': ToastInAStack,
  },
  progress: {
    labelled: ProgressLabelled,
    tones: ProgressTones,
  },
  spinner: {
    sizes: SpinnerSizes,
    'in-context': SpinnerInContext,
  },
  tooltip: {
    button: TooltipButton,
    'icon-button': TooltipIconButton,
  },
  'cookie-banner': {
    'default-copy': CookieBannerDefaultCopy,
    'custom-copy': CookieBannerCustomCopy,
  },
  drawer: {
    basic: DrawerBasic,
    'without-footer': DrawerWithoutFooter,
  },
  'create-workspace-dialog': {
    basic: CreateWorkspaceDialogBasic,
    'custom-copy': CreateWorkspaceDialogCustomCopy,
  },
  'white-label': {
    brands: WhiteLabelBrands,
  },
};
