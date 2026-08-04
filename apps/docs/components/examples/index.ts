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
import { ContainerBasic } from './container/basic';
import { ContainerNested } from './container/nested';
import { StackDefault } from './stack/default';
import { StackDistribution } from './stack/distribution';
import { StackInline } from './stack/inline';
import { GridColumns } from './grid/columns';
import { GridResponsive } from './grid/responsive';
import { PageHeaderBasic } from './page-header/basic';
import { PageHeaderActions } from './page-header/actions';
import { ShellDocsSite } from './shell/docs-site';
import { ShellApplication } from './shell/application';
import { ThemeProviderToggle } from './theme-provider/toggle';
import { ThemeProviderSystem } from './theme-provider/system';
import { NavbarBasic } from './navbar/basic';
import { NavbarActions } from './navbar/actions';
import { NavbarNavLink } from './navbar/nav-link';
import { FooterBasic } from './footer/basic';
import { FooterLinks } from './footer/links';
import { TableOfContentsBasic } from './table-of-contents/basic';
import { TableOfContentsScrollSpy } from './table-of-contents/scroll-spy';
import { CodeBlockBasic } from './code-block/basic';
import { CodeBlockLineNumbers } from './code-block/line-numbers';
import { CodeBlockCopyText } from './code-block/copy-text';
import { CodeBlockWrap } from './code-block/wrap';
import { BrandWordmark } from './brand/wordmark';
import { BrandMarkOnly } from './brand/mark-only';
import { BrandAsChild } from './brand/as-child';
import { SegmentedControlBasic } from './segmented-control/basic';
import { SegmentedControlDisabled } from './segmented-control/disabled';
import { CommandPaletteTrigger } from './command-palette/trigger';
import { RadioGroupBasic } from './radio-group/basic';
import { RadioGroupRow } from './radio-group/row';
import { CheckboxGroupBasic } from './checkbox-group/basic';
import { CheckboxGroupRowAndError } from './checkbox-group/row-and-error';
import { FieldsetBasic } from './fieldset/basic';
import { FieldsetColumns } from './fieldset/columns';
import { SeparatorBasic } from './separator/basic';
import { SeparatorLabel } from './separator/label';
import { SeparatorVertical } from './separator/vertical';
import { TimeInputBasic } from './time-input/basic';
import { TimeInputRange } from './time-input/range';
import { TimeInputLabels } from './time-input/labels';
import { SegmentedRingBasic } from './segmented-ring/basic';
import { SegmentedRingCompact } from './segmented-ring/compact';

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
  container: {
    basic: ContainerBasic,
    nested: ContainerNested,
  },
  stack: {
    default: StackDefault,
    distribution: StackDistribution,
    inline: StackInline,
  },
  grid: {
    columns: GridColumns,
    responsive: GridResponsive,
  },
  'page-header': {
    basic: PageHeaderBasic,
    actions: PageHeaderActions,
  },
  shell: {
    'docs-site': ShellDocsSite,
    application: ShellApplication,
  },
  'theme-provider': {
    toggle: ThemeProviderToggle,
    system: ThemeProviderSystem,
  },
  navbar: {
    basic: NavbarBasic,
    actions: NavbarActions,
    'nav-link': NavbarNavLink,
  },
  footer: {
    basic: FooterBasic,
    links: FooterLinks,
  },
  'table-of-contents': {
    basic: TableOfContentsBasic,
    'scroll-spy': TableOfContentsScrollSpy,
  },
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
    trigger: CommandPaletteTrigger,
  },
  'code-block': {
    basic: CodeBlockBasic,
    'line-numbers': CodeBlockLineNumbers,
    'copy-text': CodeBlockCopyText,
    wrap: CodeBlockWrap,
  },
  brand: {
    wordmark: BrandWordmark,
    'mark-only': BrandMarkOnly,
    'as-child': BrandAsChild,
  },
  'segmented-control': {
    basic: SegmentedControlBasic,
    disabled: SegmentedControlDisabled,
  },
  'radio-group': {
    basic: RadioGroupBasic,
    row: RadioGroupRow,
  },
  'checkbox-group': {
    basic: CheckboxGroupBasic,
    'row-and-error': CheckboxGroupRowAndError,
  },
  fieldset: {
    basic: FieldsetBasic,
    columns: FieldsetColumns,
  },
  separator: {
    basic: SeparatorBasic,
    label: SeparatorLabel,
    vertical: SeparatorVertical,
  },
  'time-input': {
    basic: TimeInputBasic,
    range: TimeInputRange,
    labels: TimeInputLabels,
  },
  'segmented-ring': {
    basic: SegmentedRingBasic,
    compact: SegmentedRingCompact,
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
