/**
 * Single source of truth for the foundations reference pages.
 *
 * Keep planned topics in this manifest before their MDX ships. Setting `published`
 * to true makes a page available to static generation, the sidebar and ⌘K in one
 * place; later lots only need to add their MDX pair and flip that flag.
 */
import { componentSlugs } from './components';

export type FoundationEntry = {
  /** Kebab-case slug — matches the MDX filename and the example-registry key. */
  slug: string;
  /** next-intl message key for the nav label and command-palette entry. */
  titleKey: string;
  /** Whether this topic has a complete MDX page in both locales. */
  published: boolean;
};

export const foundations: FoundationEntry[] = [
  { slug: 'colors', titleKey: 'foundationColors', published: true },
  { slug: 'typography', titleKey: 'foundationTypography', published: false },
  { slug: 'spacing', titleKey: 'foundationSpacing', published: false },
  { slug: 'brand', titleKey: 'foundationBrand', published: false },
  { slug: 'architecture', titleKey: 'foundationArchitecture', published: false },
];

/** Topics that have MDX content and may be emitted as static pages. */
export const publishedFoundations = foundations.filter((entry) => entry.published);
export const foundationSlugs = publishedFoundations.map((entry) => entry.slug);

export function getFoundation(slug: string): FoundationEntry | undefined {
  return publishedFoundations.find((entry) => entry.slug === slug);
}

const collisions = foundationSlugs.filter((slug) => componentSlugs.includes(slug));
if (collisions.length > 0) {
  throw new Error(
    `Foundation slug collides with a component slug: ${collisions.join(', ')}. ` +
      'Foundations and components share the example registry namespace — rename the foundation.',
  );
}
