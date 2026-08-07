# Lot 06 — `lyraAccordion`

Sits on top of `.batuta/brief-alpine-wave1.md`. Read both in full before
writing anything. Work from the repo root; do not commit.

<task>
Port the Accordion state machine from
`packages/react/src/accordion/accordion.tsx`
(tests: `packages/react/src/accordion/accordion.browser.test.tsx`) to
`Alpine.data('lyraAccordion', ...)`. No shared internals, no presence —
the height animation is pure CSS (0fr grid row); the panel stays mounted.
Copy `packages/alpine/src/tabs.ts`-style structure if it exists in your
checkout, else `dropdown.ts` (root captured in `init()`, binding objects,
id generation).

Identity model (DECIDED — record it, do not revisit): the consumer marks
each `.lyra-acc__item` wrapper with `data-value`; DOM order defines index.
Generate `${rootId}-trigger-N`/`${rootId}-panel-N` ids only when the
trigger/panel elements have none, and wire `aria-controls`/
`aria-labelledby` from whatever ids result.

Behavior contract (verified against the React source — read it anyway; the
source wins on any detail this list compresses):

- State: `openItems` — React holds a Set; here hold a plain ARRAY of value
  strings (Livewire/JSON cannot serialize a Set) exposed via `x-modelable`.
  Seeds: `defaultOpen` (single value string, optional), `multiple`
  (boolean, default false).
- Toggle semantics (mirror React's `toggle` exactly): when `multiple` is
  false, opening an item closes every other (the next array is rebuilt
  from empty); toggling an open item closes it. Mutate `openItems` only by
  reassigning the array property (plain assignment — Alpine reactivity and
  x-modelable both need it), never by in-place `push`/`splice`.
- Named bindings: `item` (the `.lyra-acc__item` wrapper), `trigger` (the
  header button), `panelWrap` (the `.lyra-acc__panel-wrap` element),
  `panel` (the `.lyra-acc__panel` element). Base classes stay in the
  consumer's markup.
- `item`: reactive `lyra-acc__item--open` class when its value is open.
- `trigger`: `type="button"`, reactive `aria-expanded`, `aria-controls` →
  panel id, `@click` toggles. (No arrow-key roving — the React Accordion
  has none; headers sit in the normal Tab order. Parity means not adding
  it.)
- `panelWrap`: reactive `inert` when closed (attribute present/absent —
  assert the attribute, and assert the content is unreachable by Tab).
- `panel`: `aria-labelledby` → trigger id.
- The consumer's `.lyra-acc__chevron` and `.lyra-acc__panel-clip` markup
passes through untouched.
</task>

<scope>
May change ONLY:
- `packages/alpine/src/accordion.ts` (new)
- `packages/alpine/src/accordion.browser.test.ts` (new)
- `packages/alpine/src/index.ts` (registration + type surface if needed)
- `packages/alpine/package.json` (size-limit budget line only)
- `.changeset/alpine-lyra-accordion.md` (new — one-paragraph minor
  changeset for `@lyra-ds/alpine`, mirroring the existing alpine
  changesets' style)
Do not change anything outside this list; if the task requires it, stop
and report.
</scope>

<acceptance_criteria>

1. `pnpm --filter @lyra-ds/alpine run typecheck` passes (paste real output).
2. `pnpm exec prettier --check packages/alpine` passes.
3. `src/accordion.browser.test.ts` mirrors the React suite's coverage for
   the ported behavior: single-open swap vs `multiple` independence,
   `defaultOpen` seeding, `--open` class emission, `aria-expanded`/
   `aria-controls`/`aria-labelledby` wiring, `inert` toggling with a real
   Tab-reachability assertion, the height-animation contract (panel stays
   mounted while closed — assert presence in DOM, not display), axe clean
   (open and closed), and the two-way `x-modelable`/`x-model` test
   asserting the ARRAY shape in both directions. Follow shared-brief
   lesson 6 for construction.
4. `Alpine.plugin(lyra)` now registers `lyraAccordion`; all existing
   suites pass unmodified.
5. size-limit budget updated per the shared brief's rule.
   </acceptance_criteria>

<compact_output_contract>
Report back, in order: files touched (paths only); commands run with their
REAL output (typecheck, prettier, size-limit); the measured size and new
budget; any behavior detail where you diverged from the React source and
why; uncertainties declared as such. No test-result claims for suites you
cannot run.
</compact_output_contract>
