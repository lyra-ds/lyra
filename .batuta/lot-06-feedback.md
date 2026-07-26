# Lot 6 — feedback

Follow `.batuta/brief-phase06b-fanout.md` in full. It is the contract; this file
only names your lot and pins the facts you would otherwise have to guess.

Lots 1–5 are merged and are additional reference pages next to the four in the
shared brief. Match them. Read `dialog.mdx` and
`apps/docs/components/examples/dialog/basic.tsx` first — two components in this lot
need exactly that trigger-driven shape, for the reason below.

## Your components (6)

| slug            | props.json `name` | `group`    |
| --------------- | ----------------- | ---------- |
| `alert`         | `Alert`           | `feedback` |
| `toast`         | `Toast`           | `feedback` |
| `progress`      | `Progress`        | `feedback` |
| `spinner`       | `Spinner`         | `feedback` |
| `tooltip`       | `Tooltip`         | `feedback` |
| `cookie-banner` | `CookieBanner`    | `feedback` |

Append them to `apps/docs/lib/components.ts` in that order, after the existing
entries. `feedback` exists in the taxonomy and this lot gives it its first pages.
Do not touch the taxonomy. `ToastStack` gets no page of its own — document it on
the Toast page, since it is the container Toast is meant to sit in.

## The rule that decides this lot: two of these are viewport-fixed

`.lyra-toast-stack` is `position: fixed` at the bottom-right of the viewport, and
`.lyra-cookies` is `position: fixed` at the bottom-center. Rendered inside an
example stage they do not stay in the stage — they float over the whole
documentation page, on top of whatever the reader is reading, on page load.

So **ToastStack and CookieBanner get trigger-driven examples**, exactly like
`dialog/basic.tsx`: a `Button` that sets state, and the fixed element mounts only
after the reader asks for it. Never mount either of them unconditionally.

`Toast` on its own is **not** fixed — `.lyra-toast` is a plain dark card — so a
Toast by itself sits happily in a stage. Show Toast statically, and use the
trigger-driven example to show it inside a real `ToastStack`.

CookieBanner has a second trap: it **persists the choice in `localStorage` and then
never returns**. A reader who clicks a button in your example destroys the example
for themselves, permanently, unless they clear the key. Two requirements: give each
example its **own `storageKey`** (never the default `'lyra-cookie-consent'`, which
belongs to the site itself), and have the example's own state bring the banner back
after a choice — the reader must be able to press the trigger again and see it.

## The stage layout prop

- `Toast` — `plain`. It is its own surface (a dark card in both themes).
- `Alert`, `Progress` — `block`. They are full-width bars.
- `Spinner`, `Tooltip` — the default `row`.
- `ToastStack` / `CookieBanner` trigger examples — `row`, because what sits in the
  stage is just the Button.

## API facts — verified against the source, do not re-derive

**`Alert`** — `tone?: 'info' | 'success' | 'warning' | 'danger'` (default `'info'`),
`title?`, `icon?` (normally `<Icon size={18} />`), `children` required. It extends
`Omit<HTMLAttributes<HTMLDivElement>, 'title'>`, so `title` is the bold first line,
not the HTML tooltip attribute. It always emits `role="status"`, including at
`tone="danger"` — `status` is a polite live region, so an alert that appears while
someone is typing is announced when they pause, not immediately. Document that
plainly; do not claim it is assertive. Alert has no dismiss affordance.

**`Toast`** — `tone?: 'info' | 'success' | 'danger'` (colors the icon only),
`icon?`, `onClose?`, `children` required. **The close button exists only when you
pass `onClose`.** `role="status"` again. The close button's accessible name is the
hard-coded English string "Close notification" and there is no prop to change it —
state that as a consumer limitation for localized applications, do not present it as
configurable.

**`ToastStack`** — takes `children` and nothing else; it is purely the fixed
bottom-right container. Newest-first ordering, spacing and stacking are its whole
job. Say that a Toast outside a stack is fine and positions wherever you put it.

**`Progress`** — `value` (0–100, clamped by the component) and `tone?: 'success' |
'danger'`. It emits `role="progressbar"` with `aria-valuenow/valuemin/valuemax` but
**no accessible name of its own**: a bare Progress is an unnamed progressbar. The
consumer must supply `aria-label` or `aria-labelledby` pointing at the visible
heading. That is the single most important line on the page — put it in
Accessibility and show it in at least one example.

**`Spinner`** — `size?: 'sm' | 'md' | 'lg'` (default `'md'`, 24px). It emits
`role="status"` and `aria-label="Loading"`, both applied after the spread props,
which means a consumer's own `aria-label` is discarded. Known defect, being tracked
separately: describe the name it announces, and do not tell readers they can change
it. A spinner announces "Loading" in English regardless of the app's language.

**`Tooltip`** — `tip: string` (a string, not a node) and `children`. The visible
bubble is drawn by CSS from a `data-tip` attribute — there is no DOM node holding the
visible text — while a separate `hidden` `<span role="tooltip">` carries the same
text for assistive technology, linked by an `aria-describedby` that the component
merges onto your child element. That is why `tip` must be a plain string, and why the
text is not selectable. It opens on hover **and** focus, and `Escape` dismisses it
(WCAG 1.4.13). Pass **one focusable element** as the child or there is no keyboard
path to it: a tooltip on a bare `<span>` is mouse-only. Show a correct one, and say
what happens if you do it wrong.

**`CookieBanner`** — `storageKey?` (default `'lyra-cookie-consent'`), `policyHref?`,
`onAccept?`, `onEssentials?`, `children?` (replaces the default LGPD copy). It reads
`localStorage` in an effect and returns `null` until it has, so it renders nothing on
the server and nothing on the first client paint — an intentional SSR guard worth one
sentence. It emits `role="region"` with `aria-label="Cookie notice"`. The default copy
is Brazilian LGPD wording; `children` is how a consumer replaces it.

## Cross-references you should make

`Alert` vs `Toast` (a message that stays in the page next to what it concerns vs one
that appears over the interface and leaves). `Alert` vs `EmptyState` (something went
wrong vs there is nothing to show — EmptyState's page is written, read it).
`Progress` vs `Spinner` (a known fraction vs an unknown wait) and `Spinner` vs
`Skeleton` (an indeterminate wait vs one shaped like the content that is coming —
Skeleton's page is written too). `Tooltip` vs a visible label (a tooltip is never the
only place a name exists).

## Definition of done

All of `.batuta/brief-phase06b-fanout.md` § "Verify before you report done", plus:
state in your report which of the 6 pages you could not verify visually. Do not
commit — the reviewer commits after opening every page in the dev server.

Lessons from earlier lots, each of which cost a round:

- Do not leave workflow scaffolding anywhere in the repo (a `.superpowers/` directory
  or similar). Prettier lints the whole tree and `pnpm lint` fails on it even when git
  ignores it.
- No third-party URLs in examples. Zero runtime requests to third parties is a project
  constraint.
- `'use client'` is required whenever an example holds state or a handler.
- Never let an example mount something that escapes its stage. In this lot that is
  ToastStack and CookieBanner; in earlier lots it was `defaultOpen` on popovers.
