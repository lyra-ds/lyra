# Lot 4 — navigation A

Follow `.batuta/brief-phase06b-fanout.md` in full. It is the contract; this file
only names your lot and pins the facts you would otherwise have to guess.

Lots 1 (forms), 2 (display) and 3 (data) are already merged and are additional
reference pages next to the four in the shared brief. Match them. Read
`file-manager.mdx` in particular: it is the closest page to this lot in tone, and
it documents a breadcrumb of its own that you must not contradict.

## Your components (4)

| slug         | props.json `name` | `group`      |
| ------------ | ----------------- | ------------ |
| `breadcrumb` | `Breadcrumb`      | `navigation` |
| `tabs`       | `Tabs`            | `navigation` |
| `pagination` | `Pagination`      | `navigation` |
| `stepper`    | `Stepper`         | `navigation` |

Append them to `apps/docs/lib/components.ts` in that order, after the existing
entries. `navigation` already exists in `ComponentGroup`, `groupOrder` and
`groupLabelKey`, and this lot gives it its first pages — do not touch the
taxonomy, only add the four entries.

## The stage layout prop

`<Example>` takes `layout="row" | "block" | "plain"` (default `row`, a wrapping
flex row). None of these four brings a card-like surface, so `plain` is wrong for
all of them. Use `block` — they are page-level bars that should span the stage.

**`Tabs` in particular breaks visibly on the default `row`**: `.lyra-tabs` carries
the `border-bottom` that defines the control, and as a flex item it shrinks to its
content, so the underline stops at the last tab instead of running the full width.
Every Tabs example is `block`.

## API facts — verified against the source, do not re-derive

**`Breadcrumb`** (`packages/react/src/breadcrumb/breadcrumb.tsx`) —
`items: BreadcrumbItem[]` where `BreadcrumbItem = { label: ReactNode; href?: string }`.
The **last item is always rendered as the current page** — a
`<span class="lyra-breadcrumb__current" aria-current="page">`, never a link, no
matter what `href` you pass it. Every earlier item is an `<a>`, and an omitted
`href` falls back to `'#'` (say that: it is a footgun for a trail built from
partial data). The separator is an **empty** `<span class="lyra-breadcrumb__sep"
aria-hidden="true">` drawn entirely in CSS — there is no separator character in the
DOM, so do not write one into the Plain HTML block's text. The wrapper is a
`<nav aria-label="Breadcrumb">`. There is **no `<ol>`/`<li>`**: it is a flat nav of
spans and anchors. Document what it emits, do not upgrade it in prose.

**`Tabs`** — `items: TabItem[]` where `TabItem = { id: string; label: ReactNode;
count?: number; icon?: ReactNode }`; `active: string` is **required and the component
is controlled only** — there is no `defaultActive`, so every example is
`'use client'` with `useState`. `onChange` fires on click _and_ on keyboard
navigation. `variant: 'line' | 'pills'` (default `'line'`).

The trap: **Tabs renders its own empty tab panels.** It returns a Fragment — the
`role="tablist"` div, then one `<div role="tabpanel" aria-labelledby=… hidden>` per
tab, all empty, because the handoff contract supplies tab labels only and no panel
content. `className`, `ref` and the rest go to the tablist, not the Fragment. The
page must say plainly what this means for a consumer: the component does not render
your content, you render it yourself, and the generated panel ids exist so you can
associate it. Do not write an example that pretends Tabs owns the panel content.

Keyboard model, from the source: roving `tabIndex` (only the active tab is
tabbable), `ArrowRight`/`ArrowLeft` wrap around, `Home`/`End` jump to the ends, and
navigation **activates automatically** — moving focus changes the active tab, it
does not merely preview it. That is the APG "automatic activation" pattern and it
is the right default for cheap panels; say so, and say what it costs when a panel
is expensive to render.

**`Pagination`** — `page` (one-based), `total`, `onChange(page)`. Controlled;
examples are `'use client'`. The truncation is fixed and worth documenting because
it decides how the control looks at scale: 7 pages or fewer render in full; at
`page <= 4` it is `1…5 … total`; at `page >= total - 3` it is `1 … total-4…total`;
otherwise `1 … page-1 page page+1 … total`. The gap is a
`<span class="lyra-page lyra-page--gap" aria-hidden="true">…</span>` — not a button.
Previous/next are `‹` and `›` with `aria-label="Previous page"` / `"Next page"`,
`disabled` at the ends. The active page carries `aria-current="page"`. The wrapper
is a `<nav aria-label="Pagination">`, and `aria-label` from the consumer overrides
that default — mention it, since a page with two paginated regions needs it.

Note for anyone writing a selector: **the first button in the nav is Previous, not
page 1.** A previous batch shipped an off-by-one test on exactly that.

**`Stepper`** — `steps: ReactNode[]` and `active` (zero-based index). Purely
presentational: no roles, no `aria-valuenow`, nothing interactive; the only ARIA it
emits is `aria-current="step"` on the active step. Steps before `active` are
`.lyra-step--done` and replace their number with a check `<svg aria-hidden="true">`;
steps after it show `index + 1`. A `.lyra-step__line` sits between steps and is
`--done` when `index <= active`. Because it is inert, the page must be explicit that
the surrounding flow owns the actual navigation and the announcement of a step
change — a Stepper alone tells a screen-reader user nothing when the step advances.

## Cross-references you should make

`Breadcrumb` vs `FileManager`'s own path bar (FileManager already ships a
breadcrumb driven by `path` + `onNavigate` for browsing inside itself; Breadcrumb is
for the page's position in the site — its page is written, read it first and do not
contradict it). `Tabs` vs `Dropdown` (a few peer views in view at once vs a list of
commands folded away). `Pagination` vs `Table` (Pagination is what sits under a
table of records) and vs loading more in place. `Stepper` vs `Progress` (a named
sequence a person moves through vs an unnamed fraction of work) — Progress has no
page yet, so name it in prose without implying a link.

## Definition of done

All of `.batuta/brief-phase06b-fanout.md` § "Verify before you report done",
plus: state in your report which of the 4 pages you could not verify visually.
Do not commit — the reviewer commits after opening every page in the dev server.

Three lessons from earlier lots, each of which cost a round:

- Do not leave workflow scaffolding anywhere in the repo (a `.superpowers/`
  directory or similar). Prettier lints the whole tree and `pnpm lint` fails on it
  even when git ignores it.
- No third-party URLs in examples — no avatar services, no placeholder-image hosts,
  no icon CDNs. Zero runtime requests to third parties is a project constraint.
- `'use client'` is required whenever an example holds state or a handler. In this
  lot that is Tabs and Pagination always, and Stepper or Breadcrumb whenever your
  example drives them from a control.
