# Shared brief — 6c-b2, the chrome layer (Lyra Design System)

This file is the shared half of every 6c-b2 lot brief. Each lot has its own file
(`.batuta/lot-6cb2-NN-*.md`) carrying that lot's Goal, acceptance criteria and
boundaries. **Read this file in full, then your lot file, before writing anything.**

You have no access to the conversation that produced this. Everything you need is here
or reachable from the paths named here.

## What the project is

Lyra DS is an open-source, **CSS-first**, white-label design system for SaaS products,
published from a pnpm monorepo. The architecture constraint that governs every decision:

> **Appearance lives 100% in `.lyra-*` CSS classes shipped by `@lyra-ds/styles`. The React
> package is a thin wrapper that composes class names. There is no CSS-in-JS, no Tailwind,
> no CSS module, and no inline style for anything a class could express.**

This is what lets the same CSS serve Vue, Blade and LiveView later. A component whose
appearance lives in the React package is a bug, not a shortcut.

Read `.claude/CLAUDE.md` for the locked constraints (stack, animation rule, no runtime CDN,
font peers). Read `packages/react/CONVENTIONS.md` for the conversion conventions.

## What 6c-b2 is

Eight additions that form the **chrome layer** — the shell of a site or app: `Shell`,
`Navbar` + `NavLink`, `Footer`, `TableOfContents`, `CodeBlock`, `SegmentedControl`,
`CommandPalette.Trigger`, and the CSS-only `.lyra-prose`, plus a small `Brand`.

Unlike every previous batch, **these eight have no handoff prototype**. They are our own
design, extracted from CSS already validated in production in `apps/docs`. The APIs were
decided before delegation and are stated verbatim in each lot file — implement the API as
specified. If the specified API contradicts what the code makes possible, stop and report;
do not silently redesign it.

## Where things live

- `packages/styles` — the CSS core. **No build step.** `styles.css` is the entry and
  `@import`s `tokens/*` and `components/<category>/<category>.css`.
- `packages/react` — thin wrappers. One directory per component under `src/<component>/`,
  each with `index.ts`, `<component>.tsx`, `<component>.browser.test.tsx` (chromium) and
  `<component>.ssr.test.ts`. `src/index.ts` is the barrel.
- `apps/docs` — the Next.js 16 docs site, which **dogfoods** the DS.
- `handoff/` — the design source. Treat as read-only **except** for the one documented
  case in "The docgen category contract" below.
- `tools/` — the CI gates (parity, docgen, icon-registry, pack-smoke, smoke, dist-scan).

The closest structural analog to copy for a new React wrapper is
`packages/react/src/container/` (from the layout lot): `forwardRef`, `cx` from
`../internal/cx`, a `CSSProperties &` intersection type for custom properties, JSDoc on
the interface and on each prop, and a matching two-line `index.ts`.

## Registering a new component — the five places

Adding a component means touching all of these. Missing one makes a CI job red:

1. `packages/react/src/<name>/` — implementation, `index.ts`, both test files.
2. `packages/react/src/index.ts` — barrel export of the component **and** its Props type.
3. `packages/react/tsup.config.ts` — an entry `"<name>": "src/<name>/index.ts"`.
4. `packages/react/package.json` — an `exports` subpath `./<name>` with the four
   dual-format paths, mirroring `./container` exactly; and a `size-limit` budget entry
   mirroring the existing ones.
5. `packages/styles/components/chrome/chrome.css` — the classes, plus the `@import` in
   `packages/styles/styles.css`.

The invariant the gates enforce: **exports map == tsup entries == dist basenames.**

## The docgen category contract

`tools/docgen/generate.mjs` derives each component's category from the directory of its
declaration file under `handoff/components/<category>/<Name>.d.ts`. A component with no
such file fails the gate with "no handoff category for <Name>".

For our own components this is the documented path, with precedent: commit `2903676`
added `handoff/components/system/ThemeProvider.d.ts` for a component we designed.

So, for this batch:

- **Create `handoff/components/chrome/<Name>.d.ts`** for each new component — the public
  type contract, matching the shipped types.
- Add `'Chrome'` to `CATEGORY_ORDER` in `tools/docgen/generate.mjs` (alphabetical position,
  between `Buttons` and `Data`).
- Bump `EXPECTED_COMPONENTS` in the same file by the number of components your lot adds.
  The comment above the constant explains its purpose — update the comment too, do not
  just change the number.
- **Do NOT create a `chrome.css` under `handoff/`.** The CSS is ours; writing both sides of
  the parity comparison would neuter the tripwire it exists to be. See the next section.

Nothing else under `handoff/` may be created, edited or deleted.

## The parity gate

`pnpm parity` compares `packages/styles` against `handoff/` and against the committed
snapshot `tools/parity/baseline.json` (token names with declaration counts, class names,
and the entry `@import` order). It exists to catch silent drift, and it is a required CI
check.

`chrome.css` is a wholly new file with **no handoff counterpart**, which is a case the gate
has not seen before. The requirement is an outcome, not a recipe:

- `pnpm parity` passes.
- The new `.lyra-*` classes are recorded as **ours** — additive, explicitly enumerated —
  and never as handoff-verbatim. `ADDITIVE_EXTENSIONS` in `tools/parity/parity.mjs` is
  where the existing precedent for such enumeration lives (see the `layout.css` entry for
  `lyra-stack`/`lyra-grid` and its comment).
- The tripwire still bites: an un-enumerated stray class must still fail the gate. Prove
  this — add a throwaway `.lyra-zzz { color: red }` to `chrome.css`, run `pnpm parity`,
  confirm it FAILS, then remove it. Report both outputs.
- **Do not regenerate `tools/parity/baseline.json` unless `handoff/` actually changed.**
  Your lot adds package-only classes registered as additive; the baseline counts the
  **handoff** side, so it should not move at all. If `pnpm parity` passes without
  regenerating, you are done — regenerating anyway is destructive, because
  `pnpm parity --update-baseline` **overwrites `$comment` and `handoffVersion` with
  defaults**, erasing the hand-maintained record of which handoff groups have landed
  (currently `"v1.0 + v1.1 layout"`). This has already bitten twice.

  If a regeneration is genuinely required, restore those two fields by hand afterwards and
  report the full baseline diff so the maestro can review what changed.

## The stylelint trap in `packages/styles`

CSS in `packages/styles` is handoff-verbatim by convention: no prettier, and stylelint only
validates the `.lyra-*` namespace. Restyling an existing class at the end of a file is
`no-duplicate-selectors` by construction — the parity convention and the rule contradict
each other. The existing resolution is a `stylelint-disable no-duplicate-selectors` comment
opening the additive region of a file, keeping the rule on for the verbatim region above.
`chrome.css` is entirely ours, so judge which region rules it needs and say what you chose.

## Conventions — non-negotiable

- **Styling is `.lyra-*` classes only.** Never a CSS module, never inline `style` for
  appearance. The one sanctioned use of `style` is setting a **custom property** as a
  typed `CSSProperties &` intersection, exactly as `Container` does with `--container-max`.
- **Defaults live in the CSS, never duplicated in JS.** A prop left `undefined` must emit
  no custom property at all and let the stylesheet's default apply. Hardcoding the same
  default in both places was a real defect fixed during the layout lot: two sources of
  truth that drift. Optional props are `undefined`-safe by construction.
- **Every visible string is a translatable prop**, never a literal baked into the
  component. Labels for buttons, headings and status text are props. There are no English
  strings shipped inside the rendered output.
- **Accessible names are required**, not optional. Landmarks get a label, icon-only
  controls get an accessible name, state is exposed with the correct ARIA attribute.
- **Icons:** `lucide-react` is the only runtime dependency, reached through the generated
  `src/icon/icon-registry.ts`. **But importing `Icon` for a piece of chrome decoration is a
  size regression** — it pulls the whole registry and once cost 5.4 kB for a single
  chevron. The DS pattern for a chrome glyph is an **inline SVG** (see the Drawer's close
  button and the Stepper's check). Follow that pattern.
- **`'use client'`** is prepended deterministically by tsup's `onSuccess`. Do not write the
  directive by hand in source files.
- **Zero CSS imports** in shipped React code. The consumer imports the stylesheet.
- **JSDoc in English** on the interface and on every prop. TSDoc `{@link}` where it helps.
- Exact versions everywhere; never edit `pnpm-lock.yaml` by hand.
- Conventional commits. **Do not commit** — leave the tree dirty; the maestro commits.
- A changeset is required (`.changeset/<name>.md`, minor for both `@lyra-ds/styles` and
  `@lyra-ds/react`), written in the user-facing voice: what a consumer gains.

### A prop that isn't in the interface doesn't exist

The docgen reads the **interface**, not the destructure. A prop inherited from
`HTMLAttributes` that your component treats specially (e.g. `aria-label`) never appears in
the generated props table unless you **redeclare it in the interface with JSDoc**. Two
components shipped honoring `aria-label` that nobody could discover, for exactly this
reason. Redeclare what you handle specially.

## Tests

Tests come after the implementation (this project is tests-after), with Vitest. Two files
per component:

- `<name>.browser.test.tsx` — Browser Mode, chromium, real CSS. This is where behavior,
  keyboard interaction, ARIA and theming are proven.
- `<name>.ssr.test.ts` — renders to string, proving the component survives SSR.

Three laws:

1. **Test the behavior, never the mock.**
2. **A failing test means fix the code, not the test.**
3. **No test-only flags or branches in production code.**

Two failure modes this project has already paid for — briefs must pin them:

- **Existence assertions need `expect.element`.** `screen.getByRole(...)` in Vitest Browser
  Mode returns a lazy Locator, which is always a truthy object:
  `expect(screen.getByRole('x')).not.toBeNull()` passes whether the element exists or not.
  Twelve vacuous tests shipped this way. The correct form is
  `await expect.element(screen.getByRole('x')).toBeInTheDocument()`.
- **Never nest `it()` inside another `it()`.** Vitest rejects it at runtime — "Calling the
  test function inside another test function is not allowed" — and it is invisible to
  typecheck, eslint and prettier. Eight tests were reported as passing this way.

`jsx-a11y/anchor-is-valid` is disabled only in `src/**/*.test.tsx`, because in a Browser
Mode fixture a valid `href` navigates the runner's iframe and aborts the whole suite.

## Method

If you have a test-first or plan-first workflow available on your side, use it. Otherwise
work directly from the acceptance criteria in your lot file, implementing first and then
covering each criterion with a test, per this project's tests-after methodology.

## The gates — run these, and report their real output

The authoritative gate is `.github/workflows/ci.yml`, not a summary. Read that file. The
four jobs, expanded:

```bash
# lint
pnpm run lint && pnpm --filter @lyra-ds/styles run lint:css \
  && pnpm --filter @lyra-ds/react run lint
# typecheck
pnpm --filter @lyra-ds/react run build && pnpm run typecheck
# test
pnpm run test && pnpm run parity && node tools/icon-registry/generate.mjs --check
# build
pnpm run build && node tools/docgen/generate.mjs --check \
  && pnpm exec publint packages/styles && node tools/pack-smoke/pack-smoke.mjs \
  && pnpm exec publint packages/react \
  && pnpm --filter @lyra-ds/react exec attw --pack . --profile node16 \
  && pnpm --filter @lyra-ds/react exec size-limit \
  && node tools/dist-scan/assert-use-client.mjs packages/react/dist \
  && node tools/dist-scan/no-cdn-scan.mjs packages/react/dist \
  && node tools/smoke/smoke.mjs
```

**Some of these cannot run in your sandbox.** `pnpm run test` needs Browser Mode, which
needs to bind localhost; `pack-smoke`, `smoke` and `publint` also tend not to survive. That
is expected and it is not a failure. What IS a failure is reporting them as passing.

**Run what you can. For anything you could not run, say so explicitly and name the reason.**
The maestro re-runs everything independently; an honest "could not run the browser tests"
costs nothing, while a false green costs a whole round.

## Expected evidence — what to report back

1. Every file created, modified or deleted, by path.
2. Every command you ran, with its **actual output** — not a summary, not a claim.
3. Every command you could not run, and why.
4. Each acceptance criterion from your lot file, answered one by one.
5. Anything you were uncertain about, declared as uncertainty rather than smoothed over.
6. Any place where the specified API turned out to be wrong or impossible, and what you
   did about it.

## Stop conditions — report instead of improvising

- The code's actual shape contradicts this brief or your lot file.
- The same command fails twice for the same reason.
- The fix would require editing something listed under Boundaries in your lot file.
- The specified API cannot be implemented as written.

In all four cases: stop, and report what you found and what you would need. A partial,
honest delivery is worth more than a complete one built on a wrong assumption.

## Global boundaries — do not touch

`node_modules/`, `dist/`, `apps/docs/.next/`, `apps/docs/out/`, `pnpm-lock.yaml`,
`__screenshots__/`, `.vitest-attachments/`, `.planning/` (historical archive), and all of
`handoff/` except the `handoff/components/chrome/*.d.ts` files your lot creates.

**Generated-but-committed files: regenerate, never hand-edit.**
`tools/docgen/output/llms.txt`, `tools/docgen/output/props.json` and
`packages/react/src/icon/icon-registry.ts` are build artifacts that live in git. Adding a
component makes them stale and `node tools/docgen/generate.mjs --check` will fail.

That is **not** a boundary violation to stop on — the fix is to run the generator
(`pnpm run docgen`, and `node tools/icon-registry/generate.mjs` if icons changed) and leave
its output in the tree. Editing those files by hand is what is forbidden. Report what the
regeneration changed; it should be only your lot's components.

Do not commit. Do not create branches. Do not push.
