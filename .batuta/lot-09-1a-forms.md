# Lote 09-1a — Onda 1a: RadioGroup, CheckboxGroup, Fieldset (+FormRow), Separator

Sits on top of `.batuta/brief-fase8-waves.md` — read that first, in full.

<task>
Add four React wrappers (five exports) to `@lyra-ds/react`, from these handoff
contracts:
1. `RadioGroup` — handoff/components/forms/RadioGroup.{d.ts,jsx,prompt.md};
   composes the existing `Radio`.
2. `CheckboxGroup` — handoff/components/forms/CheckboxGroup.*; composes the
   existing `Checkbox`.
3. `Fieldset` AND `FormRow` — both live in handoff/components/forms/Fieldset.*
   (FormRow is defined inside Fieldset.jsx). Decide their file layout by the
   repo's own precedent for co-located exports (see how Card/Table subparts or
   nav-link are laid out) — one entry `fieldset` exporting both is acceptable
   if the exports map stays 1:1 with entries.
4. `Separator` — handoff/components/layout/Separator.*.
</task>

## Acceptance criteria

1. Each component matches its handoff `.d.ts` (props, defaults, JSDoc) and
   renders the exact `.lyra-*` classes its reference `.jsx` emits.
2. Any user-visible string from the handoff JSX is a translatable prop with
   English default.
3. Browser tests: composed real-shape render for the two groups (with actual
   Radio/Checkbox children), keyboard behavior the reference implements,
   light+dark axe clean, `expect.element` for existence. SSR tests per
   convention.
4. All offline gates green, including regenerated docgen output (54 → 59
   components expected — verify the number the generator reports).
5. Changeset present (minor, @lyra-ds/react).

## Stop conditions

A needed `.lyra-*` class absent from packages/styles; a handoff contract
contradicting an existing component's API; same command failing twice.

## RETRY FEEDBACK (verification failure — fix exactly this)

`FormRow` sets raw `gridTemplateColumns` inline. That violates the repo's
layout-wrapper doctrine established for Stack/Grid (see
`packages/react/src/grid/grid.tsx` and the additive-extension comment at
`packages/styles/components/layout/layout.css` ~line 90 explaining WHY: a raw
inline style makes the component unusable from Vue/Blade/LiveView adapters).
The handoff's own inline style is the same defect we already corrected for
Stack/Grid — follow the repo precedent, not the handoff, here.

1. `FormRow` emits `'--lyra-formrow-columns'` as a typed custom property (copy
   the Grid pattern verbatim, including the CSSProperties interface extension).
2. `packages/styles/components/forms/forms.css` gains an ADDITIVE extension
   (this one styles edit is now inside Boundaries): re-declare `.lyra-formrow`
   at the end of the file's additive region with
   `grid-template-columns: var(--lyra-formrow-columns, 1fr);`, with the same
   comment style as the Stack/Grid additive block, and register the class in
   `ADDITIVE_EXTENSIONS` in `tools/parity/parity.mjs` if not already covered
   (also now inside Boundaries, that data structure only). `pnpm run parity`
   must stay green — the handoff's 560px `1fr !important` override still wins,
   which is correct.
3. Fix the three fieldset browser tests to assert the CONTRACT, not the
   browser's serializer: assert
   `formRow.style.getPropertyValue('--lyra-formrow-columns')` equals the
   expected `repeat(N, minmax(0, 1fr))` string (custom properties are stored
   verbatim), plus a computed-style check that `display` is `grid`. Never
   assert the serialized shorthand of a browser-normalized longhand.
4. Re-run: react build, typecheck, lints, size-limit, parity. The maestro
   reruns the browser suite.
