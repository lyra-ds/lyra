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
};

const manifest: ComponentEntry[] = [
  { slug: 'container', name: 'Container', group: 'layout' },
  { slug: 'stack', name: 'Stack', group: 'layout' },
  { slug: 'grid', name: 'Grid', group: 'layout' },
  { slug: 'page-header', name: 'PageHeader', group: 'layout' },
  { slug: 'shell', name: 'Shell', group: 'layout' },
  { slug: 'theme-provider', name: 'ThemeProvider', group: 'system' },
  { slug: 'navbar', name: 'Navbar', group: 'navigation' },
  { slug: 'footer', name: 'Footer', group: 'navigation' },
  { slug: 'table-of-contents', name: 'TableOfContents', group: 'navigation' },
  { slug: 'code-block', name: 'CodeBlock', group: 'display' },
  { slug: 'brand', name: 'Brand', group: 'display' },
  { slug: 'segmented-control', name: 'SegmentedControl', group: 'form' },
  { slug: 'button', name: 'Button', group: 'action' },
  { slug: 'badge', name: 'Badge', group: 'display' },
  { slug: 'input', name: 'Input', group: 'form' },
  { slug: 'dialog', name: 'Dialog', group: 'overlay' },
  { slug: 'textarea', name: 'Textarea', group: 'form' },
  { slug: 'checkbox', name: 'Checkbox', group: 'form' },
  { slug: 'radio', name: 'Radio', group: 'form' },
  { slug: 'switch', name: 'Switch', group: 'form' },
  { slug: 'select', name: 'Select', group: 'form' },
  { slug: 'combobox', name: 'Combobox', group: 'form' },
  { slug: 'file-upload', name: 'FileUpload', group: 'form' },
  { slug: 'avatar', name: 'Avatar', group: 'display' },
  { slug: 'card', name: 'Card', group: 'display' },
  { slug: 'tag', name: 'Tag', group: 'display' },
  { slug: 'icon', name: 'Icon', group: 'display' },
  { slug: 'skeleton', name: 'Skeleton', group: 'display' },
  { slug: 'accordion', name: 'Accordion', group: 'display' },
  { slug: 'icon-button', name: 'IconButton', group: 'action' },
  { slug: 'table', name: 'Table', group: 'data' },
  { slug: 'stat', name: 'Stat', group: 'data' },
  { slug: 'empty-state', name: 'EmptyState', group: 'data' },
  { slug: 'file-manager', name: 'FileManager', group: 'data' },
  { slug: 'breadcrumb', name: 'Breadcrumb', group: 'navigation' },
  { slug: 'tabs', name: 'Tabs', group: 'navigation' },
  { slug: 'pagination', name: 'Pagination', group: 'navigation' },
  { slug: 'stepper', name: 'Stepper', group: 'navigation' },
  { slug: 'dropdown', name: 'Dropdown', group: 'navigation' },
  { slug: 'sidebar-group', name: 'SidebarGroup', group: 'navigation' },
  { slug: 'command-palette', name: 'CommandPalette', group: 'navigation' },
  { slug: 'workspace-switcher', name: 'WorkspaceSwitcher', group: 'navigation' },
  { slug: 'alert', name: 'Alert', group: 'feedback' },
  { slug: 'toast', name: 'Toast', group: 'feedback' },
  { slug: 'progress', name: 'Progress', group: 'feedback' },
  { slug: 'spinner', name: 'Spinner', group: 'feedback' },
  { slug: 'tooltip', name: 'Tooltip', group: 'feedback' },
  { slug: 'cookie-banner', name: 'CookieBanner', group: 'feedback' },
  { slug: 'drawer', name: 'Drawer', group: 'overlay' },
  { slug: 'create-workspace-dialog', name: 'CreateWorkspaceDialog', group: 'overlay' },
  { slug: 'radio-group', name: 'RadioGroup', group: 'form' },
  { slug: 'checkbox-group', name: 'CheckboxGroup', group: 'form' },
  { slug: 'fieldset', name: 'Fieldset', group: 'form' },
  { slug: 'separator', name: 'Separator', group: 'layout' },
  { slug: 'time-input', name: 'TimeInput', group: 'form' },
  { slug: 'segmented-ring', name: 'SegmentedRing', group: 'display' },
  { slug: 'nav-link', name: 'NavLink', group: 'navigation' },
  { slug: 'app-sidebar', name: 'AppSidebar', group: 'navigation' },
  { slug: 'bottom-nav', name: 'BottomNav', group: 'navigation' },
  { slug: 'action-bar', name: 'ActionBar', group: 'data' },
  { slug: 'toast-provider', name: 'ToastProvider', group: 'feedback' },
];

export const components: ComponentEntry[] = [...manifest].sort((a, b) =>
  a.name.localeCompare(b.name),
);

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
