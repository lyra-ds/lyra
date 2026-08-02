# Lot 6c-c/6 — retry

The metadata work is correct and I verified it: title, description, canonical, `hreflang` with
`x-default`, OG and Twitter tags render on both locales; the OG image is a real 1200×630 PNG in
`out/`; `robots.txt` and `sitemap.xml` are emitted and well-formed; `axe.run` is clean on all
four routes in both themes; the message-key sets match.

**Five defects, all found by doing the two things your sandbox could not: serving the export
_with_ `_headers` applied, and measuring at 375px.** None of them is your fault for not
catching — they are the reason the sweep exists.

## 1. The CSP breaks the design system's own icons

Serving with `_headers` applied, the landing logs:

```
Refused to load the image 'data:image/svg+xml;utf8,<svg …><path d="m6 9 6 6 6-6"/></svg>'
because it violates the following Content Security Policy directive: "img-src 'self'".
```

That chevron is not a site asset. **`packages/styles` embeds SVG data URIs** — grep it:
`navigation.css`, `forms.css` and `display.css` all do. So `img-src 'self'` silently strips
chevrons and select arrows from every Lyra component that draws one.

Fix: `img-src 'self' data:`.

This is worth a sentence in `DEPLOY.md` under the CSP section, because it is not a quirk of
this site: **any consumer who applies a self-only CSP to a Lyra UI needs `data:` in `img-src`.**
Say that.

Everything else in the policy stays as it is. Do not add any external origin.

## 2. The page scrolls sideways at 375px — by 114px

Measured on `/en` at 375px wide. All four routes overflow: `/en` 114px, `/pt-BR` 66px,
`/en/privacy` 13px, `/pt-BR/privacy` 55px.

Three separate causes, measured:

**a. The framework grid never reaches one column.** `.lw-fw-grid` is `repeat(4, 1fr)` and
collapses to `1fr 1fr` at 900px — and stops there. Two 182px cards plus the gap do not fit in
375px; the cards land at `right=489`. Add a step to a single column. Pick the breakpoint from
where two columns actually stop fitting, not from a round number you like.

**b. The code block widens its own column instead of scrolling.** `code` and `span.line`
measure 508px wide inside a 375px viewport, at `right=553`.

This is the classic CSS grid/flex overflow: **a grid or flex item's default minimum size is its
content, not zero**, so `.lyra-code__pre`'s `overflow-x: auto` never engages — the column grows
instead. The fix is `min-width: 0` on the item that contains the code block (the theming
section's grid child), in `apps/site/app/site.css`. Do **not** change the component's CSS in
`packages/styles`.

**c. The header nav overflows slightly.** `a.lyra-navlink` sits at `right=388`. Decide how the
nav behaves in a narrow viewport — wrapping is acceptable, so is hiding the section links and
keeping brand plus actions. Whatever you choose, no horizontal scroll and nothing clipped.

## 3. Touch targets under 44px

At 375px with a coarse pointer, 14 targets on the landing and 9 on the policy page measure
under 44px: the theme toggle at 40px, the "Documentation" button at 32px, the showcase tabs at
40px, the preview buttons at 40px, the footer links at 20px.

`apps/docs/app/site.css` already solves this — read its `@media (pointer: coarse),
(any-pointer: coarse), (max-width: 1180px)` block, including the comment explaining why
`any-pointer` and the width clause are both needed (an iPad in desktop mode reports
`pointer: fine`).

Mirror that approach in `apps/site/app/site.css` for this site's interactive chrome: the theme
toggle, the locale segments, the nav links, the header CTA, the tabs, the consent buttons and
the footer links.

**Two things not to do.** Do not pad links that sit inside a sentence of prose — inline links
in running text are exempt, and padding them wrecks the line box. And do not restyle Lyra
components to achieve this: raise the target with spacing on the site's own wrapper, or report
that a component cannot reach 44px without a change in `packages/`, which would be a finding
for its own lot.

## 4. Re-verify the way I did

Your report's honesty about what you could not run is exactly right, and I ran it for you. For
this retry, at minimum re-check what you changed:

- Serve `out/` with the `_headers` policy actually applied — not a plain static server — and
  confirm zero CSP violations in the console on all four routes.
- Measure at 375px: `document.documentElement.scrollWidth - clientWidth` must be `<= 0` on all
  four routes, and report the remaining sub-44px targets with their measured heights.

If the browser still cannot start in your sandbox, say so plainly as before and I will re-run
it. Do not report these as passing on inspection.

## Acceptance

1. Zero CSP violations on all four routes, served with `_headers` applied.
2. `img-src` allows `data:`, no external origin is added anywhere, and `DEPLOY.md` explains
   that Lyra's own CSS needs `data:`.
3. No horizontal scroll at 375px on any of the four routes.
4. The remaining sub-44px targets are only inline links inside prose; everything else reaches
   44px under a coarse pointer.
5. `pnpm run lint`, `run typecheck`, the site build and the site tests pass; report output.

## Do not change

The metadata, the OG image, `robots.ts`, `sitemap.ts`, the message files, the seven sections'
content, the privacy copy or the consent wiring. This retry is layout and policy only.

Do not touch `packages/`. Do not commit, branch or push.
