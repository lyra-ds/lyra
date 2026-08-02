# Cloudflare Pages deployment

- **Build command:** `pnpm --filter @lyra-ds/docs... run build`
- **Output directory:** `apps/docs/out`
- **Node version:** `24` (the repository requires `>=24 <25`)
- **Environment variables:** none.

The trailing `...` includes the docs workspace dependencies, so it builds
`@lyra-ds/react` before the docs consume its generated distribution. This command was
verified from a clean state with no prior `.next`, `out`, or workspace build output.

This property must not go live before `lyra-ds.dev`: the docs consent banner links to the
privacy policy hosted there.

If analytics is introduced, extend the Content-Security-Policy with its self-hosted origin
first. Adding the script without extending the policy fails closed.

Lyra UI needs `data:` in `img-src`: its own component CSS embeds a few SVG masks and
background images as data URIs. This does not permit an external image origin.

Unlike `apps/site`, this app needs `'unsafe-inline'` in `style-src` for legitimate inline
custom property values and dynamic preview sizing: the prose wrapper supplies its scroll
offset, while isolated example iframes receive measured height and scale values. These values
cannot be static classes. Keep this exception so CSP does not blank the prose offset or preview
frames; it does not add an external origin.
