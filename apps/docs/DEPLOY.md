# `apps/docs` — deployment notes

The step-by-step for creating the Cloudflare Pages project, its environment variables and its
domain lives in [`DEPLOY.md`](../../DEPLOY.md) at the repository root, because both properties
share almost all of it. This file holds only what is specific to this app.

- **Build command:** `pnpm --filter @lyra-ds/docs... run build`
- **Output directory:** `apps/docs/out`

Verified from a clean state, with no prior `.next`, `out`, or workspace build output.

## Do not publish this before `lyra-ds.dev`

The consent banner links to the privacy policy, and that policy is hosted on the landing site —
one document covers both properties, so there is no second copy here to drift. Until
`lyra-ds.dev` is live, that link 404s.

## `_headers` is generated, not committed

Same mechanism as the landing: `scripts/generate-headers.mjs` runs during `prebuild` and writes
`public/_headers` from `scripts/_headers.template` plus the environment. The template is
committed; the output is not. See the site's notes for why the origin cannot be hardcoded there.

## Why the policy looks the way it does

Two directives differ from the landing's, and both were found by serving the export with the
policy actually applied. Neither shows up in a build, a lint, or a type check.

**`frame-src 'self'`, not `'none'`.** Component examples render inside iframes — the isolated
preview machinery in `components/example-view.tsx`. With `'none'`, every one of those frames
goes blank while the page around it looks perfectly fine.

**`style-src 'unsafe-inline'`.** This app has legitimate inline styles, and they are legitimate
because of the single case the project's conventions allow: passing a custom property value.
The prose wrapper supplies its own scroll offset, and isolated preview iframes receive a
measured height and scale from a `ResizeObserver`. Those are dynamic numbers; they cannot be
static classes. Removing this exception blanks the previews and breaks anchor scrolling.

**`img-src` allows `data:`** for the same reason as the landing: Lyra's component CSS embeds
SVG data URIs, and without it icons vanish silently.

Do not "harden" any of the three away without serving the build with the new policy and opening
a component page.
