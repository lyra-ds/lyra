# Lot G1 — `lyraAppSidebar`

Sits on top of `/home/franciscpd/Projects/lyra-ds/lyra/.batuta/brief-alpine-wave-b.md`
(shared brief: context, conventions, wave-1 lessons, test laws, environment
limits, stop conditions). Read BOTH in full before writing anything.

Two corrections to the shared brief's `<context>`, which was written earlier in
the wave: `packages/alpine` is now version **0.2.0** with **28 shipped
bindings** (not 7) plus a `theme` store. Everything else in it still holds.

Work from the repo root of the worktree you were started in; **do not commit**
— the maestro integrates.

<task>
Port the AppSidebar rail (collapsed) state machine from
`packages/react/src/app-sidebar/app-sidebar.tsx`
(tests: `packages/react/src/app-sidebar/app-sidebar.browser.test.tsx`).
Rail CSS: `packages/styles/components/navigation/navigation.css`
(`.lyra-appsidebar`, `.lyra-appsidebar--rail`, `.lyra-appsidebar__toggle`).

Read the React source before deciding anything; it wins on behavior detail.
The list below compresses it and records four PORTING DECISIONS that are
already closed — implement them as written, do not re-litigate them.

Options and state:

- `lyraAppSidebar({ defaultCollapsed = false, width = 260, labels = {} })`.
- `labels`: `{ collapse?: string; expand?: string }`, defaults
  `'Collapse sidebar'` / `'Expand sidebar'` (exactly the React strings).
- State: a single boolean `collapsed` — plain reactive property,
  `x-modelable`-ready. No other state.
- Dispatch a bubbling `lyra:collapse` with `detail: { collapsed }` on every
  change (this is the port of React's `onCollapsedChange`).

Named bindings:

- `root` — the `<nav class="lyra-appsidebar">`:
  - `:class` OBJECT syntax for `lyra-appsidebar--rail` (shared brief lesson 5:
    the server renders the modifier and the component must be able to REMOVE
    it on expand).
  - `:style` keeping `--appsidebar-width` at `collapsed ? '64px' : width +
'px'` and `width` at `var(--appsidebar-width)`, mirroring React's inline
    style. The CSS file sets no width, so this inline pair is what sizes the
    sidebar in both modes.
- `toggle` — the `<button class="lyra-appsidebar__toggle">`:
  - `type: 'button'`, `:aria-label` and `:title` both = the active label
    (`expand` label while collapsed, `collapse` label while expanded),
    `@click` flips `collapsed`.

Closed porting decisions (record each in the factory JSDoc):

1. **Chevron.** No `chevron` binding. The consumer serves BOTH paths inside
   the toggle's inline `<svg>` and toggles them with `x-show="!collapsed"`
   (`d="m15 18-6-6 6-6"`) and `x-show="collapsed"` (`d="m9 18 6-6-6-6"`) —
   the same served-markup-plus-`x-show` shape `src/data-table.ts` documents
   for its sort icons. Document the exact `<svg>` (15×15, `viewBox="0 0 24
24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`, round
   caps/joins, `aria-hidden="true"`) in the JSDoc usage example.
2. **Item `title` in rail mode.** The binding does NOT walk or mutate
   `.lyra-sbgroup__item` elements. React rewrites items on collapse because it
   owns the render; in Alpine the markup is served, so the consumer serves
   `title` on items permanently — the CSS already hides the visual label in
   rail mode and a permanent native tooltip is harmless when expanded.
   Document this as the consumer's responsibility.
3. **`addRailLinkLabels` is not ported.** React clones composed children to
   derive `title`/`aria-label` from their text; in Alpine that would be a DOM
   sweep. Document that consumers composing links serve their own
   `title`/`aria-label`.
4. **`collapsible` has no Alpine equivalent** — a sidebar is collapsible
   exactly when the consumer renders a toggle wired with `x-bind="toggle"`,
   the same modeling `lyraSidebarGroup` uses for its `label` binding.

The binding does not touch groups: `lyraSidebarGroup` stays untouched and the
rail's group/brand/footer effects are pure CSS.
</task>

<scope>
May change ONLY:

- `packages/alpine/src/app-sidebar.ts` (new)
- `packages/alpine/src/app-sidebar.browser.test.ts` (new)
- `packages/alpine/src/index.ts` (registration + exported option type)
- `packages/alpine/package.json` (size-limit budget line only)
- `.changeset/alpine-lyra-app-sidebar.md` (new — one-paragraph minor changeset
  for `@lyra-ds/alpine`, in the exact style of the existing
  `.changeset/alpine-lyra-*.md` files)

Do not change anything outside this list; if the task requires it, stop and
report.
</scope>

<acceptance_criteria>

1. `pnpm --filter @lyra-ds/alpine run typecheck` passes (paste real output).
2. `pnpm exec prettier --check packages/alpine` passes (paste real output).
3. `Alpine.plugin(lyra)` registers `lyraAppSidebar`; `LyraAppSidebarOptions`
   (and any label type it needs) is exported from `src/index.ts` following the
   pattern of the neighbouring bindings.
4. `src/app-sidebar.browser.test.ts` uses a fixture with the SERVED markup
   shape (nav.lyra-appsidebar with brand, `.lyra-appsidebar__groups` holding a
   real `lyra-sbgroup` with items carrying `title`, footer, and the toggle
   button with the two chevron paths) and covers:
   - `defaultCollapsed: true` seeds the state, and expanding REMOVES a
     server-rendered `lyra-appsidebar--rail` class;
   - toggling flips `--appsidebar-width` between `260px`/`64px` (and a custom
     `width` option is honoured);
   - the toggle's `aria-label` and `title` swap between the two labels, and
     custom `labels` override the defaults;
   - clicking the toggle dispatches a bubbling `lyra:collapse` carrying the new
     `collapsed` value;
   - the two chevron paths swap visibility with the state;
   - `x-modelable` + `x-model` on `collapsed` works in BOTH directions;
   - axe clean in expanded and rail states.
     Assertions read real DOM state (classList, attributes, computed/inline
     style) — never locator truthiness.
5. size-limit budget updated per the shared brief's rule (≤0.25 kB headroom
   over the measured size; paste the measurement).
6. No existing file's behavior changes; all other suites remain untouched.
   </acceptance_criteria>

<compact_output_contract>
Report back, in order: files touched (paths only); commands run with their REAL
output (typecheck, prettier, size-limit); the measured size and the new budget;
any behavior detail where you diverged from the React source and why;
uncertainties declared as such. No test-result claims for suites you cannot run
(Browser Mode does not work in your sandbox — the maestro runs it).
</compact_output_contract>
