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
 * Renders one foundations reference page for the given locale.
 *
 * This deliberately shares the guide and component example machinery. Examples
 * are keyed by a page namespace, while source highlighting reads from that
 * namespace's directory, so a foundation demo has one source for both its live
 * preview and the code readers copy. `lib/guides.ts` guards collisions across
 * every namespace that uses this registry.
 */
export async function FoundationPage({ locale, slug }: { locale: Locale; slug: string }) {
  const mod = (await import(`../content/docs/${locale}/foundations/${slug}.mdx`)) as MdxModule;
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
    if (!Live) throw new Error(`Unknown example "${id}" for foundation "${slug}".`);

    return (
      <ExampleView title={title} layout={layout} preview={createElement(Live)} source={sources[id]}>
        {children}
      </ExampleView>
    );
  }

  return <MDX components={{ Example, pre: Pre }} />;
}
