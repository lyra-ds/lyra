# Shared brief — @lyra-ds/alpine wave 1 (tasks 2–8 sit on top of this)

Read this file in full, then the lot file that named it. The lot defines the
component; this file defines everything the components share. You have no
access to any conversation — these two files are the whole contract.

<context>
pnpm monorepo (Node 24, TS 5.9.3 strict, prettier). Relevant workspaces:

- `packages/alpine` — the package you are working on. Already scaffolded and
  green: ESM-only tsdown build, single `.` export (`src/index.ts`) of an Alpine
  plugin, Browser Mode vitest harness (`vitest.config.ts`, tests match
  `src/**/*.browser.test.ts`), size-limit budget in `package.json`.
  `alpinejs` is a peer dependency (devDep 3.15.12 available for tests).
- `packages/react` — the SOURCE OF TRUTH for behavior. Each Alpine component
  ports the EXACT state machine of its React counterpart: same modifier
  classes, same ARIA, same `inert`, same focus/scroll-lock/keyboard handling.
  Read the component's `.tsx` and its `.browser.test.tsx` before writing code.
- `packages/styles` — the real CSS. Import `@lyra-ds/styles/styles.css` inside
  every browser test suite (never in `src/`). Class names come from there —
  never invent a `.lyra-*` class; copy the exact strings the React component
  emits.

Consumer model (from the PRD, decided): Blade/consumers render the full
initial markup server-side and attach behavior with `x-data="lyraX({...})"`
plus NAMED BINDINGS exposed by the component and consumed via
`x-bind="trigger"`, `x-bind="menu"`, etc. The Alpine.data() object therefore
exposes one binding object per structural part, and all state/ARIA/class
mutations flow through those bindings (`:class`, `:aria-*`, `@keydown`, ...).
Initial state is seeded via the x-data argument (`defaultOpen`, `active`, ...).
</context>

<conventions>
- Code, comments and JSDoc in English. Conventional commits are the repo
  style, but DO NOT COMMIT — the maestro integrates.
- Exact versions only; add NO new dependencies (dev or runtime). Everything
  needed is already installed at the workspace root.
- ESM-only package; `alpinejs` is never bundled or imported at runtime in
  `src/` except as `import type`. Runtime code must not reference
  `window.Alpine`.
- Shared logic ported from `packages/react/src/internal/*` lives in
  `packages/alpine/src/internal/` as plain functions (no React hooks), one
  file per utility, reused by later components — port faithfully (same
  observable behavior), adapting only the React-specific surface.
- Every controllable state must work with `x-modelable` (first-class
  requirement: `x-model` and Livewire `wire:model`/entangle must work).
  `x-modelable` is Alpine's documented consumer-side directive: the consumer
  writes `x-modelable="open" x-model="outer"` on the component element. Your
  job is (a) hold that state as a plain reactive property named exactly as
  the lot specifies, mutated only via plain assignment (so Alpine's
  reactivity sees it), and (b) prove it in a test whose fixture uses
  `x-modelable` + `x-model` and asserts BOTH directions (outer→component and
  component→outer).
- The size-limit budget in `packages/alpine/package.json` will be exceeded by
  new code: update the limit in the same change, to a value with ≤0.25 kB of
  headroom over the measured size (`pnpm --filter @lyra-ds/alpine exec
  size-limit` prints it) — never a round generous number.
- Register the component in `src/index.ts` inside the plugin function
  (`alpine.data('lyraX', ...)`), extending the `LyraAlpine` structural type
  there only if the existing surface is insufficient.
</conventions>

<lessons_from_dropdown>
Hard-won in task 2 (lyraDropdown) — apply to every component; each cost a
failed round when ignored:

1. In x-bind object handlers, `$el` is the ELEMENT CARRYING THE BINDING, not
   the component root. Capture the root once in `init()` (`this.root = this.$el`
   on the x-data element) and do ALL structural queries
   (menu/panel/items lookup) from that captured root.
2. `$watch` callbacks fire BEFORE the `x-show`/binding effects apply. Any
   focus() or measurement of a just-revealed element must go inside
   `this.$nextTick(...)`; document-level listeners, by contrast, attach
   synchronously in the watch.
3. Every binding for an actionable element includes `type: 'button'` (React
   parity + prevents accidental form submits).
4. Placement-flip test fixtures must FORCE the scenario: compute available
   space vs the popup's real rendered height in chromium and position the
   trigger so the flip is guaranteed, not probable. Check the arithmetic.

5. (from task 3, lyraDialog) An `x-show` getter must NEVER be a multi-term
   expression like `open || closing`: on close, `open` flips one scheduler
   tick before the watcher sets `closing`, and that transient false→true
   flap arms Alpine's requestAnimationFrame-deferred show, which lands
   AFTER the final microtask-deferred hide and re-reveals the dismissed
   element. Hold a single derived reactive flag (`mounted`) mutated only
   at open and at presence-finalize, and read only it in `x-show`.
6. (from task 3) Test-construction rules for overlay suites: assertions
   after a synthetic `dispatchEvent` need a microtask flush (Alpine
   watchers are deferred); focus re-entry rides `$nextTick` — assert it
   with `vi.waitFor`; never leave a previous fixture's fixed overlay open
   when clicking a later fixture (it intercepts the pointer); in
   fixtures, interactive elements must live INSIDE the overlay/panel they
   belong to or the fixed overlay covers them. (From task 5:) a synthetic
   event you intend to preventDefault MUST be created with
   `cancelable: true` — otherwise preventDefault() is a silent no-op and
   `defaultPrevented` stays false; and a capture listener on the TARGET
   element does not precede the component's earlier-registered handler
   (at-target ordering is registration order) — put prevent-first
   listeners on an ancestor.

Reference implementations: `packages/alpine/src/dropdown.ts` (bindings,
init/destroy shape) and `packages/alpine/src/dialog.ts` (presence/`mounted`,
focus trap, scroll lock) with their test suites are merged and green — copy
their structure before inventing your own.
</lessons_from_dropdown>

<test_laws>
1. Test the behavior, never a mock. These are real-browser tests against the
   real CSS.
2. A failing test means fix the code, not the test.
3. No test-only flags or branches in production code.
Also: every suite imports `@lyra-ds/styles/styles.css` first; run axe
(`axe-core` is a root devDep — port `packages/react/src/internal/test-axe.ts`
into `packages/alpine/src/internal/test-axe.ts` on first need) on the
component open AND closed; existence assertions must assert real DOM state
(`document.querySelector(...)` results may be legitimately null — assert on
elements, attributes and classList, not on locator truthiness).
</test_laws>

<environment_limits>
Your sandbox CANNOT run Vitest Browser Mode (no localhost bind). Do not try;
do not report test results you could not produce. Instead:
- run `pnpm --filter @lyra-ds/alpine run typecheck` and
  `pnpm exec prettier --check packages/alpine` and report their real output;
- write the browser tests so the maestro runs them; structure test files so a
  syntax/nesting error is impossible to miss (no `it()` inside `it()`).
</environment_limits>

<default_follow_through_policy>
Proceed without asking on anything this contract or the repository answers.
Read the React source before deciding; when the React code and this brief
disagree on a detail, the React code wins for behavior and the lot file wins
for scope.
</default_follow_through_policy>

<stop_conditions>
Stop and report instead of improvising when: the repository's shape
contradicts this brief; the same command fails twice; the work would require
touching paths outside the lot's Scope; or porting would require a new
dependency.
</stop_conditions>

Method: if superpowers skills are available in your environment, conduct
the work with them — `test-driven-development` for implementation,
`systematic-debugging` for bug investigation. Otherwise, work test-first
by the acceptance criteria.
