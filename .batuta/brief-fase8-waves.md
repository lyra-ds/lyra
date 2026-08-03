# Brief compartilhado — Fase 8, ondas de componentes (React wrappers)

Applies to every `lot-09-*` that sits on top of it. The CSS for ALL of these
components already shipped in `packages/styles` (09-0) — these lots add the
React wrappers only. Never write new CSS; if a class seems missing, that is a
stop condition.

## The recipe is in the repo

- `packages/react/CONVENTIONS.md` — the conversion checklist. Follow it
  literally; the existing components are the template (copy the nearest shape).
- Handoff contracts: `handoff/components/<group>/<Name>.d.ts` (+ `.jsx` as
  reference implementation, `.prompt.md` for intent). The `.d.ts` is the public
  API — reproduce it faithfully (JSDoc in English).
- Wiring a new component (all steps, every component):
  `src/<kebab>/` (component.tsx + index.ts + `*.browser.test.tsx` +
  `*.ssr.test.ts`), barrel `src/index.ts`, entry in
  `packages/react/tsdown.config.ts`, exports-map subpath in
  `packages/react/package.json` (same shape as neighbors), and a size-limit
  entry with a sane budget (measure, round up modestly).

## Laws (each has bitten before)

- i18n: NO hardcoded user-visible strings — pt-BR text in handoff JSX becomes
  a translatable prop with an English default, JSDoc'd (established convention;
  see FileManager/DataTable-style `labels` props in existing code).
- Tests: behavior, never the mock; failing test → fix the code; no test-only
  branches. Existence assertions use
  `await expect.element(screen.getByRole(...)).toBeInTheDocument()` — a bare
  locator is never null and asserts nothing.
- Block components: test the REAL composed shape, not a lone render.
- Every component renders in light AND `[data-theme="dark"]` with `axe.run()`
  clean (copy the pattern from any existing browser test).
- No `style={{}}` for appearance; className merge via the existing `cx` util.
- One changeset per lot: `minor` on `@lyra-ds/react` naming the components.

## Gates you can run offline (from repo root)

`pnpm --filter @lyra-ds/react run build` · `pnpm run typecheck` ·
`pnpm run lint` · `pnpm --filter @lyra-ds/react run lint` ·
`node tools/docgen/generate.mjs` (regenerate — component count will grow) ·
`pnpm --filter @lyra-ds/react exec size-limit`.
You canNOT run vitest browser tests, publint, attw, pack-smoke, smoke —
write the tests carefully; the maestro runs them.

## Boundaries (every lot)

Never touch: `handoff/`, `packages/styles/`, `apps/`, `tools/**` source
(docgen OUTPUT via generator is fine), `pnpm-lock.yaml`,
`src/icon/icon-registry.ts`. Do not commit.

## Report contract

Files touched; each gate run with actual output tail; uncertainty declared.
