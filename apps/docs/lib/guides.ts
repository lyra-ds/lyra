/**
 * Single source of truth for the prose guides.
 *
 * Mirrors `lib/components.ts` on purpose: adding a guide is additive — append one
 * entry here and drop a `content/docs/{en,pt-BR}/guides/<slug>.mdx` pair. The route,
 * static params and nav all derive from this manifest.
 *
 * Guides differ from component pages in one way that matters: their title is not a
 * component name, so it has to be translated. Hence `titleKey` instead of `name`.
 */
import { componentSlugs } from './components';
import { foundationSlugs } from './foundations';

export type GuideEntry = {
  /** Kebab-case slug — matches the MDX filename and the example-registry key. */
  slug: string;
  /** next-intl message key for the nav label and the index entry. */
  titleKey: string;
};

export const guides: GuideEntry[] = [
  { slug: 'getting-started', titleKey: 'gettingStarted' },
  { slug: 'white-label', titleKey: 'whiteLabel' },
  { slug: 'plain-html', titleKey: 'plainHtml' },
  { slug: 'compat-shadcn', titleKey: 'compatShadcn' },
  { slug: 'prose', titleKey: 'prose' },
];

export const guideSlugs = guides.map((entry) => entry.slug);

export function getGuide(slug: string): GuideEntry | undefined {
  return guides.find((entry) => entry.slug === slug);
}

/**
 * Guides and components share one example registry, keyed by slug (see
 * `components/examples/index.ts`). A guide whose slug collides with a component's would
 * silently render that component's examples instead of its own — the page would build and
 * look plausible, which is the worst kind of wrong. Assert it at module load: this module
 * is imported during static generation, so a collision fails the build instead of shipping.
 */
const collisions = guideSlugs.filter(
  (slug) => componentSlugs.includes(slug) || foundationSlugs.includes(slug),
);
if (collisions.length > 0) {
  throw new Error(
    `Guide slug collides with a component or foundation slug: ${collisions.join(', ')}. ` +
      'Guides, foundations and components share the example registry namespace — rename the guide.',
  );
}
