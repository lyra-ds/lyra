# Lot C2 — `lyraTableOfContents` + `internal/scroll-spy.ts`

Sits on top of `.batuta/brief-alpine-wave-c.md`. Read both in full before
writing anything. Work from the repo root; do not commit.

<task>
Port the TableOfContents component AND its `useScrollSpy` hook from
`packages/react/src/table-of-contents/table-of-contents.tsx`
(tests:
`packages/react/src/table-of-contents/table-of-contents.browser.test.tsx`).
The spy becomes a NEW plain-function helper
`packages/alpine/src/internal/scroll-spy.ts`; the binding is thin.

## `internal/scroll-spy.ts` (port `useScrollSpy` faithfully)

Shape: `observeScrollSpy(ids: string[], onChange: (id: string | undefined)
=> void): () => void` (attach/cleanup form like `flip-placement.ts`).
Port the exact machine:

- Resolve `ids` to existing `document.getElementById` elements, in the
  given order, IGNORING missing ids. Zero elements → call nothing,
  return a no-op cleanup.
- Seed via `queueMicrotask` with the FIRST element's id (guarded by a
  `disposed` flag).
- SSR/absent `IntersectionObserver` → seed only, no observer (module must
  not touch browser globals at import time).
- IntersectionObserver with `rootMargin: '0px 0px -70% 0px'`,
  `threshold: 0`; a Map of currently intersecting elements; on every
  batch, active = topmost intersecting (smallest
  `getBoundingClientRect().top`).
- Empty band fallbacks, exactly: at document end
  (`scrollY > 0 && scrollY + innerHeight >= documentHeight - 1`, where
  documentHeight = max of documentElement/body scrollHeight) → LAST
  element; otherwise nearest PRECEDING element whose top ≤
  `innerHeight * 0.3` → its id; none → FIRST element's id.
- `scroll` listener (`{ passive: true }`) + `resize` listener that
  re-resolve ONLY when the intersecting map is empty.
- Cleanup: disposed flag, disconnect, clear map, remove listeners.

## `lyraTableOfContents` binding (DOM-driven)

- State: `activeId` — controllable, `x-modelable`-ready (string,
  initially `''`; the spy writes ids into it; an external write wins
  until the spy next fires — same as React's controlled `activeId`
  semantics translated to a single reactive property; no `undefined`:
  normalize to `''`).
- `init()`: capture root; collect target ids from the served links —
  every `a[href^="#"]` inside the root, id = decoded fragment — and
  start the spy, writing each change into `this.activeId`. `destroy()`
  stops it. Re-collection on DOM changes is NOT required (React parity:
  ids change only with props).
- Served markup: `nav.lyra-toc` with `aria-label`, `lyra-toc__title`,
  `lyra-toc__list`, links `a.lyra-toc__link` with `href="#id"`.
- Named binding `link` (on each anchor): `:class` OBJECT syntax for
`lyra-toc__link--active` (server may render it — must be removable),
`:aria-current` returning `'location'` when active and `false`
otherwise (Alpine removes the attribute on a `false` binding value —
verify against the shipped bindings' pattern for conditional
attributes). Active = the link's own fragment id === `activeId`.
</task>

<scope>
May change ONLY:
- `packages/alpine/src/internal/scroll-spy.ts` (new)
- `packages/alpine/src/table-of-contents.ts` (new)
- `packages/alpine/src/table-of-contents.browser.test.ts` (new)
- `packages/alpine/src/index.ts` (registration + type surface if needed)
- `packages/alpine/package.json` (size-limit budget line only)
- `.changeset/alpine-lyra-table-of-contents.md` (new — one-paragraph
  minor changeset for `@lyra-ds/alpine`, mirroring the existing alpine
  changesets' style)
Do not change anything outside this list; if the task requires it, stop
and report.
</scope>

<acceptance_criteria>

1. `pnpm --filter @lyra-ds/alpine run typecheck` passes (or the direct
   `tsc` fallback; paste real output).
2. `pnpm exec prettier --check packages/alpine` passes (or direct
   fallback).
3. `src/table-of-contents.browser.test.ts` builds a scrollable fixture
   with real headings at FORCED offsets (arithmetic per shared-brief
   lesson 6 — tall spacer blocks so each heading's band membership is
   deterministic) and covers: seed makes the first link active
   (`--active` + `aria-current="location"`); scrolling a later heading
   into the top band moves the active link (assert with `vi.waitFor` —
   IntersectionObserver batches are async); scrolling to the document
   end activates the LAST link; a server-rendered `--active` on the
   wrong link is REMOVED once the spy seeds; missing-id links are
   ignored without errors; `x-modelable` + `x-model` works BOTH
   directions on `activeId`; axe clean.
4. `Alpine.plugin(lyra)` now registers `lyraTableOfContents`; all
   existing suites pass unmodified.
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
