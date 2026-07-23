/**
 * Single source of truth for the documented components.
 *
 * Adding a component page is additive: append one entry here, drop a
 * `content/docs/{en,pt-BR}/components/<slug>.mdx` pair, and register a preview
 * in `components/previews`. The route, static params, prop table and nav all
 * derive from this manifest — no central switch to edit.
 */
export type ComponentGroup = 'display' | 'form' | 'navigation' | 'feedback' | 'overlay' | 'layout';

export type ComponentEntry = {
  /** Kebab-case slug — matches the MDX filename and the preview registry key. */
  slug: string;
  /** PascalCase name — matches the entry in `tools/docgen/output/props.json`. */
  name: string;
  group: ComponentGroup;
};

export const components: ComponentEntry[] = [{ slug: 'dialog', name: 'Dialog', group: 'overlay' }];

export const componentSlugs = components.map((entry) => entry.slug);

export function getComponent(slug: string): ComponentEntry | undefined {
  return components.find((entry) => entry.slug === slug);
}
