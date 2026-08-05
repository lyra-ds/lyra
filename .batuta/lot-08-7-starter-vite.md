# Lot 08-7a — starter-vite

## Goal

Create a complete, minimal Vite + React starter template at
`.batuta/starters/starter-vite/` (relative to the repo root). It will become
the standalone public repo `lyra-ds/starter-vite`: cloneable, `pnpm install &&
pnpm dev` works, and it demonstrates Lyra DS end to end — styles + react from
the PUBLIC npm versions, dark mode toggle, and white-label rebranding via the
4 brand tokens.

## Context (verified facts — do not invent beyond them)

- Public packages: `@lyra-ds/styles@0.4.0` and `@lyra-ds/react@0.4.0`
  (fixed versions, published). Use `^0.4.0` ranges.
- `@lyra-ds/react` peerDependencies: `react`, `react-dom` (>=18). Use React
  19.2.x in the starter.
- Stylesheet import (once, at the app entry): `import '@lyra-ds/styles';`
- Fonts are peers, self-hosted: add `@fontsource/plus-jakarta-sans` and
  `@fontsource/jetbrains-mono` as dependencies and import the weights the app
  uses at the entry (400/500/600/700 for Jakarta; 400 for JetBrains Mono).
- Theme: `import { ThemeProvider, useTheme } from '@lyra-ds/react'` —
  `ThemeProvider` applies `<html data-theme>` and persists the choice
  (default `"system"`); `useTheme()` returns `{ theme, resolvedTheme, setTheme }`
  (assume these member names; check the package README if unsure and say so).
- White-label: a brand redefines ONLY `--brand`, `--brand-contrast`,
  `--brand-radius`, `--brand-font` (on `:root` or a wrapping scope); everything
  else derives via `color-mix`.
- Components available include `Button` (variants: primary, secondary, soft,
  ghost, danger), `Card`, `Input`, `Switch`, `Badge`, `Stack`, `Container`,
  `Select`, `Tabs` — the demo should render a small but real composition
  (e.g. a settings-style card with inputs and buttons), not a component zoo.
- This template must NOT import anything from this monorepo's workspace — it
  stands alone. No `workspace:` protocol anywhere.

## Deliverables

```
.batuta/starters/starter-vite/
  package.json          # name "lyra-starter-vite", private, scripts dev/build/preview
  index.html
  vite.config.ts
  tsconfig.json
  src/main.tsx          # styles + fonts imports, ThemeProvider at root
  src/App.tsx           # the demo composition
  src/brand.css         # 2 alternative brand definitions as [data-brand="..."] scopes
  README.md             # English: what it shows, quickstart, links
  .gitignore
```

- The demo includes: a theme toggle (light/dark/system) using `useTheme`, and
  a brand switcher that flips a `data-brand` attribute to show white-label
  rebranding live (default Lyra brand + 2 alternates defined in brand.css,
  each setting only the 4 tokens).
- README links: https://lyra-ds.dev, https://github.com/lyra-ds/lyra,
  npm package pages. Quickstart: clone, `pnpm install` (npm/yarn work too),
  `pnpm dev`.
- Keep it SMALL: no router, no state library, no lint setup, no tests. TypeScript.
- Vite: latest 7.x, `@vitejs/plugin-react`. Exact modern versions you are
  confident exist; if unsure of a minor, use a caret range.

## Conventions

- Code and comments in English. Prose style of README mirrors the main repo's
  README (direct, technical, no hype).
- All visual styling comes from Lyra classes/components — the starter adds no
  custom CSS beyond `brand.css` (the 4 tokens per brand) and at most a tiny
  `layout` rule in index.html/App if unavoidable; prefer Lyra `Stack`/
  `Container` for layout.

## Acceptance criteria

- [ ] `pnpm install && pnpm build` succeeds inside the starter dir (the
      maestro runs this — your sandbox cannot; do not claim it).
- [ ] `src/main.tsx` imports `@lyra-ds/styles`, the two fonts, and wraps App
      in `ThemeProvider`.
- [ ] Theme toggle and brand switcher work with no custom theming logic
      beyond `useTheme` + a `data-brand` attribute.
- [ ] `brand.css` contains ONLY brand-token definitions (4 tokens per brand).
- [ ] No `workspace:`, no relative import into the monorepo, no CDN URLs.
- [ ] README quickstart is copy-pasteable.

## Boundaries

Write ONLY inside `.batuta/starters/starter-vite/`. Do not touch anything
else in the repo. Do not commit. Do not run pnpm install (sandbox has no
network) — write the files and report.

## Expected evidence

File tree you created; full content of package.json, main.tsx, App.tsx,
brand.css; any API you were unsure about, declared as such.

## Stop conditions

Stop and report if the brief's API facts contradict what you find in
`node_modules/@lyra-ds/*` (do NOT read the monorepo's `packages/` source —
the starter targets the published API; the installed `node_modules` copy in
this repo root is 0.4.0 and is a fair reference), or if you need any file
outside the boundary.
