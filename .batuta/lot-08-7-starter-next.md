# Lot 08-7b — starter-next

## Goal

Create a complete, minimal Next.js starter template at
`.batuta/starters/starter-next/` (repo root relative). It will become the
standalone public repo `lyra-ds/starter-next`. Same demonstration as the
sibling starter: Lyra styles + react from public npm, theme toggle, white-label
via the 4 brand tokens.

## Context

Identical to `.batuta/lot-08-7-starter-vite.md` — READ ITS "Context" SECTION
IN FULL AND HONOR IT (public 0.4.0 packages, fonts, ThemeProvider/useTheme,
4 brand tokens, no workspace imports). Additionally, the sibling starter is
now DELIVERED at `.batuta/starters/starter-vite/` — read `src/App.tsx`,
`src/brand.css` and `README.md` there and REUSE the same demo composition,
brand definitions (lyra default + atlas + moss) and README structure, adapted
to Next. The two starters must feel like siblings, not strangers.

Next-specific facts:

- Next.js 16.x, App Router, TypeScript, no Turbopack config needed, no
  ESLint setup, `next.config.ts` minimal or absent.
- `@lyra-ds/react` components ship `'use client'` in dist — they work as
  client components. `ThemeProvider` touches `document`/`localStorage`, so
  the pieces using it must be client components; the root layout stays a
  server component that imports `@lyra-ds/styles` and the `@fontsource/*`
  CSS files directly (global CSS imports belong in `app/layout.tsx`).
- To avoid a theme flash, `ThemeProvider` applies `data-theme` on `<html>` at
  runtime; `suppressHydrationWarning` on `<html>` is the standard companion.
- Scripts: `dev`, `build`, `start`.
- Include `pnpm-workspace.yaml` with:
  ```yaml
  allowBuilds:
    esbuild: true
  ```
  only if any dependency needs a build script — for Next this is typically
  unnecessary; skip it unless you know it is needed. (The vite sibling needed
  it for esbuild.)
- `.gitignore`: node_modules, .next, out.
- Include the same inline-SVG favicon approach as the sibling's index.html —
  in Next, an `app/icon.svg` file is the idiomatic equivalent.

## Deliverables

```
.batuta/starters/starter-next/
  package.json          # name "lyra-starter-next", private, scripts dev/build/start
  next.config.ts        # only if needed
  tsconfig.json
  app/layout.tsx        # styles + fonts imports, metadata, ThemeProvider wrapper
  app/page.tsx
  app/icon.svg
  components/...        # client components for the demo (mirror sibling App.tsx)
  app/brand.css OR styles/brand.css   # same 3 brands as sibling
  README.md
  .gitignore
```

## Conventions

Same as sibling lot: English everywhere, no custom CSS beyond brand.css,
layout via Lyra components.

## Acceptance criteria

- [ ] `pnpm install && pnpm build` succeeds (maestro runs it — do not claim).
- [ ] Root layout imports `@lyra-ds/styles` + fonts; `suppressHydrationWarning`
      on `<html>`.
- [ ] Theme toggle + brand switcher behave exactly like the sibling.
- [ ] brand.css contains only the 4-token brand definitions.
- [ ] No `workspace:`, no monorepo-relative imports, no CDN URLs.
- [ ] README mirrors the sibling's structure, adapted to Next.

## Boundaries

Write ONLY inside `.batuta/starters/starter-next/`. Read-only access to
`.batuta/starters/starter-vite/` and `.batuta/lot-08-7-starter-vite.md`.
Do not commit; do not run installs.

## Expected evidence

File tree; full content of package.json, app/layout.tsx, app/page.tsx and the
client component(s); uncertainties declared.

## Stop conditions

Same as sibling lot.
