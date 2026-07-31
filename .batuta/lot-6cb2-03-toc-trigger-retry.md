# Retry — Lote 3: o scroll spy fica em branco no topo e no fim da página

Your work is in the tree and nearly everything is right. **Do not start over.** One defect.

Original brief: `.batuta/lot-6cb2-03-toc-trigger.md`, shared brief
`.batuta/brief-6cb2-chrome.md`.

## What I verified independently and accepted

**The critical bug this lot existed to fix is fixed.** axe on the built docs is now
**completely clean** at 1440px, 900px and 375px in both `en` and `pt-BR` — the
`button-name` violation on the old `.lw-search` is gone, and the trigger keeps its
accessible name ("Search…") at 375px where the visible label is hidden.

Also verified: 485 React tests and 59 styles tests pass; parity with the tripwire;
`docgen --check` at 51 components; `lint:css`, eslint, typecheck, build; `size-limit` with
`CommandPalette` at 8.49 kB under its unchanged 9 kB budget; `baseline.json` untouched;
**the orphan sweep is empty**; ⌘K opens the palette and so does clicking the trigger; the
`.lw-header__cta` is still correctly hidden at 375px; `aria-current="location"` is applied
to the active anchor exactly as specified.

## The defect: no active item at the top or the bottom of the page

Measured on the built docs, desktop:

```
page top (scrollY=0):        active = null
page bottom (scrollTo end):  active = null
mid-scroll:                  active = "Accessibility"   ← correct
```

Visually, the rail at the top of the page now shows every entry in the same muted colour,
with no indigo highlight and no accent border segment. Before this lot, "Examples" — the
first heading — was highlighted on load.

The cause is that the rail is driven **only** by `IntersectionObserver` with
`rootMargin: '0px 0px -70% 0px'`. That band is the top 30% of the viewport, and it is empty
in exactly two situations:

- **at the top of the page**, before any heading has scrolled up into the band;
- **at the bottom**, where the document runs out of scroll and the last headings can never
  reach the band.

The previous implementation avoided the first case by seeding the active id with the first
heading (`setActive(parsed[0]?.id ?? '')`). Nothing covers the second case, in either
version — but it is just as visible, and the reader who has scrolled to the end is precisely
the one looking for where they are.

These are the two positions a reader occupies most often. A contents rail that highlights
nothing there reads as broken.

## What to fix

`useScrollSpy` must always resolve to an item once the ids exist and the document has been
laid out — never `undefined` because the observation band happens to be empty. Two boundary
behaviors to get right:

- At the top of the document, the **first** item is active.
- Once scrolled past the last heading that can enter the band, the **last** item stays
  active rather than going blank.

Between those, keep the current behavior: the topmost heading inside the band wins.

How you achieve it is yours — the observer callback can fall back to the nearest heading
above the viewport, or the hook can compute from scroll position when nothing intersects.
State what you chose and why, and keep it SSR-safe and cleanup-safe as before.

## Acceptance

1. On the built docs at desktop width: an item is active at `scrollY = 0`, an item is active
   after `window.scrollTo(0, document.body.scrollHeight)`, and the active item tracks the
   section while scrolling in between. Report the three measured values.
2. The same holds with only two headings, and with headings shorter than one viewport.
3. Browser tests cover **all three** positions — top, middle, bottom — and fail if the hook
   returns nothing. Prove they are not vacuous: make the hook return `undefined`
   unconditionally, watch those tests fail, restore, watch them pass. Report both outputs.
4. `aria-current="location"` and the active class continue to move together.
5. Everything already green stays green: full suite, parity, `docgen --check`, `lint:css`,
   eslint, typecheck, build, `size-limit`, empty orphan sweep, `baseline.json` untouched, and
   **axe clean at 1440/900/375 in both locales** — do not regress the fix this lot delivered.

## Boundaries

Unchanged. `CommandPalette.Trigger` and the trigger CSS are correct — leave them. Do not
touch `Shell`, `Navbar`, `NavLink` or `Footer`. Do not commit, branch or push.
