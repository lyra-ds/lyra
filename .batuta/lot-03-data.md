# Lot 3 — data components

Follow `.batuta/brief-phase06b-fanout.md` in full. It is the contract; this file
only names your lot and pins the facts you would otherwise have to guess.

Lots 1 (forms: textarea, checkbox, radio, switch, select, combobox, file-upload)
and 2 (display: avatar, card, tag, icon, skeleton, accordion + icon-button) are
already merged and are additional reference pages next to the four in the shared
brief. Match them.

## Your components (4)

| slug           | props.json `name` | `group` |
| -------------- | ----------------- | ------- |
| `table`        | `Table`           | `data`  |
| `stat`         | `Stat`            | `data`  |
| `empty-state`  | `EmptyState`      | `data`  |
| `file-manager` | `FileManager`     | `data`  |

Append them to `apps/docs/lib/components.ts` in that order, after the existing
entries. `data` already exists in `ComponentGroup`, `groupOrder` and
`groupLabelKey` — do not touch the taxonomy, only add the four entries.

## The stage layout prop — read this before writing any `<Example>`

`<Example>` takes `layout="row" | "block" | "plain"` (default `row`, a wrapping
flex row). Every component in this lot is a **block** component, so the default
would shrink it to its content and leave the stage half empty. The rule, from
`apps/docs/components/example-view.tsx`:

- `plain` — the component is itself a card-like surface, so the stage must not
  wrap it in another Card. **`Table` (`.lyra-table-wrap` has background + border
  - radius) and `FileManager` (`.lyra-fm` likewise) are always `plain`.**
- `block` — full width inside the stage Card, for components that need the width
  but bring no surface of their own. **`EmptyState` (`.lyra-empty` is a centered
  flex column, no chrome) is always `block`.**
- `Stat` (`.lyra-stat` is a bare flex column, no chrome) is a small tile: a set
  of them side by side reads well with the default `row`. If an example gives the
  stats their own grid or puts each in a `<Card>`, use `block` / `plain`
  accordingly.

Getting this wrong is visible on the page and is a review failure, not a nit.

## API facts — verified against the source, do not re-derive

**`Table`** (`packages/react/src/table/table.tsx`) — declarative, not composed.
`columns: TableColumn[]` where `TableColumn = { key: string; label: ReactNode;
align?: 'left' | 'center' | 'right' }`, and `rows: Array<Record<string,
ReactNode>>` read by `column.key`. Cell values are React nodes, so a `<Badge>` in
a status column is the intended usage — do that in an example. A row's `id`
(string or number) is used as the React key when present; otherwise the index.
The first column of every row gets `.lyra-table__primary`. `hover` is opt-in.
`align` is applied as an inline `style` on `<th>`/`<td>` by the component itself
— that is the component's job, not a consumer inline style.

**`Stat`** — `label`, `value` (both required, `ReactNode`), optional `delta` and
`direction: 'up' | 'down' | 'flat'` (default `'flat'`). The component renders the
arrow itself (`↑` / `↓` / `→`) before the delta text, so `delta="12%"`, never
`delta="↑ 12%"`. `direction` drives both the arrow and the color, and it is
independent of the sign of your text — say in the page that on a metric where
down is good (churn, latency), the direction you pass is the direction of the
number, and the color reads as good/bad regardless.

**`EmptyState`** — `title` required; `icon`, `description`, `action` optional.
`icon` is normally `<Icon name="…" size={24} />` and `action` is normally a
`<Button>`. Note it extends `Omit<HTMLAttributes<HTMLDivElement>, 'title'>`, so
`title` is the heading content, **not** the HTML tooltip attribute — worth one
line on the page. It renders `<h3 class="lyra-empty__title">`: mention in
Accessibility that the heading level is fixed at `h3` and the consumer places it
where that level is correct.

**`FileManager`** — `files?: ManagedFile[]` where `ManagedFile = { id: string;
name: string; type?: 'folder'; size?: number; items?: number; updated?: string;
shared?: boolean }` (folders sort before documents). `path?: string[]` drives the
breadcrumb, `onNavigate(index)` fires for a segment. `view` / `defaultView`
(`'list' | 'grid'`, default `'list'`) + `onViewChange` are the usual
controlled/uncontrolled pair. `onOpen(file)` fires on a file name or grid card.
`actions?: (file) => DropdownItem[]` **replaces** the default menu (Open, Rename,
Download, separator, Delete) — it does not extend it. `searchPlaceholder` and
`emptyMessage` are the two strings you must expose to translate the widget.
Search is internal state: any example is `'use client'`.

## Cross-references you should make

`Table` vs `FileManager` (rows you define vs a ready-made file browser with its
own search, view toggle and per-item menu). `Stat` vs `Badge` (a metric with a
trend vs a status marker). `EmptyState` vs `Skeleton` (nothing to show vs not
loaded yet) and vs `Alert` (an expected empty result vs something that went
wrong). Badge, Skeleton and Alert-adjacent pages already exist — read them and do
not contradict them.

## Accessibility facts worth pinning

- `Table` emits real `<table>` / `<thead>` / `<tbody>` / `<th>` / `<td>`. There is
  no `scope` on `<th>` and no `<caption>`: say what the consumer gets and does
  not get. Do not claim a caption or a `scope` that is not emitted.
- `FileManager` labels its view toggle (`role="group"`, `aria-label="View mode"`,
  each button `aria-pressed` + `aria-label`), its breadcrumb (`<nav
aria-label="Current folder">`) and each item's action trigger (`aria-label`
  ="Actions for <name>"). **The search `<input>` has no accessible name** — it
  only has a placeholder. That is a real gap: document it as a consumer
  responsibility, do not paper over it and do not "fix" it in `packages/`.
  Its labels are hard-coded English strings; note that for a localized app.
- `EmptyState`'s title is an `<h3>`; `Stat`'s label and value are `<span>`s inside
  a plain `<div>` — there is no `<dl>` semantics, so a screen reader reads the
  label then the value in order. State that plainly.

## Definition of done

All of `.batuta/brief-phase06b-fanout.md` § "Verify before you report done",
plus: state in your report which of the 4 pages you could not verify visually.
Do not commit — the reviewer commits after opening every page in the dev server.

Two lessons from earlier lots, both of which cost a round:

- Do not leave workflow scaffolding anywhere in the repo (a `.superpowers/`
  directory or similar). Prettier lints the whole tree and `pnpm lint` fails on
  it even when git ignores it.
- No third-party URLs in examples — no avatar services, no placeholder-image
  hosts, no icon CDNs. Zero runtime requests to third parties is a project
  constraint. Local assets under `apps/docs/public/` or nothing.
