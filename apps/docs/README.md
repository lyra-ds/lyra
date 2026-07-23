# Lyra documentation site

`apps/docs` is a static Next.js export intended for Cloudflare Pages. It deliberately uses
`fumadocs-core` and `fumadocs-mdx` only: its UI is dogfooded from `@lyra-ds/styles` and
`@lyra-ds/react`, with no Tailwind or `fumadocs-ui`.

## Cloudflare Pages

- Framework preset: **None** (static)
- Build command: `pnpm --filter @lyra-ds/docs build`
- Output directory: `apps/docs/out`
- Node version: **24**

Connecting a Cloudflare Pages project is a manual infrastructure step and is intentionally not
part of this repository. If a future feature requires a server runtime and cannot be expressed as
a static build, use OpenNext/Workers instead of weakening this app's static-export guarantee.
