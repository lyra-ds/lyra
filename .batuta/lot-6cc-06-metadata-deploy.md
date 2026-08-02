# Lot 6c-c/6 — metadata, discovery, and the deploy contract

Sits on top of `.batuta/brief-6cc-landing.md` — the honesty rules, the `.lw-*` cut criterion,
the conventions, the gates, the evidence contract and the boundaries in it apply unchanged.
Read it first, in full.

## Goal

Close the landing: make it describable to a crawler and a link preview, discoverable, and
deployable. Four deliverables plus a final sweep.

The canonical origin is **`https://lyra-ds.dev`**. The docs live at
**`https://docs.lyra-ds.dev`** and are not this app's concern.

## 1. Metadata

`apps/site/app/layout.tsx` sets only a title and a favicon today. It needs:

- `metadataBase: new URL('https://lyra-ds.dev')` — without it every relative URL in the
  metadata resolves against nothing and the OG tags ship broken paths.
- Per-locale `title` and `description`, from the message files like every other string.
- `alternates.canonical` per route, and `alternates.languages` mapping `en` and `pt-BR` to
  their URLs, plus `x-default` pointing at the English page. Two locales with no `hreflang`
  is how a search engine decides they are duplicates of each other.
- `openGraph`: type `website`, `siteName`, per-locale `title`/`description`/`url`/`locale`,
  and the image from item 2.
- `twitter`: `summary_large_image`, with the same title, description and image.

Per-locale metadata belongs in `app/[lang]/layout.tsx` via `generateMetadata`, which is where
the locale is known. The privacy route gets its own title and description too.

**The description is copy, so it is subject to the honesty rules.** Use, verbatim:

- EN: `An open source, CSS-first design system for SaaS products. Semantic tokens, white-label theming in four tokens, and thin React wrappers over a CSS core that works in any framework.`
- pt-BR: `Um design system open source e CSS-first para produtos SaaS. Tokens semânticos, white-label em quatro tokens e wrappers React finos sobre um núcleo CSS que funciona em qualquer framework.`

## 2. The Open Graph image

**There is no OG image in this repo** — do not go looking for one, and do not point the tags
at a file that does not exist. A link preview with a broken image is worse than one with none.

Build it with `ImageResponse` from `next/og`, in `apps/site/app/opengraph-image.tsx`. It ships
with Next, so no new dependency, and it is rendered at build time into the static export.

- 1200×630.
- Dark background using the same `--indigo-950` value the CTA band uses, the Lyra wordmark,
  the product name, and the tagline. Keep it typographic — no photo, no gradient mesh.
- The values must be literal in that file. `ImageResponse` does not resolve CSS custom
  properties; a `var(--indigo-950)` there renders as nothing. Copy the hex and say in a
  comment where it came from.

**If the static export refuses to emit it, stop and report** what it said. Do not fall back to
committing a hand-made binary without telling me — the fallback is a `sharp` devDependency and
a prebuild step, and that is a decision, not a detail.

Prove it: after the build, the file exists under `apps/site/out/`, is a PNG, and is 1200×630.
Report its path and size.

## 3. `robots.txt` and `sitemap.xml`

Use `app/robots.ts` and `app/sitemap.ts`. Both are emitted as static files during export.

- `robots.txt`: allow everything, and point at the sitemap's absolute URL.
- `sitemap.xml`: the four real routes — `/en`, `/pt-BR`, `/en/privacy`, `/pt-BR/privacy` —
  each with its `alternates.languages` entry so the two locales are declared as translations
  rather than duplicates.

Do not invent `lastModified` dates. Either omit the field or derive it from something real.

Prove both exist in `out/` and paste their contents.

## 4. The deploy contract

The user deploys this manually; your job is to make the settings unambiguous and to ship the
files the host needs.

Create `apps/site/DEPLOY.md` with the exact Cloudflare Pages settings:

- Build command. It must build the workspace dependencies too — `@lyra-ds/site` depends on
  `@lyra-ds/react`, which has a build step. Work out the correct `pnpm --filter` invocation
  and **verify it from a clean state**, not from your already-built tree.
- Output directory: `apps/site/out`.
- Node version, matching the repo's `engines`.
- Any environment variable the build needs (there should be none today — say so explicitly).

Add `apps/site/public/_headers` with a **Content-Security-Policy that allows only this
origin**: no external scripts, styles, fonts, images, frames or connections.

This is the point of it: the privacy policy shipped in lot 5 claims this site loads nothing
from anyone else. A CSP turns that claim from a sentence into a rule the browser enforces —
and if a future change breaks the claim, the page breaks loudly instead of leaking quietly.

Add the ordinary hardening alongside it: `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`, and a restrictive `Permissions-Policy`.

**Write in `DEPLOY.md` that analytics will require extending the CSP** with the self-hosted
OpenPanel origin, and that adding the script without extending the policy will fail closed.
Name no provider or URL in the CSP itself — neither exists yet.

## 5. The final sweep

The landing is now seven sections, a policy page, and chrome. Check the whole thing, not the
parts you touched:

- Every route in both locales at **375px wide**: no horizontal scrolling anywhere, and no
  interactive target under 44px. Report anything that fails with its measurement.
- **Message-file parity**: `en.json` and `pt-BR.json` hold exactly the same key set. A key
  present in one and missing from the other renders a raw key name to a real reader. Report
  the diff, which must be empty.
- Every internal link on every page resolves in the built export — walk them, do not read them.
- `axe.run` on all four routes, both themes.

## Acceptance criteria

1. Both locales carry title, description, canonical, `hreflang` (including `x-default`), OG
   and Twitter tags. Paste the rendered `<head>` of `/en` and `/pt-BR`.
2. The OG image exists in `out/`, is a PNG, and is 1200×630. Report path and dimensions.
3. `out/robots.txt` and `out/sitemap.xml` exist; paste both.
4. `DEPLOY.md` gives a build command **verified from a clean state**. Say how you verified it.
5. `_headers` ships a self-only CSP plus the three hardening headers.
6. No horizontal scroll and no target under 44px at 375px, on all four routes.
7. The two message files have identical key sets; show the comparison.
8. Every internal link resolves; list what you walked.
9. `axe.run` clean on all four routes in both themes.
10. The four CI jobs' commands run, with real output reported and anything unrunnable named.

## Boundaries

- **Do not touch `packages/`.**
- **Do not touch `apps/docs/`** — it has no metadata, robots or sitemap either, and that is a
  separate decision, not this lot's.
- Do not add analytics, name a provider, or add any third-party origin to the CSP.
- Do not change the seven sections, the privacy page, the consent banner or the chrome.
- Do not deploy anything.
- Do not commit, branch or push.
