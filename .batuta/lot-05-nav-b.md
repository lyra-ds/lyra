# Lot 5 — navigation B (the keyboard widgets)

Follow `.batuta/brief-phase06b-fanout.md` in full. It is the contract; this file
only names your lot and pins the facts you would otherwise have to guess.

Lots 1 (forms), 2 (display), 3 (data) and 4 (nav A) are already merged and are
additional reference pages next to the four in the shared brief. Match them. Read
`tabs.mdx` first: it is the closest page in tone, and it shows how this project
documents a keyboard model honestly.

This is the densest lot so far — three of the four are APG keyboard widgets. Spend
your effort on the keyboard and focus sections; the prose elsewhere can be short.

## Your components (4)

| slug                 | props.json `name`   | `group`      |
| -------------------- | ------------------- | ------------ |
| `dropdown`           | `Dropdown`          | `navigation` |
| `sidebar-group`      | `SidebarGroup`      | `navigation` |
| `command-palette`    | `CommandPalette`    | `navigation` |
| `workspace-switcher` | `WorkspaceSwitcher` | `navigation` |

Append them to `apps/docs/lib/components.ts` in that order, after the existing
entries. Do not touch the taxonomy.

## The stage layout prop

`<Example>` takes `layout="row" | "block" | "plain"` (default `row`).

- `CommandPalette` — `plain`. `.lyra-cmdk` is a card of its own (background, border,
  radius, shadow); the stage must not wrap it in another card.
- `SidebarGroup` — `block`. It is a nav column that should own the width.
- `Dropdown` and `WorkspaceSwitcher` — the default `row` is right; they are compact
  triggers. (`.lyra-wssw` sets its own `min-width: 220px`.)

## Two rules specific to this lot

**Never pass `defaultOpen` in an example.** It exists for demos, but these popovers
are absolutely positioned: an example that renders open on page load drops its menu
over whatever section follows it. Let the reader open it. Say in the prose that the
prop exists and what it is for.

**Never pass `onOpen` to `CommandPalette` in an example.** `onOpen` is what installs
the global Command/Ctrl+K listener, and **this documentation site has its own command
palette on that exact shortcut** — an example that registers a second listener fights
the site's search. Document `onOpen` and `hotkey` in prose; make the visible example
`inline`, which renders just the panel with no overlay, portal, focus trap or scroll
lock, and is the only mode that shows well on a page.

## API facts — verified against the source, do not re-derive

**`Dropdown`** (`packages/react/src/dropdown/dropdown.tsx`) — `trigger: ReactNode`,
`items: DropdownItem[]`, `align?: 'start' | 'end'` (default `'start'`), `defaultOpen`.
`DropdownItem` is a union: a command `{ id?; label; icon?; danger?; onSelect? }`, or
`{ type: 'separator' }`, or `{ type: 'label'; label }`.

The wrapper renders the trigger inside a `span[role="button"]`, **not** a `<button>`,
and that is deliberate: consumers pass a `Button` or `IconButton`, and a button nested
in a button is invalid HTML that axe reports as `nested-interactive`. Say this — it is
the reason a consumer's own Button keeps working as a trigger.

Keyboard, from the source: on the trigger, `Enter`/`Space`/`ArrowDown` open with focus
on the first command and `ArrowUp` opens with focus on the last. Inside the menu,
`ArrowDown`/`ArrowUp` move and wrap, `Home`/`End` jump to the ends, `Escape` closes and
**returns focus to the trigger**, and `Tab` closes. Commands are `role="menuitem"` in a
`role="menu"`; the trigger carries `aria-haspopup="menu"`, `aria-expanded` and
`aria-controls`. Focus is real DOM focus here — contrast that with CommandPalette below.

The popup flips above the trigger when there is no room below (shared
`useFlipPlacement`, measured against `visualViewport`). Worth one sentence: it means a
menu near the bottom of a phone screen opens upward instead of scrolling the page.

**`SidebarGroup`** — `label?`, `items?: SidebarGroupItem[]`, `collapsible?`,
`defaultCollapsed?`, `onSelect?(id, item)`, `className?`, `children?` (rendered after
the items). `SidebarGroupItem = { id; label; icon?; badge?; active?; onSelect? }` — the
item's own `onSelect` runs before the group-level one; say that ordering.

Collapsible groups render the label as a `<button aria-expanded>`; a non-collapsible
group's label is not a button at all. `active` emits `aria-current="page"`. The chevron
is an empty `aria-hidden` span rotated in CSS. Known open finding you should NOT dress
up as intentional: the group label sits at `--text-faint`, which measures 2.45:1 — if
you have anything to say about the label, say what it is, not that it is pleasantly
subdued.

**`CommandPalette`** — the widest API in the lot. `open`, `onClose`, `onOpen`,
`onSelect(item)`, `groups?: CommandGroup[]`, `placeholder?` (default
`"Type a command or search…"`), `emptyMessage?` (default `"No results for"` — it is
shown **followed by the current query**, so it reads as a sentence opener, not a full
message; document that or a consumer will pass a complete sentence and get nonsense),
`hints?` (`{ navigate?, select?, close? }`, merged over defaults so a partial object
works), `hotkey?` (default `'k'`), `inline?`, `className?`.

`CommandGroup = { label?; items: CommandItem[] }` and
`CommandItem = { id; label; icon?; hint?; shortcut?; onSelect? }`. `hint` is secondary
text that is **also matched by the filter**; `shortcut` is display-only, keys separated
by spaces. The item's own `onSelect` runs before the palette-level one.

Focus model — this is the part to get right, and it differs from Dropdown: DOM focus
**stays in the search input**, which is a `role="combobox"` with `aria-expanded`,
`aria-controls`, `aria-autocomplete="list"` and `aria-activedescendant` pointing at the
active `role="option"`. That is the APG activedescendant pattern: arrow keys move the
_virtual_ focus while typing keeps working. Options live in a `role="listbox"`, and
groups are `role="group"` labelled by their heading.

Modal mode portals the panel, adds an overlay, traps focus, locks scroll, stays mounted
after `open` goes false so its exit motion can play, and restores focus to whatever
opened it. `inline` does none of that and renders just the panel.

The modal dialog is named `"Command palette"`, and the optional `aria-label` prop
overrides it — added specifically so a localized interface can announce the palette in
its own language, which this documentation site now does. Document that prop: it is the
one piece of the API a bilingual consumer must know about. Inline mode is not a dialog
and carries no name.

**`WorkspaceSwitcher`** — `workspaces?: Workspace[]` where
`Workspace = { id; name; plan?; members? }`, `current?` (defaults to the first
workspace), `onChange?(id, workspace)`, `onCreate?` (its presence is what adds the
create action to the popover), `createLabel?` (default `"Create workspace"`),
`defaultOpen?`.

It is a listbox, not a menu: trigger with `aria-haspopup="listbox"` / `aria-expanded` /
`aria-controls`, a `role="listbox"` labelled by the trigger, and `role="option"` with
`aria-selected` per workspace. The create action is another option below an
`<hr role="presentation">`. Keyboard is the same model as Dropdown — Enter/Space/Down
open at the first option, Up opens at the last, arrows wrap, Home/End, Escape closes and
restores focus, Tab closes — and it flips upward on the same rule.

## Cross-references you should make

`Dropdown` vs `CommandPalette` (a short menu of commands attached to one control vs a
searchable index of everything, reached by keyboard from anywhere). `Dropdown` vs
`WorkspaceSwitcher` (a menu of actions vs a listbox that reports a current selection —
the ARIA differs because the meaning differs). `SidebarGroup` vs `Tabs` (persistent
site structure vs peer views inside one page). `CommandPalette` inline vs modal.
Tabs, Pagination, Breadcrumb, Table and FileManager all have pages already — read
before contradicting.

## Definition of done

All of `.batuta/brief-phase06b-fanout.md` § "Verify before you report done", plus:
state in your report which of the 4 pages you could not verify visually. Do not commit
— the reviewer commits after opening every page in the dev server.

Lessons from earlier lots, each of which cost a round:

- Do not leave workflow scaffolding anywhere in the repo (a `.superpowers/` directory
  or similar). Prettier lints the whole tree and `pnpm lint` fails on it even when git
  ignores it.
- No third-party URLs in examples. Zero runtime requests to third parties is a project
  constraint.
- `'use client'` is required whenever an example holds state or a handler — in this lot
  that is effectively every example.
