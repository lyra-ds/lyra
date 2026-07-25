# Lot 1 — form components

Follow `.batuta/brief-phase06b-fanout.md` in full. It is the contract; this file
only names your lot and pins the facts you would otherwise have to guess.

## Your components (7)

| slug          | props.json `name` | `group` |
| ------------- | ----------------- | ------- |
| `textarea`    | `Textarea`        | `form`  |
| `checkbox`    | `Checkbox`        | `form`  |
| `radio`       | `Radio`           | `form`  |
| `switch`      | `Switch`          | `form`  |
| `select`      | `Select`          | `form`  |
| `combobox`    | `Combobox`        | `form`  |
| `file-upload` | `FileUpload`      | `form`  |

Append them to `apps/docs/lib/components.ts` in that order, after the four
existing entries. `group` is `'form'` for all seven — it is already in the
`ComponentGroup` union, do not touch the taxonomy.

## Facts worth knowing before you write

- `Select` is a styled **native `<select>`** (a FORM recipe from the handoff), not
  an APG combobox. Do not document listbox keyboard behavior for it — the browser
  owns that. `Combobox` is the APG one (`aria-activedescendant`, filter resets
  the active option, controlled + uncontrolled).
- `Checkbox`, `Radio` and `Switch` render the whole wrapper as a `<label>`
  (implicit association, the entire row is clickable). There is no `htmlFor` and
  no generated `id`; a consumer `id` flows through `...rest`. Document that.
- `FileUpload` has a `.lyra-upload__check` element carrying `role="img"`.
- `Combobox` and `FileUpload` examples will hold state → `'use client'`.
- Read each component's source under `packages/react/src/<dir>/` when a prop's
  behavior is not obvious from `props.json`. Read, do not edit — `packages/` is
  off limits for this task.

## Cross-references you should make

The "When to use" sections should point at each other where the choice is real:
`Radio` vs `Select` (how many options, is one always chosen), `Checkbox` vs
`Switch` (staged in a form vs applied immediately), `Select` vs `Combobox` (does
the list need filtering), `Input type="file"` vs `FileUpload`. Name the sibling
component explicitly.

## Definition of done

All of `.batuta/brief-phase06b-fanout.md` § "Verify before you report done",
plus: state in your report which of the 7 pages you could not verify visually.
Do not commit — the reviewer commits after opening every page in the dev server.
