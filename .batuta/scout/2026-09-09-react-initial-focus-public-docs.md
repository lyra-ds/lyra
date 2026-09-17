# React initial focus public examples — scout

Read-only GLM5.3Flash exit0, unchanged guard. Snapshot-based mapping; runtime worker was independent.

<<<FINDINGS

Basis: snapshot + reviewed design only. Globs confirm exact file set (no extra modal examples; no other locales). Runtime owners + shared helper = separate worker, out of scope. Read-only discovery, zero edits.

## Demo assignments (existing examples only)
1. Least-destructive Cancel initial target
   - `apps/docs/components/examples/dialog/basic.tsx`
   - Add `cancelRef = useRef<HTMLButtonElement>(null)` on existing ghost `Cancel` footer Button; pass `initialFocusTo={() => cancelRef.current}` to Dialog. Never declare danger `Delete`. Both footer buttons keep `onClick={() => setOpen(false)}` — no fabricated deletion/success state, no network. `returnFocusTo={() => triggerRef.current}` byte-identical.
2. Named reading heading
   - `apps/docs/components/examples/drawer/without-footer.tsx`
   - Augment body with one native `<h3 ref={headingRef} tabIndex={-1}>` before existing paragraph (native element; pattern already established by MDX successor snippets; design allows declared `tabindex=-1` heading). Add `initialFocusTo={() => headingRef.current}`. `returnFocusTo` untouched; no footer (read-only example purpose preserved). Rationale: panel element is not publicly ref-able, so declared heading is the only honest reading demo. If docs owners refuse content change, fallback = prose-only note that undeclared read-only drawer falls back to named panel (already current default).
3. Unchanged natural CommandPalette search
   - `apps/docs/components/examples/command-palette/trigger.tsx` — NO prop added; modal palette keeps search input as default initial target = the proof of unchanged natural search.
   - `inline.tsx`, `hints.tsx` — untouched; inline never invokes `initialFocusTo`.

Unchanged examples: `dialog/dismissal.tsx` (dismissal-only demo; "I agree" is sole action, not a cancel-first case), `drawer/basic.tsx`, `bottom-sheet/basic.tsx`, `bottom-sheet/labelled-without-title.tsx` (default filtered first-control/panel behavior; no demo burden).

## MDX scopes (en + confirmed pt-BR counterparts; ALL new prose English, including pt-BR files)
- `apps/docs/content/docs/en/components/dialog.mdx`
  - Extend Accessibility bullet "Focus moves into the panel on open": declared resolver target first; else first eligible task control in DOM order (unsafe candidates skipped); panel = conservative fallback; no aria-invalid chasing on open.
  - Add short "React initial focus" prose (standalone subsection or extension of "React return focus"): `initialFocusTo?: () => HTMLElement | null`, synchronous per-opening resolver, reads committed state/refs only, null/ineligible → named panel, destructive action must never be declared, callback throws propagate per owner context. Explicitly name validation owner: form composition owns validation re-entry focus (Task26 lifecycle later); open does not infer validation failure from aria-invalid.
  - Augment existing `DeleteProject` snippet (only snippet needing augmentation): add `cancelRef` + `footer` (ghost Cancel, danger Delete) + `initialFocusTo={() => cancelRef.current}`; existing `returnFocusTo` successor logic untouched. Executable against public API + native elements.
  - `basic` Example prose gains one clause (focus lands on Cancel); `dismissal` Example prose unchanged.
- `apps/docs/content/docs/en/components/drawer.mdx`
  - Extend Accessibility focus line + short initial-focus prose; `without-footer` Example prose explains declared reading heading. `ProjectDetails` snippet: unchanged (returnFocusTo contract preserved; reading pattern lives in live example + prose).
- `apps/docs/content/docs/en/components/bottom-sheet.mdx`
  - Replace "focus moves to the first focusable element in the sheet, or the sheet itself" with filtered eligibility behavior + `initialFocusTo` availability. No example/snippet change; `ProjectDetails` snippet contract preserved.
- `apps/docs/content/docs/en/components/command-palette.mdx`
  - "Return focus"/Accessibility prose: modal default initial target is the search input (unchanged natural search); `initialFocusTo` overrides only in modal mode; exact phrase "Ignored in inline mode". `Trigger` + Return-focus snippets unchanged.
- pt-BR mirrors (verified existing): `apps/docs/content/docs/pt-BR/components/{dialog,drawer,bottom-sheet,command-palette}.mdx` — identical added prose in English.

## API surface in docs
- `<StackApi stack="react" />` blocks render generated tables — new prop appears via docgen automatically; no manual catalog edits from docs side. JSDoc strings ("Resolves the initial focus destination inside the modal on each accepted opening."; CP: "Ignored in inline mode.") live in runtime files (separate worker).

## Executable native proof (docs-side, no new infra/deps/tests)
- Destructive dialog open → `document.activeElement` is named Cancel button.
- Read-only drawer open → `activeElement` is named `tabIndex={-1}` heading.
- Modal palette open → `activeElement` is search input; inline palettes unaffected.
- Accepted close → prior `returnFocusTo` destinations unchanged (regression via existing examples).
- No fabricated effects: footer buttons call `setOpen(false)` only; no success/deletion state, toasts, or network.

## Totals
2 example files modified, 7 untouched; 4 en MDX prose edits (1 snippet augmented) + 4 pt-BR mirrors; 0 new examples, 0 deps, 0 style/network/setup edits, 0 validation API, 0 speculative variants.

## Out of scope
Runtime four owners + shared initial helper/hook (separate worker); Alpine/Blade MDX portions; catalog generation; Task26/31b/c claims; tests/build/format gates (worker/controller).

FINDINGS>>>

## Controller adjudication

Accepted the two existing example targets, natural palette search, eight React-only MDX sections, and no additional examples or runtime changes. Declined the claim that Drawer lacks a public panel ref: its existing forwardRef and attachPanel expose that node. The explicit named reading heading remains a useful demonstration by application choice, not a missing-ref workaround. Existing destructive example buttons only dismiss; this slice must not claim that a project was deleted. Public prose names form-composition validation responsibility without exposing internal task numbers.
