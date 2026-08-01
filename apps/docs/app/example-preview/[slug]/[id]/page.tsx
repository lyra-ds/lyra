import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { ComponentType } from 'react';
import { ThemeProviderSystem } from '@/components/examples/theme-provider/system';
import { ThemeProviderToggle } from '@/components/examples/theme-provider/toggle';

const previews: Record<string, Record<string, ComponentType>> = {
  'theme-provider': {
    system: ThemeProviderSystem,
    toggle: ThemeProviderToggle,
  },
};

export function generateStaticParams() {
  return Object.entries(previews).flatMap(([slug, examples]) =>
    Object.keys(examples).map((id) => ({ slug, id })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}): Promise<Metadata> {
  const { id, slug } = await params;

  if (!previews[slug]?.[id]) return {};

  return { title: `ThemeProvider preview: ${id}` };
}

export default async function ExamplePreviewPage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { id, slug } = await params;
  const Preview = previews[slug]?.[id];

  if (!Preview) notFound();

  return (
    <main style={{ padding: '1rem' }}>
      <Preview />
    </main>
  );
}
