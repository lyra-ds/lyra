# Shared brief — @lyra-ds/alpine wave C (lots C1–C6 sit on top of this)

Read this file in full, then the lot file that named it. The lot defines the
component; this file defines everything the components share. You have no
access to any conversation — these two files are the whole contract.

<context>
pnpm monorepo (Node 24, TS 5.9.3 strict, prettier). Relevant workspaces:

- `packages/alpine` — the package you are working on. Version 0.1.1 plus
  five wave-B bindings merged on main: TWELVE shipped bindings (dropdown,
  dialog, drawer, tabs, accordion, tooltip, popover, code-block,
  cookie-banner, sidebar-group, segmented-control, workspace-switcher).
  ESM-only tsdown build, single `.` export (`src/index.ts`) of an Alpine
  plugin, Browser Mode vitest harness (tests match
  `src/**/*.browser.test.ts`), size-limit budget in `package.json`.
  `alpinejs` is a peer dependency (devDep available for tests).
- `packages/react` — the SOURCE OF TRUTH for behavior. Each Alpine
  component ports the EXACT state machine of its React counterpart: same
  modifier classes, same ARIA, same focus/keyboard handling. Read the
  component's `.tsx` and its `.browser.test.tsx` before writing code.
- `packages/styles` — the real CSS. Import `@lyra-ds/styles/styles.css`
  inside every browser test suite (never in `src/`). Class names come from
  there — never invent a `.lyra-*` class; copy the exact strings the React
  component emits.

Consumer model (decided): Blade/consumers render the full initial markup
server-side and attach behavior with `x-data="lyraX({...})"` plus NAMED
BINDINGS exposed by the component and consumed via `x-bind="trigger"`, etc.
The Alpine.data() object exposes one binding object per structural part; all
state/ARIA/class mutations flow through those bindings. Initial state is
seeded via the x-data argument. No portal — markup stays where the consumer
put it (the React Portal has no Alpine equivalent; the overlay lives where
the consumer renders it). React callbacks become custom events via
`this.$dispatch('lyra:...')` (bubbling, with a detail payload).
</context>

<conventions>
- Code, comments and JSDoc in English. Conventional commits are the repo
  style, but DO NOT COMMIT — the maestro integrates.
- Exact versions only; add NO new dependencies (dev or runtime).
- ESM-only package; `alpinejs` never bundled or imported at runtime in
  `src/` except as `import type`. Runtime code must not reference
  `window.Alpine`.
- Shared logic lives in `packages/alpine/src/internal/` as plain functions:
  `presence.ts`, `focus-trap.ts`, `scroll-lock.ts`, `flip-placement.ts`,
  `when-visible.ts`, `test-axe.ts`, `tooltip-placement.ts` already exist —
  REUSE them; do not fork variants. A lot may direct you to CREATE a new
  internal helper; follow its spec.
- Every controllable state must work with `x-modelable`: hold the state as
  a plain reactive property named exactly as the lot specifies, mutated
  only via plain assignment, and prove it in a test whose fixture uses
  `x-modelable` + `x-model` asserting BOTH directions (outer→component and
  component→outer).
- The size-limit budget in `packages/alpine/package.json` will be exceeded
  by new code: update the limit in the same change to a value with ≤0.25 kB
  of headroom over the measured size
  (`pnpm --filter @lyra-ds/alpine exec size-limit` prints it) — never a
  round generous number. If your sandbox cannot run pnpm at all (known
  recurring failure: `ERR_SQLITE_ERROR`), leave the budget untouched and
  say so — the maestro measures at integration.
- Register the component in `src/index.ts` inside the plugin function
  (`alpine.data('lyraX', ...)`), following the existing pattern.
</conventions>

<lessons_from_waves_1_and_B>
Hard-won across lots; each cost a failed round or a shipped bug when
ignored:

1. In x-bind object handlers, `$el` is the ELEMENT CARRYING THE BINDING,
   not the component root. Capture the root once in `init()`
   (`this.root = this.$el`) and do ALL structural queries from it.
2. `$watch` callbacks fire BEFORE the `x-show`/binding effects apply. Any
   focus() or measurement of a just-revealed element must go through
   `this.$nextTick(...)` AND the `whenVisible` helper
   (`internal/when-visible.ts`): Alpine defers the actual reveal to
   requestAnimationFrame, so even $nextTick can land before the element is
   visible — poll with whenVisible before focusing or measuring.
3. Every binding for an actionable element includes `type: 'button'`.
4. An `x-show` getter must NEVER be a multi-term expression like
   `open || closing`: the transient flap re-reveals the dismissed element.
   Hold a single derived reactive flag (`mounted`) mutated only at open and
   at presence-finalize, and read only it in `x-show`.
5. A `:class` binding that returns a STRING does not remove a
   server-rendered class that isn't in the returned string. Any class that
   the server may render and the component must be able to REMOVE
   (state/modifier classes) must use the OBJECT syntax:
   `':class'() { return { 'lyra-x--active': this.active } }`.
6. Test-construction rules: assertions after a synthetic `dispatchEvent`
   need a microtask flush plus `Alpine.nextTick`; focus re-entry rides
   `$nextTick` — assert it with `vi.waitFor`; never leave a previous
   fixture's fixed overlay open when clicking a later fixture; interactive
   elements in fixtures live INSIDE the overlay/panel they belong to; a
   synthetic event you intend to preventDefault MUST be created with
   `cancelable: true`; prevent-first listeners go on an ancestor, not the
   target. Placement/geometry fixtures must FORCE the scenario
   arithmetically, not probabilistically.
7. Existence assertions must assert real DOM state (elements, attributes,
   classList) — never locator truthiness.

Reference implementations, merged and green — copy their structure before
inventing your own: `src/dialog.ts` and `src/drawer.ts` (presence/`mounted`,
focus trap, scroll lock, opener restore), `src/dropdown.ts` (outside
mousedown, flip), `src/tabs.ts` (roving tabindex, `:class` object syntax),
`src/workspace-switcher.ts` (pendingFocus, listbox), with their test
suites.
</lessons_from_waves_1_and_B>

<test_laws>

1. Test the behavior, never a mock. These are real-browser tests against
   the real CSS.
2. A failing test means fix the code, not the test.
3. No test-only flags or branches in production code.
   Also: every suite imports `@lyra-ds/styles/styles.css` first; run axe
   (`internal/test-axe.ts`) on the component in its meaningful states.
   </test_laws>

<environment_limits>
Your sandbox CANNOT run Vitest Browser Mode (no localhost bind), and pnpm
itself has been failing there (`ERR_SQLITE_ERROR`). Do not fight it; do
not report results you could not produce. Instead:

- attempt `pnpm --filter @lyra-ds/alpine run typecheck` and
  `pnpm exec prettier --check packages/alpine` once; if pnpm is broken,
  fall back to direct `tsc`/`prettier` binaries from `node_modules` when
  available and report exactly what ran;
- write the browser tests so the maestro runs them; structure test files
  so a syntax/nesting error is impossible to miss (no `it()` inside
  `it()`).
  </environment_limits>

<default_follow_through_policy>
Proceed without asking on anything this contract or the repository answers.
Read the React source before deciding; when the React code and this brief
disagree on a detail, the React code wins for behavior and the lot file
wins for scope.
</default_follow_through_policy>

<stop_conditions>
Stop and report instead of improvising when: the repository's shape
contradicts this brief; the same command fails twice (except the known
pnpm sandbox failure, which has its fallback above); the work would
require touching paths outside the lot's Scope; or porting would require a
new dependency.
</stop_conditions>

Method: if superpowers skills are available in your environment, conduct
the work with them — `test-driven-development` for implementation,
`systematic-debugging` for bug investigation. Otherwise, work test-first
by the acceptance criteria.
