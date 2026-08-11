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
const DEFAULT_ABSENCE: Record<DocStack, string> = {
  react: 'absenceReactMissing',
  html: 'absenceHtmlNever',
  alpine: 'absenceAlpineStatic',
  blade: 'absenceBladePending',
};

const manifest: ComponentEntry[] = [
  { slug: 'container', name: 'Container', group: 'layout', stacks: ['react', 'html'] },
  { slug: 'stack', name: 'Stack', group: 'layout', stacks: ['react', 'html'] },
  { slug: 'grid', name: 'Grid', group: 'layout', stacks: ['react', 'html'] },
  { slug: 'page-header', name: 'PageHeader', group: 'layout', stacks: ['react', 'html'] },
  { slug: 'shell', name: 'Shell', group: 'layout', stacks: ['react', 'html'] },
  {
    slug: 'theme-provider',
    name: 'ThemeProvider',
    group: 'system',
    stacks: ['react', 'alpine'],
    absence: { blade: 'absenceBladeThemeProvider' },
  },
  { slug: 'navbar', name: 'Navbar', group: 'navigation', stacks: ['react', 'html'] },
  { slug: 'footer', name: 'Footer', group: 'navigation', stacks: ['react', 'html'] },
  {
    slug: 'table-of-contents',
    name: 'TableOfContents',
    group: 'navigation',
    stacks: ['react', 'alpine'],
  },
  { slug: 'code-block', name: 'CodeBlock', group: 'display', stacks: ['react', 'alpine'] },
  { slug: 'brand', name: 'Brand', group: 'display', stacks: ['react', 'html'] },
  {
    slug: 'segmented-control',
    name: 'SegmentedControl',
    group: 'form',
    stacks: ['react', 'alpine'],
  },
  { slug: 'button', name: 'Button', group: 'action', stacks: ['react', 'html'] },
  { slug: 'badge', name: 'Badge', group: 'display', stacks: ['react', 'html'] },
  { slug: 'input', name: 'Input', group: 'form', stacks: ['react', 'html'] },
  { slug: 'dialog', name: 'Dialog', group: 'overlay', stacks: ['react', 'alpine'] },
  { slug: 'textarea', name: 'Textarea', group: 'form', stacks: ['react', 'html'] },
  { slug: 'checkbox', name: 'Checkbox', group: 'form', stacks: ['react', 'html'] },
  { slug: 'radio', name: 'Radio', group: 'form', stacks: ['react', 'html'] },
  { slug: 'switch', name: 'Switch', group: 'form', stacks: ['react', 'html'] },
  { slug: 'select', name: 'Select', group: 'form', stacks: ['react', 'html'] },
  { slug: 'combobox', name: 'Combobox', group: 'form', stacks: ['react', 'alpine'] },
  { slug: 'file-upload', name: 'FileUpload', group: 'form', stacks: ['react', 'alpine'] },
  { slug: 'avatar', name: 'Avatar', group: 'display', stacks: ['react', 'html'] },
  { slug: 'card', name: 'Card', group: 'display', stacks: ['react', 'html'] },
  { slug: 'tag', name: 'Tag', group: 'display', stacks: ['react', 'html'] },
  { slug: 'icon', name: 'Icon', group: 'display', stacks: ['react', 'html'] },
  { slug: 'skeleton', name: 'Skeleton', group: 'display', stacks: ['react', 'html'] },
  { slug: 'accordion', name: 'Accordion', group: 'display', stacks: ['react', 'alpine'] },
  { slug: 'icon-button', name: 'IconButton', group: 'action', stacks: ['react', 'html'] },
  { slug: 'table', name: 'Table', group: 'data', stacks: ['react', 'html'] },
  { slug: 'stat', name: 'Stat', group: 'data', stacks: ['react', 'html'] },
  { slug: 'empty-state', name: 'EmptyState', group: 'data', stacks: ['react', 'html'] },
  { slug: 'file-manager', name: 'FileManager', group: 'data', stacks: ['react', 'alpine'] },
  { slug: 'breadcrumb', name: 'Breadcrumb', group: 'navigation', stacks: ['react', 'html'] },
  { slug: 'tabs', name: 'Tabs', group: 'navigation', stacks: ['react', 'alpine'] },
  { slug: 'pagination', name: 'Pagination', group: 'navigation', stacks: ['react', 'html'] },
  { slug: 'stepper', name: 'Stepper', group: 'navigation', stacks: ['react', 'html'] },
  { slug: 'dropdown', name: 'Dropdown', group: 'navigation', stacks: ['react', 'alpine'] },
  { slug: 'sidebar-group', name: 'SidebarGroup', group: 'navigation', stacks: ['react', 'alpine'] },
  {
    slug: 'command-palette',
    name: 'CommandPalette',
    group: 'navigation',
    stacks: ['react', 'alpine'],
  },
  {
    slug: 'workspace-switcher',
    name: 'WorkspaceSwitcher',
    group: 'navigation',
    stacks: ['react', 'alpine'],
  },
  { slug: 'alert', name: 'Alert', group: 'feedback', stacks: ['react', 'html'] },
  { slug: 'toast', name: 'Toast', group: 'feedback', stacks: ['react', 'alpine'] },
  { slug: 'progress', name: 'Progress', group: 'feedback', stacks: ['react', 'html'] },
  { slug: 'spinner', name: 'Spinner', group: 'feedback', stacks: ['react', 'html'] },
  { slug: 'tooltip', name: 'Tooltip', group: 'feedback', stacks: ['react', 'alpine'] },
  { slug: 'cookie-banner', name: 'CookieBanner', group: 'feedback', stacks: ['react', 'alpine'] },
  { slug: 'drawer', name: 'Drawer', group: 'overlay', stacks: ['react', 'alpine'] },
  {
    slug: 'create-workspace-dialog',
    name: 'CreateWorkspaceDialog',
    group: 'overlay',
    stacks: ['react', 'html'],
  },
  { slug: 'radio-group', name: 'RadioGroup', group: 'form', stacks: ['react', 'html'] },
  { slug: 'checkbox-group', name: 'CheckboxGroup', group: 'form', stacks: ['react', 'html'] },
  { slug: 'fieldset', name: 'Fieldset', group: 'form', stacks: ['react', 'html'] },
  { slug: 'separator', name: 'Separator', group: 'layout', stacks: ['react', 'html'] },
  { slug: 'time-input', name: 'TimeInput', group: 'form', stacks: ['react', 'alpine'] },
  { slug: 'segmented-ring', name: 'SegmentedRing', group: 'display', stacks: ['react', 'html'] },
  { slug: 'nav-link', name: 'NavLink', group: 'navigation', stacks: ['react', 'html'] },
  { slug: 'app-sidebar', name: 'AppSidebar', group: 'navigation', stacks: ['react', 'alpine'] },
  { slug: 'bottom-nav', name: 'BottomNav', group: 'navigation', stacks: ['react', 'html'] },
  { slug: 'action-bar', name: 'ActionBar', group: 'data', stacks: ['react', 'html'] },
  { slug: 'toast-provider', name: 'ToastProvider', group: 'feedback', stacks: ['react', 'html'] },
  { slug: 'data-table', name: 'DataTable', group: 'data', stacks: ['react', 'alpine'] },
  { slug: 'person-cell', name: 'PersonCell', group: 'data', stacks: ['react', 'html'] },
  { slug: 'popover', name: 'Popover', group: 'overlay', stacks: ['react', 'alpine'] },
  { slug: 'bottom-sheet', name: 'BottomSheet', group: 'overlay', stacks: ['react', 'alpine'] },
  { slug: 'calendar', name: 'Calendar', group: 'form', stacks: ['react', 'alpine'] },
  { slug: 'time-picker', name: 'TimePicker', group: 'form', stacks: ['react', 'alpine'] },
  { slug: 'date-picker', name: 'DatePicker', group: 'form', stacks: ['react', 'alpine'] },
  {
    slug: 'date-range-picker',
    name: 'DateRangePicker',
    group: 'form',
    stacks: ['react', 'alpine'],
  },
  { slug: 'time-zone-picker', name: 'TimeZonePicker', group: 'form', stacks: ['react', 'alpine'] },
  {
    slug: 'recurrence-selector',
    name: 'RecurrenceSelector',
    group: 'form',
    stacks: ['react', 'alpine'],
  },
  {
    slug: 'weekly-schedule-editor',
    name: 'WeeklyScheduleEditor',
    group: 'form',
    stacks: ['react', 'alpine'],
  },
  { slug: 'slot-picker', name: 'SlotPicker', group: 'form', stacks: ['react', 'alpine'] },
  {
    slug: 'calendar-view',
    name: 'CalendarView',
    group: 'data',
    stacks: ['react', 'html'],
    absence: { alpine: 'absenceAlpineCalendarView', blade: 'absenceBladeCalendarView' },
  },
  {
    slug: 'toast-stack',
    name: 'ToastStack',
    group: 'feedback',
    stacks: ['alpine'],
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
