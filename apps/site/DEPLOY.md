# Cloudflare Pages deployment

- **Build command:** `pnpm --filter @lyra-ds/site... run build`
- **Output directory:** `apps/site/out`
- **Node version:** `24` (the repository requires `>=24 <25`)
- **Environment variables:** none.

The trailing `...` includes the site's workspace dependencies, so it builds
`@lyra-ds/react` before the site consumes its generated distribution. This command was
verified in a fresh working copy with no prior `.next`, `out`, or workspace build output.
In this sandbox only, pnpm needed `--config.verify-deps-before-run=ignore` after the locked
dependency tree was materialized, because its global store is read-only. Cloudflare Pages
installs dependencies normally and uses the command above unchanged.

If analytics is introduced, extend the Content-Security-Policy with the self-hosted
OpenPanel origin first. Adding its script without extending the policy fails closed.

Lyra UI needs `data:` in `img-src`: its own component CSS embeds a few SVG masks and
background images as data URIs. This does not permit an external image origin.
