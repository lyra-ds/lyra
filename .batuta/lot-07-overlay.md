# Lot 7 — overlay (the last one)

Follow `.batuta/brief-phase06b-fanout.md` in full. It is the contract; this file
only names your lot and pins the facts you would otherwise have to guess.

Lots 1–6 are merged. Read `dialog.mdx` and its example files first: both components
in this lot are overlays and take exactly that trigger-driven shape. Read `toast.mdx`
too — it shows how this project documents a second component inside a sibling's page,
which is what the AvatarGroup task below asks for.

This lot closes the fan-out: all 40 components will be documented after it.

## Your work (2 pages + 1 section)

| slug                      | props.json `name`       | `group`   |
| ------------------------- | ----------------------- | --------- |
| `drawer`                  | `Drawer`                | `overlay` |
| `create-workspace-dialog` | `CreateWorkspaceDialog` | `overlay` |

Append them to `apps/docs/lib/components.ts` in that order, after the existing
entries. Do not touch the taxonomy.

**Plus:** `AvatarGroup` is exported and has no documentation anywhere. It gets **no
page of its own** — add a section to the existing `avatar.mdx` (both languages) with
one example, the same way `ToastStack` is documented on the Toast page. Register that
example under the `avatar` slug.

## The rule that shapes this lot

Both components are **portaled, fixed overlays with a focus trap and a scroll lock**.
Mounting one in an example would take over the documentation page. Every example is
trigger-driven: a `Button` that sets state, exactly like `dialog/basic.tsx`. Never
render either with `open` hard-coded to `true`.

The stage layout is the default `row` — what sits in it is only the Button.

## API facts — verified against the source, do not re-derive

**`Drawer`** — `open` (required), `onClose?`, `title` (required — it is the drawer's
accessible name, not decoration), `footer?` (omit and the footer chrome disappears
entirely), `container?` (portal host, defaults to `document.body`), `children`.
Extends `Omit<HTMLAttributes<HTMLDivElement>, 'title'>`, so `title` is the heading,
never the HTML tooltip attribute.

It portals, renders `role="dialog"` with `aria-modal="true"` and `aria-labelledby`
pointing at the header, traps focus, locks body scroll, and closes on Escape, on the
close button, and on a backdrop click. Say plainly that **the backdrop is a
pointer-only convenience** — the source says so, and the keyboard path is Escape or
the close button. The close button's accessible name is the hard-coded English string
"Close"; there is no prop for it, so document it as a limitation rather than an
option. It slides in from the right edge.

**`CreateWorkspaceDialog`** — `open?` (default `false`), `onClose?`,
`onCreate?({ name, slug })`, `title?` (default `"Create workspace"`), `slugPrefix?`
(default `"lyra.dev/"`). Note it does **not** extend `HTMLAttributes`: no `className`,
no `ref`, no spread props. That is unusual for this system and worth one line.

It is a composed component, not a primitive: Dialog + Avatar + Input + Button. The
behaviour to document, because nothing else in the system does it:

- The slug **follows the name automatically until the reader edits the slug**, and
  then stops following forever. That "touched" rule is the whole interaction.
- `slugify` lowercases, strips accents through NFD normalisation, replaces every run
  of non-alphanumerics with a single hyphen, and trims hyphens from the ends. So
  "Ação Global" becomes "acao-global" — worth showing, since a system aimed at
  Brazilian products will meet accented names on day one.
- Every closed→open transition resets name, slug and the touched flag, so a reopened
  dialog is always blank.
- The create button is disabled until the name has non-whitespace content, and the
  submitted name is trimmed.
- The avatar preview is built from the name's initials and updates as you type.

**`AvatarGroup`** — `children` only, plus standard span attributes. It renders
`.lyra-avatar-group`, which overlaps its children. Document what it is for (a set of
people on one row) and what it does not do: there is no "+3 more" overflow behaviour,
no maximum, and no accessible name of its own — a group of avatars with no
surrounding text says nothing to a screen reader, so the consumer must label the
region or list the names.

## Cross-references you should make

`Drawer` vs `Dialog` (a side panel for a task you do alongside the page vs a centred
modal for a decision that blocks it — Dialog's page is written, read it first).
`Drawer` vs a route (a drawer keeps the page behind it; a full page does not).
`CreateWorkspaceDialog` vs `Dialog` (an opinionated instance vs the primitive you
compose yourself) and vs `WorkspaceSwitcher` (whose `onCreate` is what opens this
dialog in a real product — that page is written too).

## Definition of done

All of `.batuta/brief-phase06b-fanout.md` § "Verify before you report done", plus:
state in your report which pages you could not verify visually. Do not commit — the
reviewer commits after opening every page in the dev server.

Lessons from earlier lots, each of which cost a round:

- Do not leave workflow scaffolding anywhere in the repo (a `.superpowers/` directory
  or similar). Prettier lints the whole tree and `pnpm lint` fails on it even when git
  ignores it.
- No third-party URLs in examples. Zero runtime requests to third parties is a project
  constraint.
- `'use client'` is required whenever an example holds state or a handler — in this lot
  that is every example.
- Never let an example mount something that escapes its stage.
