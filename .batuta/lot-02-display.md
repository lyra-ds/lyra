# Lot 2 — display components (+ IconButton)

Follow `.batuta/brief-phase06b-fanout.md` in full. It is the contract; this file
only names your lot and pins the facts you would otherwise have to guess.

Lot 1 (textarea, checkbox, radio, switch, select, combobox, file-upload) is
already merged and is a second set of reference pages next to the four in the
shared brief. Match them.

## Your components (7)

| slug          | props.json `name` | `group`   |
| ------------- | ----------------- | --------- |
| `avatar`      | `Avatar`          | `display` |
| `card`        | `Card`            | `display` |
| `tag`         | `Tag`             | `display` |
| `icon`        | `Icon`            | `display` |
| `skeleton`    | `Skeleton`        | `display` |
| `accordion`   | `Accordion`       | `display` |
| `icon-button` | `IconButton`      | `action`  |

Append them to `apps/docs/lib/components.ts` in that order, after the existing
entries. Note `icon-button` is `'action'`, not `'display'` — it belongs next to
Button in the reader-facing taxonomy. Do not touch the taxonomy itself.

## Facts worth knowing before you write

- **`Card` supports `asChild`** (`<Card asChild interactive><a href>…</a></Card>`
  makes the whole card one link). It throws if combined with `title` or `footer`.
  An `asChild` example needs `'use client'` — see the shared brief.
- **`Icon` takes `name` from a generated Lucide registry**, or an `icon` prop for a
  component the registry does not carry. Do not invent icon names: verify each one
  against `packages/react/src/icon/icon-registry.ts`. An unknown name renders
  nothing and warns in dev.
- **`Accordion` is driven by an `items` array**, not by composed children, and has
  `defaultOpen` plus `multiple`. Read the `AccordionItem` shape in
  `packages/react/src/accordion/accordion.tsx` before writing.
- **`Skeleton`** takes `width`/`height`/`circle`. Its point is holding layout, so an
  example that mimics the shape of the real content beats a lone grey bar.
- **`Avatar`** falls back to initials from `name` when `src` is absent, and has a
  `status` dot. Say what `name` is for in the accessibility section.
- **`Tag`** renders a remove affordance only when `onRemove` is given — that example
  needs `'use client'`.

## Cross-references you should make

`IconButton` vs `Button` (is there a visible label; IconButton's `label` is the
accessible name, not decoration). `Tag` vs `Badge` (user-removable input token vs
status marker — Badge is already documented, read its page first and do not
contradict it). `Skeleton` vs `Spinner` (layout-shaped wait vs indeterminate one).
`Card` vs plain sections (when the border earns its place).

## Definition of done

All of `.batuta/brief-phase06b-fanout.md` § "Verify before you report done",
plus: state in your report which of the 7 pages you could not verify visually.
Do not commit — the reviewer commits after opening every page in the dev server.

One more thing, learned from Lot 1: do not leave workflow scaffolding in the repo
root (a `.superpowers/` directory or similar). Prettier lints the whole tree and
`pnpm lint` fails on it even when git ignores it.
