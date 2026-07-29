import { createElement, type ComponentType, type ReactNode } from 'react';
import { highlightExampleSource } from '@/lib/highlight-source';
import type { Locale } from '@/lib/i18n';
import { ExampleView, type ExampleLayout } from './example-view';
import { examples } from './examples';
import { Pre } from './pre';

type MdxModule = {
  default: ComponentType<{ components?: Record<string, ComponentType<any>> }>;
};

/**
 * Renders one prose guide's MDX for the given locale.
 *
 * Deliberately the same shape as `ComponentPage`, and deliberately sharing its example
 * machinery rather than growing a parallel one: `examples` is keyed by an arbitrary
 * namespace string, and `highlightExampleSource` reads
 * `components/examples/<namespace>/<id>.tsx` — neither is actually tied to a component.
 * A guide registers `components/examples/<guide-slug>/…` exactly like a component does, so
 * a live demo inside a guide is written, highlighted and kept in sync by the same one path.
 * `lib/guides.ts` guards the one hazard that sharing introduces (a slug collision).
 *
 * It does NOT accept `PropTable`: prop tables are generated per component from
 * `props.json`, and a guide has no component to look up. A guide that needs one is a
 * component page wearing the wrong hat.
 */
export async function GuidePage({ locale, slug }: { locale: Locale; slug: string }) {
  const mod = (await import(`../content/docs/${locale}/guides/${slug}.mdx`)) as MdxModule;
  const MDX = mod.default;
  const registered = examples[slug] ?? {};

  const sources = Object.fromEntries(
    await Promise.all(
      Object.keys(registered).map(
        async (id) => [id, await highlightExampleSource(slug, id)] as const,
      ),
    ),
  );

  function Example({
    id,
    title,
    layout,
    children,
  }: {
    id: string;
    title?: string;
    layout?: ExampleLayout;
    children?: ReactNode;
  }) {
    const Live = registered[id];
    if (!Live) throw new Error(`Unknown example "${id}" for guide "${slug}".`);

    return (
      <ExampleView title={title} layout={layout} preview={createElement(Live)} source={sources[id]}>
        {children}
      </ExampleView>
    );
  }

  return <MDX components={{ Example, pre: Pre }} />;
}
