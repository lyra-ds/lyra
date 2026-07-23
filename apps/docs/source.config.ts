import { defineConfig, defineDocs } from 'fumadocs-mdx/config';

export const docs = defineDocs({
  dir: 'content/docs',
});

export default defineConfig({
  mdxOptions: {
    // Dual Shiki themes emitted as CSS variables (--shiki-light / --shiki-dark);
    // site.css picks the set based on [data-theme], which itself follows the
    // device's prefers-color-scheme until the user toggles it.
    rehypeCodeOptions: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
    },
  },
});
