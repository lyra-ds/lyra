# Lot C6 — `theme` store

Sits on top of `.batuta/brief-alpine-wave-c.md`. Read both in full before
writing anything. Work from the repo root; do not commit.

<task>
Port the ThemeProvider state machine from
`packages/react/src/theme-provider/theme-provider.tsx`
(tests: `packages/react/src/theme-provider/theme-provider.browser.test.tsx`)
as an ALPINE STORE — the one wave-C deliverable that is NOT an
`Alpine.data()`: register `alpine.store('theme', …)` inside the plugin
function in `src/index.ts`, with the factory living in
`packages/alpine/src/theme.ts`.

Behavior contract (verified against the React source — read it anyway; the
source wins on any detail this list compresses):

- Store API (consumer reads `$store.theme.…`): `theme`
  (`'light' | 'dark' | 'system'` — the chosen value), `resolvedTheme`
  (`'light' | 'dark'`), `dark` (boolean convenience), `setTheme(next)`,
  `toggle()`. `resolvedTheme`/`dark` may be Alpine getters over reactive
  state — they must be reactive in `x-bind`/`x-text` expressions.
- Constants, ported: storage key `'lyra-theme'`, dark query
  `'(prefers-color-scheme: dark)'`, default theme `'system'`. Fixed —
  the store is a singleton contract shared with blade's anti-flash
  script (same key, same dataset attribute); no per-instance options.
- `init()` (Alpine calls it at registration): read the stored choice
  (`readStored` port: only the three literal values count, try/catch →
  null), resolve against `matchMedia(DARK_QUERY).matches`, write
  `document.documentElement.dataset.theme = resolvedTheme`; attach a
  `change` listener on the media query (re-resolve while
  `theme === 'system'`) and a window `storage` listener (cross-tab
  sync: re-read the stored value and re-apply). Every re-resolution
  rewrites the dataset attribute.
- `setTheme(next)`: persist via `localStorage.setItem` in try/catch (a
  write error still applies the theme to this page view), update
  `theme`, re-resolve, rewrite the dataset.
- `toggle()`: `setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')` —
  flips FROM THE RESOLVED value (React parity: toggling away from
  `system` picks an explicit theme).
- SSR safety: the module must not touch browser globals at import time;
  everything lives in `init()`/methods.
- JSDoc on the factory: the store does NOT prevent the first-paint
  flash — that is blade's blocking inline `<head>` script, reading the
  SAME `lyra-theme` key and writing the SAME
  `document.documentElement.dataset.theme`; the store reads what the
  script applied and takes over. Include the script snippet from the
  React source's JSDoc verbatim as the documented contract.
- Type surface: extend the `LyraAlpine` structural type in
`src/index.ts` with the `store` registration method if it lacks one.
</task>

<scope>
May change ONLY:
- `packages/alpine/src/theme.ts` (new)
- `packages/alpine/src/theme.browser.test.ts` (new)
- `packages/alpine/src/index.ts` (registration + type surface if needed)
- `packages/alpine/package.json` (size-limit budget line only)
- `.changeset/alpine-theme-store.md` (new — one-paragraph minor
  changeset for `@lyra-ds/alpine`, mirroring the existing alpine
  changesets' style)
Do not change anything outside this list; if the task requires it, stop
and report.
</scope>

<acceptance_criteria>

1. `pnpm --filter @lyra-ds/alpine run typecheck` passes (or the direct
   `tsc` fallback; paste real output).
2. `pnpm exec prettier --check packages/alpine` passes (or direct
   fallback).
3. `src/theme.browser.test.ts` covers (clear the storage key and reset
   `document.documentElement.dataset.theme` around each test): fresh
   start resolves `system` against the real `matchMedia` and writes the
   dataset; a stored `'dark'`/`'light'` wins over system; `setTheme`
   persists, updates `theme`/`resolvedTheme`/`dark`, and rewrites the
   dataset; `toggle` flips from the RESOLVED theme (prove the
   system→explicit case); an invalid stored value falls back to
   `system`; cross-tab sync — dispatching a synthetic
   `StorageEvent('storage')` after mutating localStorage directly
   re-applies the new value; reactivity — an `x-text` bound to
   `$store.theme.resolvedTheme` updates after `setTheme` (fixture
   proof); OS-change while on `system` MAY be covered by stubbing
   `matchMedia` with a controllable fake installed BEFORE the store
   registers (boundary stub of the OS — allowed; the component itself
   is never mocked), or skipped with a comment if the stub cannot be
   made faithful.
4. `Alpine.plugin(lyra)` now registers the `theme` store alongside the
   data components; all existing suites pass unmodified.
5. size-limit budget updated per the shared brief's rule (or explicitly
   left for the maestro if pnpm is broken).
   </acceptance_criteria>

<compact_output_contract>
Report back, in order: files touched (paths only); commands run with
their REAL output; the measured size and new budget (or "left to
maestro"); any behavior detail where you diverged from the React source
and why; uncertainties declared as such. No test-result claims for
suites you cannot run.
</compact_output_contract>
