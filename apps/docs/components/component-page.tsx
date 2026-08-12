import { createElement, type ComponentType, type ReactNode } from 'react';
import { getComponent } from '@/lib/components';
import { highlightExampleSource } from '@/lib/highlight-source';
import type { Locale } from '@/lib/i18n';
import type { DocStack } from '@/lib/stacks';
import { ExampleView, type ExampleLayout } from './example-view';
import { examples } from './examples';
import { Pre } from './pre';
import { PropTable } from './prop-table';
import { StackApi } from './stack-api';
import { StackPanel, StackTabs } from './stack-tabs';

type MdxModule = {
  default: ComponentType<{ components?: Record<string, ComponentType<any>> }>;
};

/**
 * Renders a single component's MDX page for the given locale. The MDX module is
 * loaded by slug via a webpack context (static-export safe — every slug is
 * enumerated by `generateStaticParams`), so no per-component import is hardcoded.
 *
 * Every example registered for the slug is highlighted here, at build time, from its
 * own source file. `<Example id="…" />` in MDX then renders the live component and
 * that source together — one file behind both, so they cannot drift apart.
 */
export async function ComponentPage({ locale, slug }: { locale: Locale; slug: string }) {
  const mod = (await import(`../content/docs/${locale}/components/${slug}.mdx`)) as MdxModule;
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
    isolatedDocument,
    mirrorTheme,
    title,
    layout,
    children,
  }: {
    id: string;
    isolatedDocument?: boolean;
    mirrorTheme?: boolean;
    title?: string;
    layout?: ExampleLayout;
    children?: ReactNode;
  }) {
    const Live = registered[id];
    if (!Live) throw new Error(`Unknown example "${id}" for component "${slug}".`);

    return (
      <ExampleView
        title={title}
        layout={layout}
        mirrorTheme={mirrorTheme}
        preview={createElement(Live)}
        source={sources[id]}
        documentSrc={isolatedDocument ? `/example-preview/${slug}/${id}` : undefined}
      >
        {children}
      </ExampleView>
    );
  }

  const entry = getComponent(slug);
  if (!entry) throw new Error(`Unknown component "${slug}".`);

  /**
   * O MDX escreve `<StackApi stack="alpine" />` sem repetir slug e nome: quem sabe de que
   * componente a página trata é esta função, e passar isso adiante em cada página seria
   * uma chance a mais de o MDX e o manifesto divergirem.
   */
  function Api({ stack }: { stack: DocStack }) {
    return <StackApi slug={slug} stack={stack} name={entry!.name} />;
  }

  function Tabs({ children }: { children: ReactNode }) {
    return (
      <StackTabs available={entry!.stacks} absence={entry!.absence}>
        {children}
      </StackTabs>
    );
  }

  return (
    <MDX
      components={{ Example, PropTable, StackApi: Api, StackPanel, StackTabs: Tabs, pre: Pre }}
    />
  );
}
