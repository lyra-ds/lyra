# `apps/site` — deployment notes

The step-by-step for creating the Cloudflare Pages project, its environment variables and its
domain lives in [`DEPLOY.md`](../../DEPLOY.md) at the repository root, because both properties
share almost all of it. This file holds only what is specific to this app.

- **Build command:** `pnpm --filter @lyra-ds/site... run build`
- **Output directory:** `apps/site/out`

Verified from a clean state, with no prior `.next`, `out`, or workspace build output.

## `_headers` is generated, not committed

`public/_headers` is produced by `scripts/generate-headers.mjs` during `prebuild`, from
`scripts/_headers.template` plus the environment. The template is committed; the output is not.

The reason is that Cloudflare serves `_headers` directly — Next never processes it, so it
cannot interpolate an environment variable. Hardcoding the analytics origin there would create
a second source of truth for something that already lives in the environment, and the two would
drift the first time one changed.

With no `NEXT_PUBLIC_OPENPANEL_URL`, the generated file is byte-identical to the template. With
one, that exact origin is added to `script-src` and `connect-src`, and to nothing else.

## Why the policy looks the way it does

**`img-src` allows `data:`.** Lyra's own component CSS embeds a few SVG masks and background
images as data URIs. Without this, chevrons and select arrows silently disappear — the icons
are simply not painted, with no error a build would catch. It permits no external image origin.

**`script-src` allows `'unsafe-inline'`.** Next's hydration bootstrap is an inline script and a
static export cannot carry a nonce. It permits no external script origin.

**`style-src` does not need `'unsafe-inline'` here.** This app has no inline styles. The docs
app does, for legitimate reasons — see its own notes.
