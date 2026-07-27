import { rehypeCodeDefaultOptions } from 'fumadocs-core/mdx-plugins';
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { lyraDark, lyraLight } from './lib/shiki-theme';

export const docs = defineDocs({
  dir: 'content/docs',
});

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Shiki's ThemeRegistration isn't resolvable from here
      themes: { light: lyraLight as any, dark: lyraDark as any },
      defaultColor: false,
      // keep fumadocs' defaults, then stamp the fenced language onto the <pre>
      // so the Pre component can show a language badge.
      transformers: [
        ...(rehypeCodeDefaultOptions.transformers ?? []),
        {
          name: 'lyra-lang-attr',
          pre(node) {
            const lang = this.options.lang;
            if (lang && lang !== 'text' && lang !== 'plaintext') {
              node.properties['data-language'] = lang;
            }
          },
        },
      ],
    },
  },
});
