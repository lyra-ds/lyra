# Task brief — Phase 4 / Batch B: 5 form components for `@lyra-ds/react`

You are converting 5 handoff component contracts into shipped `@lyra-ds/react`
wrappers. This is the same conversion workflow already applied to the Phase 3
pilots and the 12 Phase 4 / Batch A components — follow the established recipe
exactly. You have NO access to the conversation that produced this brief; every
fact you need is below or in the cited files.

## Goal

Ship 5 form components — **Textarea, Checkbox, Radio, Switch, FileUpload** — as
accessible, SSR-safe React wrappers that emit exactly the `.lyra-*` classes that
already exist in `@lyra-ds/styles`. Each gets: source, exports-map + tsup entry,
the full test matrix (browser smoke + a11y + SSR), and passes every quality gate.

## Read these first (in order)

1. `packages/react/CONVENTIONS.md` — THE conversion checklist. Non-negotiable.
   Every rule (D-08..D-22) applies. Do not re-litigate locked decisions.
2. The **Input pilot** — `packages/react/src/input/` (source + `input.browser.test.tsx`
   - `input.ssr.test.ts`). This is your template for Textarea/Checkbox/Radio/Switch
     (the "Form / controlled" row of the pilot map). Copy its shape.
3. The handoff contracts and prototypes for each component:
   - `handoff/components/forms/Textarea.{d.ts,jsx}`
   - `handoff/components/forms/Checkbox.{d.ts,jsx}`
   - `handoff/components/forms/Radio.{d.ts,jsx}`
   - `handoff/components/forms/Switch.{d.ts,jsx}`
   - `handoff/components/files/FileUpload.{d.ts,jsx}`
     The `.d.ts` is the API contract (exact prop names/types). The `.jsx` is the
     visual/interaction reference — mine it for class names and behavior, but apply
     the CONVENTIONS deviations (useId over label-slug ids, `.lyra-icon` hook, etc).

## The CSS already exists — DO NOT touch `@lyra-ds/styles`

All `.lyra-*` classes for these 5 components already ship from Phase 2 in
`packages/styles/components/forms/forms.css` and `.../files/files.css`. Your job
is only to EMIT them from React. Do **not** add, edit, or append any CSS, and do
**not** touch `tools/parity/` ADDITIVE_EXTENSIONS (that mechanism is only for
React-added animation CSS, which none of these need). The class-parity test must
pass against the classes as they already are:

- Textarea → `.lyra-textarea`
- Checkbox → `.lyra-checkbox`
- Radio → `.lyra-radio`
- Switch → `.lyra-switch`, `.lyra-switch__track`
- FileUpload → `.lyra-upload` and its BEM children: `__zone`, `__zone--drag`,
  `__zone-icon`, `__zone-label`, `__zone-hint`, `__list`, `__item`,
  `__item--error`, `__item-row`, `__item-icon`, `__item-body`, `__item-name`,
  `__item-meta`, `__item-remove` (`__remove`), `__bar`, `__bar-fill`, `__check`.
  Use the exact class names present in `files/files.css` — read that file and
  match it; the list above is a guide, the CSS file is the source of truth.

## Per-component notes

- **Textarea** (`extends TextareaHTMLAttributes<HTMLTextAreaElement>`; `label?`,
  `hint?`, `error?`): closest twin of the Input pilot but on `<textarea>`.
  `forwardRef` to the `<textarea>`. `useId()` for the label association and for
  `aria-describedby` (hint/error); `aria-invalid` when `error` is set. Native
  `onChange` is a DOM event handler — forward it per D-14 (compose, never replace).
- **Checkbox** (`extends InputHTMLAttributes<HTMLInputElement>`; `label?: ReactNode`):
  native `<input type="checkbox">`. Keyboard/focus come free from the native input —
  do NOT build a custom widget. Wrap the input + label; associate via `useId()`.
  Controlled iff `checked !== undefined` (D-14), compose the native `onChange`.
- **Radio** (`+ name?`): same as Checkbox on `<input type="radio">`; `name` groups.
- **Switch** (`extends InputHTMLAttributes<HTMLInputElement>`; `label?: ReactNode`):
  native `<input type="checkbox">` with `role="switch"` for the a11y contract;
  renders the `.lyra-switch__track` visual. Space toggles via the native input.
- **FileUpload** (`FileUploadProps` / `FileUploadItem` — read the `.d.ts`): the
  odd one out. NOT a native form input — a stateful `div` component with a
  dropzone (drag & drop + click-to-browse via a hidden `<input type="file">`),
  a per-item list with simulated upload progress, size validation, and removal.
  Honor the real API from the contract exactly:
  - `onFiles(files: File[])` called with the real File objects on add.
  - `onChange(items: FileUploadItem[])` called on every items change.
  - `defaultItems` seeds initial state (demos). Internal item state is
    uncontrolled, seeded from `defaultItems`, emitted via `onChange`.
  - `accept`, `maxSizeMB` (over-size → item `status: "error"`), `multiple`
    (default true), `uploadDuration` (default 1800ms simulated progress).
  - The simulated progress uses timers — put them inside effects/handlers, never
    module scope; clean them up on unmount. SSR-safe: `renderToString` must not
    throw and must not touch `document`/`window` at module scope.
  - Dropzone must be keyboard-operable (activate the file input via a
    button/label, focusable) and each remove control focusable. axe clean.
    Mine `handoff/components/files/FileUpload.jsx` for the exact markup/logic and
    port it, applying CONVENTIONS.

## Test matrix (per component — CONVENTIONS step 10)

For each of the 5, next to the source:

- `*.browser.test.tsx` (Browser Mode / chromium): render every variant in light
  AND `[data-theme="dark"]`; assert the exact `.lyra-*` class string; assert no
  console errors; `await axe.run(...)` in BOTH themes (call `axe-core` directly —
  `vitest-axe` is stale). Tests import `@lyra-ds/styles` INSIDE the test file only.
- `*.ssr.test.ts` (`environment: node`): `renderToString(<Component/>)` must not throw.
- Interactive keyboard assertions where it applies (Switch/Checkbox/Radio toggle
  via keyboard; FileUpload remove + dropzone activation) — real events, Browser Mode.

## Wiring (CONVENTIONS step 11 + D-12/D-13)

- Named exports only (D-12). Add each component to the root barrel AND a
  per-component subpath: exports map entry == tsup entry == dist basename.
  Update `packages/react/package.json` `exports` and `packages/react/tsup.config.ts`
  entries for: `textarea`, `checkbox`, `radio`, `switch`, `file-upload`.
  (Match the existing kebab-case dist basename convention — check how
  `icon-button` is wired and mirror it; the subpath is `@lyra-ds/react/file-upload`.)
- `sideEffects: false` stays. Add `size-limit` entries for the new subpaths.
- Add a changeset: `pnpm changeset` → `minor` on the `0.x` line, describing the
  5 new components (CONTRIBUTING requires one for any published-package change).

## Acceptance criteria (verify each before finishing)

Run from the repo root; all must pass:

```bash
pnpm --filter @lyra-ds/react run typecheck
pnpm --filter @lyra-ds/react run lint
pnpm --filter @lyra-ds/react run build
pnpm --filter @lyra-ds/react run test        # browser + ssr projects, all green
pnpm run parity                               # class-parity intact, styles UNCHANGED
pnpm exec publint packages/react
pnpm --filter @lyra-ds/react exec size-limit
pnpm run lint                                 # root: prettier --check . must pass
```

Concretely:

1. All 5 components exist with complete TypeScript, `forwardRef` where a DOM node
   is rendered, JSDoc rewritten in canonical English.
2. Each emits exactly its `.lyra-*` classes; class-parity + smoke tests prove it.
3. axe: zero violations in light and dark for all 5 (the ONLY permitted axe
   finding project-wide is the locked dark primary/danger 4.39:1 contrast — do
   not expect or rely on it here; these form components should be clean).
4. All 5 pass `renderToString` without throwing (SSR guard).
5. FileUpload honors the real `onFiles`/`onChange`/`defaultItems` API from its
   `.d.ts`; controlled/uncontrolled and native-onChange composition honored for
   the four native-input components per D-14.
6. Exports map, tsup entries, size-limit, changeset all updated. Every gate above
   green. `git status` shows changes ONLY under `packages/react/` and `.changeset/`
   — NOT under `packages/styles/` or `tools/`.

## Boundaries — do NOT

- Do NOT modify `@lyra-ds/styles` (no CSS edits/additions).
- Do NOT modify `tools/parity/` or its ADDITIVE_EXTENSIONS.
- Do NOT touch other components, the build config beyond adding the 5 entries,
  CI, or any `.batuta/` / `CLAUDE.md` files.
- Do NOT introduce runtime deps (only `lucide-react` is allowed; internal `cx`,
  not `clsx` — D-11).
- Do NOT commit. Leave the working tree dirty; the maestro reviews and commits.
