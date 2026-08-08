# Lot C4 — `lyraFileUpload`

Sits on top of `.batuta/brief-alpine-wave-c.md`. Read both in full before
writing anything. Work from the repo root; do not commit.

<task>
Port the FileUpload state machine from
`packages/react/src/file-upload/file-upload.tsx`
(tests: `packages/react/src/file-upload/file-upload.browser.test.tsx`).

This component is the documented EXCEPTION to the served-markup model:
the item list is born at runtime, so consumers render it with `x-for`
over a served `<template>`, using the component's exposed item data and
helpers. The dropzone itself is served markup as usual.

Behavior contract (verified against the React source — read it anyway;
the source wins on any detail this list compresses):

- Options: `maxSizeMB` (number, optional), `multiple` (boolean, default
  true), `uploadDuration` (ms, default 1800), `defaultItems`
  (`FileUploadItem[]`, default `[]`).
- Item shape, ported: `{ id, name, size?, progress, status:
'uploading' | 'done' | 'error', error? }`.
- State: `items` (array) and `dragging` (boolean) — BOTH controllable,
  `x-modelable`-ready.
- `addFiles(fileList)`: empty → no-op. Dispatch `lyra:files` with
  `detail: { files }` (the real `File[]`). Stamp items with sequential
  ids `lyra-upload-${n}-${name}`; over-limit files
  (`size > maxSizeMB * 1024 * 1024`) become `status: 'error'`,
  `progress: 0`, `error: 'Over ${maxSizeMB} MB'`; others start
  `progress: 5`, `status: 'uploading'`. `multiple: false` keeps only
  the first stamped item and REPLACES the list; `true` appends.
- Simulated progress, ported exactly: per uploading item a
  `setInterval(…, 120)` adds `step = 100 / max(uploadDuration / 120, 1)`
  clamped at 100; reaching 100 clears the timer and flips
  `status: 'done'`. Mutate the reactive `items` array in place or by
  reassignment — whichever the existing suites' style favors — so
  Alpine reactivity propagates.
- `remove(id)`: clears that item's pending timer and filters it out.
- Every list change (add, progress tick, done flip, remove) dispatches
  a bubbling `lyra:change` with `detail: { items }` (React's onChange
  fired inside updateItems — port that placement so ticks dispatch
  too).
- `destroy()` clears all pending timers.
- Helpers exposed on the data object for consumer templates, ported
  exactly: `formatBytes(bytes?)` (B/KB rounded/MB one-decimal) and
  `iconFor(name)` (extension → `'image' | 'file-text' |
'file-spreadsheet' | 'file-archive' | 'film' | 'file'` — the
  consumer maps that token to its own icon markup).
- Named bindings:
  - `zone`: `type: 'button'`, `:class` OBJECT syntax for
    `lyra-upload__zone--drag` from `dragging`; `@click` clicks the
    hidden file input (query it from the captured root);
    `@dragover.prevent` sets `dragging = true` (preventDefault is
    load-bearing — drop won't fire without it); `@dragleave` sets
    `dragging = false`; `@drop.prevent` sets `dragging = false` and
    calls `addFiles(event.dataTransfer.files)`.
  - `input`: the hidden `<input type="file">` (served with `hidden`,
    `tabindex="-1"`, `accept`, `multiple` — consumer's markup);
    `@change` calls `addFiles(event.target.files)` then resets
    `event.target.value = ''`.
  - Per-item controls (remove button, progress width) live in the
  consumer's `x-for` template calling `remove(item.id)` /
  reading `item.progress` directly — no bindings; document this in
  the factory JSDoc with a minimal template example.
  </task>

<scope>
May change ONLY:
- `packages/alpine/src/file-upload.ts` (new)
- `packages/alpine/src/file-upload.browser.test.ts` (new)
- `packages/alpine/src/index.ts` (registration + type surface if needed)
- `packages/alpine/package.json` (size-limit budget line only)
- `.changeset/alpine-lyra-file-upload.md` (new — one-paragraph minor
  changeset for `@lyra-ds/alpine`, mirroring the existing alpine
  changesets' style)
Do not change anything outside this list; if the task requires it, stop
and report.
</scope>

<acceptance_criteria>

1. `pnpm --filter @lyra-ds/alpine run typecheck` passes (or the direct
   `tsc` fallback; paste real output).
2. `pnpm exec prettier --check packages/alpine` passes (or direct
   fallback).
3. `src/file-upload.browser.test.ts` uses a fixture with the served
   dropzone + an `x-for` template list and covers (construct `File`
   objects directly and a `DataTransfer` for drop — real events, no
   mocks of the component): input change adds items and dispatches
   `lyra:files` + `lyra:change`; progress reaches `done`
   (use a SHORT `uploadDuration` and `vi.waitFor`); an over-limit file
   becomes an error item with the exact message and never starts a
   timer; `multiple: false` replaces; drop adds files and clears
   `dragging`; dragover sets `dragging` (and the `--drag` class through
   the zone binding, object syntax removing a server-rendered one);
   remove mid-upload cancels its timer (item count drops and no late
   `done` appears); input value resets after change (same file twice
   fires twice); `x-modelable` + `x-model` works on `items` (both
   directions) — `dragging` modelable proven in the same fixture;
   axe clean with items in all three states.
4. `Alpine.plugin(lyra)` now registers `lyraFileUpload`; all existing
   suites pass unmodified.
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
