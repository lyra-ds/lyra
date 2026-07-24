import { highlight } from 'fumadocs-core/highlight';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ReactNode } from 'react';
import { Pre } from '@/components/pre';
import { lyraDark, lyraLight } from './shiki-theme';

const APP_ROOT = process.cwd();

/**
 * Read an example's own source file and highlight it with the MDX pipeline's themes.
 *
 * The example file is the single source of truth: the same module is rendered live and
 * printed in the code panel, so a preview can never drift from the code beside it. Runs
 * at build time only — every component page is prerendered by `generateStaticParams`.
 */
export async function highlightExampleSource(slug: string, id: string): Promise<ReactNode> {
  const source = await readFile(
    join(APP_ROOT, 'components', 'examples', slug, `${id}.tsx`),
    'utf8',
  );

  return highlight(source.trimEnd(), {
    lang: 'tsx',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Shiki's ThemeRegistration isn't resolvable here
    themes: { light: lyraLight as any, dark: lyraDark as any },
    defaultColor: false,
    // Mirrors source.config.ts so the panel shows the same language badge as a fence.
    transformers: [
      {
        name: 'lyra-lang-attr',
        pre(node) {
          node.properties['data-language'] = 'tsx';
        },
      },
    ],
    components: { pre: Pre },
  });
}
