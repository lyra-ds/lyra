# Retry 2 — Lote 1: o preview isolado demonstra o oposto do que documenta

The isolation works. **Do not undo it.** One consequence of it needs solving.

Files: `.batuta/lot-6cb3-01-layout-retry.md`, `.batuta/lot-6cb3-01-layout.md`,
`.batuta/brief-6cb3-docs.md`, `.batuta/brief-phase06b-fanout.md`.

## What I verified independently and accepted

**axe is back to zero** on all ten pages, at 1440px and 375px, in both locales — including
`frame-title`, which the iframes satisfy with a translated title ("Live preview" / "Prévia ao
vivo"). Theme mirroring works in both directions: flipping `data-theme` on the host changes
the iframe's `<html>` and its body background follows (`rgb(248,250,252)` → `rgb(14,16,35)`).
Stylesheets reach the frame. `ResizeObserver` sizes it — heights differ per example and per
viewport, so it is really measuring.

And the property that mattered most held: **the code panel prints pure consumer code**, with
no iframe and no wrapper.

## The defect: the Shell preview renders its collapsed layout, always

Measured inside the frame on the `shell` page, host viewport 1440px:

```
iframe width (inner):  650px
.lyra-shell columns:   602px          ← one column
aside display:         none
```

The Shell's responsive contract — which this very page documents — hides the aside below
1100px and stacks the sidebar below 900px. The frame is 650px, so **both collapse**. The
flagship example of the page is showing the narrow-screen layout and never the three-rail
layout it exists to explain. A reader on a 1440px screen sees a stacked column and concludes
that is what `Shell` does.

The isolation did not cause the responsive contract; it removed the frame's access to the
host's width. Both facts are fine on their own — together they make the demo wrong.

## What to fix

The isolated preview must be able to render at a **layout width of its own**, independent of
the column it sits in, so a component whose behavior is viewport-driven can be shown doing
the thing it is documented to do.

The outcome to reach, which is what I will check:

- On the `shell` page at a desktop host viewport, the `docs-site` example renders with
  **three rails visible** — sidebar, content and aside — not a stacked column.
- The `application` example likewise shows its intended configuration.
- The preview still fits the prose column: it must not overflow the page or introduce
  horizontal scrolling at any viewport.
- Auto-height still works, and still accounts for whatever technique you use.
- Theme mirroring, the translated frame title, and the untouched code panel all survive.
- axe stays at **zero** on all ten pages, at 1440px, 900px and 375px, both locales.

The usual technique is to give the frame a wide inner width and scale it down visually to fit
the column, so the media queries inside see the wide viewport. You may choose otherwise —
state what you chose and why.

**Say it in the page.** A preview shown at a width the reader is not actually using is
misleading unless the page says so. One sentence, both locales.

## A judgment call I am leaving to you, with the trade-off named

`Shell` is one of the few components whose *whole point* is what happens at different widths.
A single fixed-width preview shows one state and hides the contract.

If you can show the collapse — two frames at different widths, or one that the reader can
change — that is a better page, and this is the component that most justifies it. If it costs
more than it returns, one honest wide preview plus the breakpoints in prose is acceptable.
Decide, implement one, and say which and why. Do not half-build the interactive version.

## Acceptance

1. The three-rail layout is visible in the `docs-site` example at desktop. Report the measured
   `grid-template-columns` and the aside's `display` from inside the frame.
2. No horizontal overflow on any of the ten pages at 1440/900/375.
3. axe at zero across the ten pages, three viewports, both locales.
4. The page states that the preview renders at a fixed layout width, in both locales.
5. Theme mirroring, frame title, auto-height and the consumer-code panel all still hold.
6. `pnpm typecheck`, `pnpm lint`, `pnpm build` pass with real output.

## Boundaries

`packages/` stays read-only — the breakpoints are the component's contract and are not to be
changed for the docs' convenience. Do not touch Lot 2's or Lot 3's components. Do not commit,
branch or push.
