# Lot 6c-c/3 — Theming/Tokens and Community

Sits on top of `.batuta/brief-6cc-landing.md` — the honesty rules, the `.lw-*` cut criterion,
the conventions, the gates, the evidence contract and the boundaries in it apply unchanged.
Read it first, in full.

## Goal

Add the landing's fourth and fifth sections: the theming/white-label pitch and the community
section. **Neither exists in the handoff kit** — they are specified here in prose, with every
fact already verified against the repo.

They go in `apps/site/app/[lang]/page.tsx` after `<Frameworks />`, each in its own file under
`apps/site/components/sections/`, following the shape lot 2 established:

1. **Theming** — `<section id="theming" className="lw-section lw-section--alt">`
2. **Community** — `<section id="community" className="lw-section">`

The header already links `#theming`. It does not link `#community`; that is intentional, and
the id is there for direct linking.

## The numbers — this is the heart of this lot

The kit's copy says **"209 tokens semânticos"**. That number is wrong three times over, and I
verified each one against `tools/parity/baseline.json`:

| What the repo actually holds                                    | Count   |
| --------------------------------------------------------------- | ------- |
| Token **declarations**                                          | **209** |
| Unique token **names**                                          | **153** |
| Of those, palette primitives (`--indigo-500`, `--slate-100`, …) | **43**  |
| **Semantic** tokens (the rest)                                  | **110** |

So 209 counts _declarations_, not tokens — a token declared once for light and again for dark
counts twice. And "semantic" excludes the 43 raw palette values. The honest number for the
sentence "N semantic tokens control colour, type and spacing" is **110**.

(The map claims a `--border-input` takes the total to 211. That token **does not exist** in
`packages/styles`. Ignore the claim.)

### Read the numbers, never type them

Add `apps/site/scripts/derive-stats.mjs`, run as the app's `prebuild` (mirroring how
`apps/docs` runs `scripts/copy-llms.mjs`). It reads:

- `tools/parity/baseline.json` → `tokens.byName` for the name/primitive/semantic split, and
  `classes.count` for the CSS class count.
- `tools/docgen/output/props.json` → the documented component count.

and writes `apps/site/lib/generated/stats.json`. The section imports that.

**The script must fail loudly.** If a source file is missing or a count comes out zero, throw
and stop the build. A silently-zero number on the page is worse than the hardcoded one we are
replacing — at least the hardcoded one was visibly wrong.

Add `apps/site/lib/generated/` to `.gitignore` (a generated artifact, like the docs'
`llms.txt`), and derive the primitive/semantic split in the script, not in the component —
the component renders a number, it does not decide what counts as semantic.

## Theming section

Two columns. Left: the eyebrow, the `h2`, a short paragraph, and three checks. Right: a
`CodeBlock` showing the white-label file.

### The three checks

Use the kit's `.lw-checks` / `.lw-check` (real — `handoff/ui_kits/website/index.html` lines
113–117; the check icon takes `--success`). Each is a verified capability:

1. **Light and dark from one attribute.** `packages/styles/tokens/colors.css` switches the
   whole palette under `[data-theme="dark"]`.
2. **White-label in four tokens.** `packages/styles/tokens/brand.css` derives the entire
   accent ramp — `--accent`, `--accent-hover`, `--accent-active`, `--accent-soft`,
   `--accent-soft-text`, `--on-accent` — from exactly four inputs: `--brand`,
   `--brand-contrast`, `--brand-radius`, `--brand-font`.
3. **`compat-shadcn` as an opt-in layer.** It is a real subpath export
   (`@lyra-ds/styles/compat-shadcn.css`) and it is deliberately **not** imported by
   `styles.css`. Say "opt-in", and do not imply it is on by default.

### The code panel

Show the white-label override, and **use the same shape as the existing guide** —
`apps/docs/content/docs/en/guides/white-label.mdx` lines 34–41 — so the landing and the docs
do not teach two different things:

```css
html[data-brand='harbor'] {
  --brand: #0d9488;
  --brand-contrast: #ffffff;
  --brand-radius: 12px;
  --brand-font: 'Plus Jakarta Sans', system-ui, sans-serif;
}
```

`CodeBlock` with `language="css"`. **Wrap the lines in a `<code>` element** — that is what the
line-number counter resets on; lot 2 lost a round to exactly this. Copy labels come from the
message files, as always.

### The copy

The lead sentence carries the real number and the contrast that makes it a pitch: **110
semantic tokens** control colour, type and spacing, and re-branding needs **four** of them.
That contrast is true, verifiable, and stronger than the inflated number it replaces.

## Community section

Title: **"Built in the open" / "Feito no aberto"**, with the line the plan fixes: no paid
plan, no paywall — Lyra moves by contribution, and the whole core is MIT.

Three cards. **Every destination below is verified to exist**, except where noted:

| Card             | Destination                                                                                    | Verified                                   |
| ---------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Contribute       | `https://github.com/lyra-ds/lyra/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22` | label `good first issue` exists            |
| Discuss          | `https://github.com/lyra-ds/lyra/discussions`                                                  | **being enabled by the owner** — see below |
| Improve the docs | `https://github.com/lyra-ds/lyra/blob/main/CONTRIBUTING.md`                                    | file exists at repo root                   |

**The repository is `lyra-ds/lyra`, not `lyra-ds/lyra-ds`.** Getting this wrong ships three
dead links.

**On Discussions:** it was disabled when this lot was written; the owner is turning it on. Build
the card. If the URL still 404s when you check, **report that** — do not silently swap the link
or drop the card.

Use `Card` from `@lyra-ds/react` for each, with an `Icon` in a small tile. `.lw-comm__icon` has
no original in the handoff — the map already established that — so design it as a plain square
tile using tokens: soft accent background, accent-coloured icon, `--radius-md`.

## New `.lw-*` rules

- `.lw-theming` — two-column grid, collapsing to one column under 900px, matching the
  breakpoint lot 2 used for `.lw-fw-grid`.
- `.lw-checks`, `.lw-check`, `.lw-check--muted` — from the handoff `<style>` block, verbatim.
- `.lw-comm-grid`, `.lw-comm`, `.lw-comm__icon`, `.lw-comm__title`, `.lw-comm__desc` — yours,
  built from tokens.

## Acceptance criteria

1. Both sections render on `/en` and `/pt-BR`, every visible string from the message files.
2. `#theming` scrolls from the header link; `#community` exists as a target.
3. **No number is typed into a string.** Every count on the page comes from
   `lib/generated/stats.json`, which comes from the two real sources. Show the generated file's
   contents in your report.
4. `derive-stats.mjs` throws when a source is missing or a count is zero — prove it by
   temporarily pointing it at a missing file, showing the failure, and restoring.
5. The page says **110** semantic tokens (or whatever the script derives — if your derivation
   disagrees with 110, do not "fix" it to match this brief; report the discrepancy and show
   your arithmetic).
6. The theming code panel matches the white-label guide's snippet, and its line numbers read
   1, 2, 3, … — confirmed by looking at the rendered block.
7. All three community links resolve (HTTP 200). Report the status you got for each. A 404 on
   Discussions is reported, not worked around.
8. `axe.run` clean on both locale pages in both themes.
9. Still exactly one `<h1>`; both new titles are `h2`.
10. Two columns above 900px, one column below — measured in a browser.
11. The four CI jobs' commands run, with real output reported and anything unrunnable named.

## Boundaries

- **Do not touch `packages/`** — no new token, no CSS change, no changeset.
- Do not touch `apps/docs/`.
- Do not build FAQ, CTA or the CookieBanner — lot 4 and lot 5.
- Do not change the Hero, showcase, frameworks, header or footer.
- Do not commit `lib/generated/` — gitignore it.
- Do not commit, branch or push.
