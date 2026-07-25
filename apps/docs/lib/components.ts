/**
 * Single source of truth for the documented components.
 *
 * Adding a component page is additive: append one entry here, drop a
 * `content/docs/{en,pt-BR}/components/<slug>.mdx` pair, and add example files
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
  'action' | 'display' | 'data' | 'form' | 'navigation' | 'feedback' | 'overlay';

export type ComponentEntry = {
  /** Kebab-case slug — matches the MDX filename and the example registry key. */
  slug: string;
  /** PascalCase name — matches the entry in `tools/docgen/output/props.json`. */
  name: string;
  group: ComponentGroup;
};

export const components: ComponentEntry[] = [
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
];

/** Group order used by the sidebar, the index page and the ⌘K palette alike. */
export const groupOrder: ComponentGroup[] = [
  'action',
  'form',
  'display',
  'data',
  'navigation',
  'feedback',
  'overlay',
];

/** Group → next-intl message key. Kept here so the three navs cannot drift apart. */
export const groupLabelKey: Record<ComponentGroup, string> = {
  action: 'groupAction',
  form: 'groupForm',
  display: 'groupDisplay',
  data: 'groupData',
  navigation: 'groupNavigation',
  feedback: 'groupFeedback',
  overlay: 'groupOverlay',
};

export const componentSlugs = components.map((entry) => entry.slug);

export function getComponent(slug: string): ComponentEntry | undefined {
  return components.find((entry) => entry.slug === slug);
}
