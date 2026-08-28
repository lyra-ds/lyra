/**
 * Single source of truth for the documented components.
 *
 * Adding a component page is additive: append one entry here (the exported
 * `components` array is name-sorted, so authored position does not matter); drop
 * a `content/docs/{en,pt-BR}/components/<slug>.mdx` pair, and add example files
 * under `components/examples/<slug>/` registered in `components/examples`. The
 * route, static params, prop table and nav all derive from this manifest — no
 * central switch to edit.
 */
/**
 * Reader-facing taxonomy for the sidebar and the component index. Coarser than the
 * handoff's own categories on purpose: `action` keeps Button/IconButton out of
 * `display`, and `data` collects the components that render records.
 */
import { SIBLING, type DocStack } from './stacks';

/** The only support levels the public matrix may publish (Architecture §React, Alpine, and CSS equivalence). */
export const supportLevels = ['css', 'alpine-enhanced', 'react', 'unsupported'] as const;

export type SupportLevel = (typeof supportLevels)[number];

export const componentStabilities = ['experimental', 'beta', 'stable', 'deprecated'] as const;

export type ComponentStability = (typeof componentStabilities)[number];

/** A documented stack is classified separately from the set of tabs that a page happens to render. */
export const DOCUMENTED_SUPPORT_LEVEL: Record<
  Exclude<DocStack, 'blade'>,
  Exclude<SupportLevel, 'unsupported'>
> = {
  react: 'react',
  html: 'css',
  alpine: 'alpine-enhanced',
};

export type SupportGapMetadata = {
  missingCapabilityKey: string;
  reasonKey: string;
  userImpactKey: string;
  fallbackKey: string;
  evidenceStatusKey: string;
  evidenceHref: string;
  reevaluationOwnerKey: string;
};

/**
 * Baseline disclosure for every missing adapter. Individual manifest entries may replace the
 * reason key; the remaining fields stay centralized so a generic gap can never publish partial
 * information.
 */
export const DEFAULT_SUPPORT_GAPS: Record<DocStack, SupportGapMetadata> = {
  react: {
    missingCapabilityKey: 'supportMissingReact',
    reasonKey: 'absenceReactMissing',
    userImpactKey: 'supportImpactReact',
    fallbackKey: 'supportFallbackCssAlpine',
    evidenceStatusKey: 'supportEvidenceNotRecorded',
    evidenceHref: '#what-support-means',
    reevaluationOwnerKey: 'supportOwnerComponentArchitecture',
  },
  html: {
    missingCapabilityKey: 'supportMissingCss',
    reasonKey: 'absenceHtmlNever',
    userImpactKey: 'supportImpactCss',
    fallbackKey: 'supportFallbackReact',
    evidenceStatusKey: 'supportEvidenceNotRecorded',
    evidenceHref: '#what-support-means',
    reevaluationOwnerKey: 'supportOwnerComponentArchitecture',
  },
  alpine: {
    missingCapabilityKey: 'supportMissingAlpine',
    reasonKey: 'absenceAlpineStatic',
    userImpactKey: 'supportImpactAlpine',
    fallbackKey: 'supportFallbackReact',
    evidenceStatusKey: 'supportEvidenceNotRecorded',
    evidenceHref: '#what-support-means',
    reevaluationOwnerKey: 'supportOwnerComponentArchitecture',
  },
  blade: {
    missingCapabilityKey: 'supportMissingBlade',
    reasonKey: 'absenceBladePending',
    userImpactKey: 'supportImpactBlade',
    fallbackKey: 'supportFallbackReact',
    evidenceStatusKey: 'supportEvidenceBladeReleased',
    evidenceHref: '#blade-timing',
    reevaluationOwnerKey: 'supportOwnerBladeMaintainers',
  },
};

export type ComponentGroup =
  | 'layout'
  | 'action'
  | 'display'
  | 'data'
  | 'form'
  | 'navigation'
  | 'feedback'
  | 'overlay'
  | 'system';

export type ComponentEntry = {
  /** Kebab-case slug — matches the MDX filename and the example registry key. */
  slug: string;
  /** PascalCase name — matches the entry in `tools/docgen/output/props.json`. */
  name: string;
  group: ComponentGroup;
  /** Public lifecycle, independent from which adapters implement the component. */
  stability: ComponentStability;
  /** Stacks documentadas para este componente. Decide quais abas a página mostra. */
  stacks: DocStack[];
  /**
   * Chave de mensagem que explica cada stack ausente. Ausência sem explicação é buraco;
   * com explicação, é documentação — por isso o teste de invariantes cobra as duas. O que
   * não estiver declarado aqui recebe a explicação padrão de `DEFAULT_ABSENCE`.
   */
  absence?: Partial<Record<DocStack, string>>;
};

/**
 * Explicação padrão de cada ausência. A maioria dos casos é genérica — "ainda não" para
 * Blade, "é estático" para Alpine —, e declarar isso 74 vezes no manifesto esconderia as
 * ausências que têm motivo próprio, que são as que interessam ao leitor.
 */
const DEFAULT_ABSENCE: Record<DocStack, string> = Object.fromEntries(
  Object.entries(DEFAULT_SUPPORT_GAPS).map(([stack, gap]) => [stack, gap.reasonKey]),
) as Record<DocStack, string>;

const manifest: ComponentEntry[] = [
  {
    slug: 'container',
    name: 'Container',
    group: 'layout',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'stack',
    name: 'Stack',
    group: 'layout',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'grid',
    name: 'Grid',
    group: 'layout',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'page-header',
    name: 'PageHeader',
    group: 'layout',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'shell',
    name: 'Shell',
    group: 'layout',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'theme-provider',
    name: 'ThemeProvider',
    group: 'system',
    stability: 'beta',
    stacks: ['react', 'alpine'],
    absence: { blade: 'absenceBladeThemeProvider' },
  },
  {
    slug: 'navbar',
    name: 'Navbar',
    group: 'navigation',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'footer',
    name: 'Footer',
    group: 'navigation',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'table-of-contents',
    name: 'TableOfContents',
    group: 'navigation',
    stability: 'beta',
    stacks: ['react', 'alpine', 'blade'],
  },
  {
    slug: 'code-block',
    name: 'CodeBlock',
    group: 'display',
    stability: 'beta',
    stacks: ['react', 'alpine', 'blade'],
  },
  {
    slug: 'brand',
    name: 'Brand',
    group: 'display',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'segmented-control',
    name: 'SegmentedControl',
    group: 'form',
    stability: 'beta',
    stacks: ['react', 'alpine', 'blade'],
  },
  {
    slug: 'button',
    name: 'Button',
    group: 'action',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'badge',
    name: 'Badge',
    group: 'display',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'input',
    name: 'Input',
    group: 'form',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'dialog',
    name: 'Dialog',
    group: 'overlay',
    stability: 'beta',
    stacks: ['react', 'alpine', 'blade'],
  },
  {
    slug: 'textarea',
    name: 'Textarea',
    group: 'form',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'checkbox',
    name: 'Checkbox',
    group: 'form',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'radio',
    name: 'Radio',
    group: 'form',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'switch',
    name: 'Switch',
    group: 'form',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'select',
    name: 'Select',
    group: 'form',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'combobox',
    name: 'Combobox',
    group: 'form',
    stability: 'beta',
    stacks: ['react', 'alpine', 'blade'],
  },
  {
    slug: 'file-upload',
    name: 'FileUpload',
    group: 'form',
    stability: 'stable',
    stacks: ['react', 'alpine'],
    absence: { blade: 'absenceBladeFileUploadLifecycle' },
  },
  {
    slug: 'avatar',
    name: 'Avatar',
    group: 'display',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'card',
    name: 'Card',
    group: 'display',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'tag',
    name: 'Tag',
    group: 'display',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'icon',
    name: 'Icon',
    group: 'display',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'skeleton',
    name: 'Skeleton',
    group: 'display',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'accordion',
    name: 'Accordion',
    group: 'display',
    stability: 'beta',
    stacks: ['react', 'alpine', 'blade'],
  },
  {
    slug: 'icon-button',
    name: 'IconButton',
    group: 'action',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'table',
    name: 'Table',
    group: 'data',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'stat',
    name: 'Stat',
    group: 'data',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'empty-state',
    name: 'EmptyState',
    group: 'data',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'file-manager',
    name: 'FileManager',
    group: 'data',
    stability: 'beta',
    stacks: ['react', 'alpine', 'blade'],
  },
  {
    slug: 'breadcrumb',
    name: 'Breadcrumb',
    group: 'navigation',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'tabs',
    name: 'Tabs',
    group: 'navigation',
    stability: 'beta',
    stacks: ['react', 'alpine', 'blade'],
  },
  {
    slug: 'pagination',
    name: 'Pagination',
    group: 'navigation',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'stepper',
    name: 'Stepper',
    group: 'navigation',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'dropdown',
    name: 'Dropdown',
    group: 'navigation',
    stability: 'beta',
    stacks: ['react', 'alpine', 'blade'],
  },
  {
    slug: 'sidebar-group',
    name: 'SidebarGroup',
    group: 'navigation',
    stability: 'beta',
    stacks: ['react', 'alpine', 'blade'],
  },
  {
    slug: 'command-palette',
    name: 'CommandPalette',
    group: 'navigation',
    stability: 'beta',
    stacks: ['react', 'alpine', 'blade'],
  },
  {
    slug: 'workspace-switcher',
    name: 'WorkspaceSwitcher',
    group: 'navigation',
    stability: 'beta',
    stacks: ['react', 'alpine', 'blade'],
  },
  {
    slug: 'alert',
    name: 'Alert',
    group: 'feedback',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'toast',
    name: 'Toast',
    group: 'feedback',
    stability: 'beta',
    stacks: ['react', 'alpine', 'blade'],
  },
  {
    slug: 'progress',
    name: 'Progress',
    group: 'feedback',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'spinner',
    name: 'Spinner',
    group: 'feedback',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'tooltip',
    name: 'Tooltip',
    group: 'feedback',
    stability: 'beta',
    stacks: ['react', 'alpine', 'blade'],
  },
  {
    slug: 'cookie-banner',
    name: 'CookieBanner',
    group: 'feedback',
    stability: 'beta',
    stacks: ['react', 'alpine', 'blade'],
  },
  {
    slug: 'drawer',
    name: 'Drawer',
    group: 'overlay',
    stability: 'beta',
    stacks: ['react', 'alpine', 'blade'],
  },
  {
    slug: 'create-workspace-dialog',
    name: 'CreateWorkspaceDialog',
    group: 'overlay',
    stability: 'beta',
    stacks: ['react', 'html'],
  },
  {
    slug: 'radio-group',
    name: 'RadioGroup',
    group: 'form',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'checkbox-group',
    name: 'CheckboxGroup',
    group: 'form',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'fieldset',
    name: 'Fieldset',
    group: 'form',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'separator',
    name: 'Separator',
    group: 'layout',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'time-input',
    name: 'TimeInput',
    group: 'form',
    stability: 'beta',
    stacks: ['react', 'alpine', 'blade'],
  },
  {
    slug: 'segmented-ring',
    name: 'SegmentedRing',
    group: 'display',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'nav-link',
    name: 'NavLink',
    group: 'navigation',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'app-sidebar',
    name: 'AppSidebar',
    group: 'navigation',
    stability: 'beta',
    stacks: ['react', 'alpine', 'blade'],
  },
  {
    slug: 'bottom-nav',
    name: 'BottomNav',
    group: 'navigation',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'action-bar',
    name: 'ActionBar',
    group: 'data',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'toast-provider',
    name: 'ToastProvider',
    group: 'feedback',
    stability: 'beta',
    stacks: ['react', 'html'],
  },
  {
    slug: 'data-table',
    name: 'DataTable',
    group: 'data',
    stability: 'beta',
    stacks: ['react', 'alpine', 'blade'],
  },
  {
    slug: 'person-cell',
    name: 'PersonCell',
    group: 'data',
    stability: 'beta',
    stacks: ['react', 'html', 'blade'],
  },
  {
    slug: 'popover',
    name: 'Popover',
    group: 'overlay',
    stability: 'beta',
    stacks: ['react', 'alpine', 'blade'],
  },
  {
    slug: 'bottom-sheet',
    name: 'BottomSheet',
    group: 'overlay',
    stability: 'beta',
    stacks: ['react', 'alpine', 'blade'],
  },
  {
    slug: 'calendar',
    name: 'Calendar',
    group: 'form',
    stability: 'beta',
    stacks: ['react', 'alpine', 'blade'],
  },
  {
    slug: 'time-picker',
    name: 'TimePicker',
    group: 'form',
    stability: 'beta',
    stacks: ['react', 'alpine', 'blade'],
  },
  {
    slug: 'date-picker',
    name: 'DatePicker',
    group: 'form',
    stability: 'beta',
    stacks: ['react', 'alpine', 'blade'],
  },
  {
    slug: 'date-range-picker',
    name: 'DateRangePicker',
    group: 'form',
    stability: 'beta',
    stacks: ['react', 'alpine', 'blade'],
  },
  {
    slug: 'time-zone-picker',
    name: 'TimeZonePicker',
    group: 'form',
    stability: 'beta',
    stacks: ['react', 'alpine', 'blade'],
  },
  {
    slug: 'recurrence-selector',
    name: 'RecurrenceSelector',
    group: 'form',
    stability: 'beta',
    stacks: ['react', 'alpine', 'blade'],
  },
  {
    slug: 'weekly-schedule-editor',
    name: 'WeeklyScheduleEditor',
    group: 'form',
    stability: 'beta',
    stacks: ['react', 'alpine', 'blade'],
  },
  {
    slug: 'slot-picker',
    name: 'SlotPicker',
    group: 'form',
    stability: 'beta',
    stacks: ['react', 'alpine', 'blade'],
  },
  {
    slug: 'calendar-view',
    name: 'CalendarView',
    group: 'data',
    stability: 'beta',
    stacks: ['react', 'html'],
    absence: { alpine: 'absenceAlpineCalendarView', blade: 'absenceBladeCalendarView' },
  },
  {
    slug: 'toast-stack',
    name: 'ToastStack',
    group: 'feedback',
    stability: 'beta',
    stacks: ['alpine', 'blade'],
    absence: { react: 'absenceReactToastStack' },
  },
];

export const components: ComponentEntry[] = [...manifest]
  .map((entry) => ({
    ...entry,
    absence: Object.fromEntries(
      (Object.keys(DEFAULT_ABSENCE) as DocStack[])
        .filter((stack) => !entry.stacks.includes(stack))
        // A ausência de `html` num componente com binding (e vice-versa) não é ausência:
        // é a mesma aba com outro nome, e anunciá-la seria ruído para o leitor.
        .filter((stack) => {
          const sibling = SIBLING[stack];

          return !sibling || !entry.stacks.includes(sibling);
        })
        .map((stack) => [stack, entry.absence?.[stack] ?? DEFAULT_ABSENCE[stack]]),
    ),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

/** Group order used by the sidebar, the index page and the ⌘K palette alike. */
export const groupOrder: ComponentGroup[] = [
  'layout',
  'action',
  'form',
  'display',
  'data',
  'navigation',
  'feedback',
  'overlay',
  'system',
];

/** Group → next-intl message key. Kept here so the three navs cannot drift apart. */
export const groupLabelKey: Record<ComponentGroup, string> = {
  layout: 'groupLayout',
  action: 'groupAction',
  form: 'groupForm',
  display: 'groupDisplay',
  data: 'groupData',
  navigation: 'groupNavigation',
  feedback: 'groupFeedback',
  overlay: 'groupOverlay',
  system: 'groupSystem',
};

export const componentSlugs = components.map((entry) => entry.slug);

export function getComponent(slug: string): ComponentEntry | undefined {
  return components.find((entry) => entry.slug === slug);
}
