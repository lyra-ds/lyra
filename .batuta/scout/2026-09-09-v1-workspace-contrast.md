## Answer

1. **Additive CSS/parity entry for the `.lyra-wssw__meta` repair (4.34:1 → pass):** two-part, mirroring the `.lyra-kbd` precedent (same `--text-muted`-on-`--surface-sunken` pair, "4.34:1", repaired to `--text-secondary`):
   - CSS: a new additive-extension block at the end of `packages/styles/components/navigation/navigation.css` (after the handoff-verbatim region, where cascade order decides) restating the selector: `.lyra-wssw__meta { color: var(--text-secondary); }`. The package CSS must stay a declaration-level copy of the handoff, so an override cannot edit the original rule (lines 275–276); it restates the selector and wins on cascade order.
   - Parity: add the exact class name `lyra-wssw__meta` to `ADDITIVE_EXTENSIONS['components/navigation/navigation.css'].classes` in `tools/parity/parity.mjs` (beside the existing `lyra-wssw__item` / `lyra-wssw__trigger`). Without it, the new rule has no handoff counterpart and `diffFile` fails "Extra declaration … no handoff counterpart"; `isAdditiveExtension` matches only exact class names in the allowlist. No baseline regen: `lyra-wssw__meta` already exists on both sides, so the class inventory is unchanged.

2. **No — `toggleAttribute('data-theme', true)` does not activate dark colors.** `toggleAttribute(name, true)` adds the attribute with an empty value (`<html data-theme="">`); the dark token block keys on the exact-value selector `[data-theme="dark"]`, which does not match an empty value. The `dark` iteration of the theme loop in the browser test therefore renders the light palette (making its axe pass vacuous); the `afterEach` `removeAttribute('data-theme')` corroborates the presence-based misunderstanding. Dark activation requires `setAttribute('data-theme', 'dark')`.

3. **Narrow deterministic hover scope** (component-local, Browser Mode/chromium only — jsdom applies zero CSS per `.claude/CLAUDE.md`): exactly the two wssw hover declarations, asserted via `userEvent.hover(...)` + `getComputedStyle` in `workspace-switcher.browser.test.tsx`, both themes after the `setAttribute` fix:
   - `.lyra-wssw__trigger:hover` → `border-color` becomes `var(--border-strong)`
   - `.lyra-wssw__item:hover` → `background` becomes `var(--surface-sunken)`
   Exclude: the `:active` transform / tap-highlight block (unconditional, not hover), and non-wssw hover repairs (`.lyra-sbgroup__label--btn:hover`, `.lyra-tab--active:hover`, etc.) — out of component-local scope.

## Files (path:line)

- packages/styles/components/navigation/navigation.css:275-276 — `.lyra-wssw__plan, .lyra-wssw__meta { … color: var(--text-muted); }` (handoff-verbatim rule to override)
- packages/styles/components/navigation/navigation.css:545-549 — stylelint-documented additive-override pattern (restate selector, win on cascade order)
- packages/styles/components/navigation/navigation.css:654-659 — `.lyra-kbd` precedent: identical 4.34:1 pair repaired to `--text-secondary`
- packages/styles/components/navigation/navigation.css:265,313 — the two wssw hover rules (narrow hover scope)
- packages/styles/tokens/colors.css:17,21,62,67,91 — `--slate-100: #F1F5F9`, `--slate-500: #64748B`, `--surface-sunken`, `--text-muted`, `[data-theme="dark"]` value selector
- packages/react/src/workspace-switcher/workspace-switcher.browser.test.tsx:15,21 — `removeAttribute('data-theme')` / `toggleAttribute('data-theme', theme === 'dark')`
- tools/parity/parity.mjs:474-504 — `ADDITIVE_EXTENSIONS['components/navigation/navigation.css']` (no `lyra-wssw__meta` entry)
- tools/parity/parity.mjs:552-562,1007-1016 — `isAdditiveExtension` exact-name match; "Extra declaration" failure branch
- .claude/CLAUDE.md:41-42,84-86 — Browser Mode/chromium rationale (CSS + axe color-contrast only render there)

## Evidence (minimal snippets)

```css
/* navigation.css:275 */
.lyra-wssw__plan,
.lyra-wssw__meta { font-size: var(--text-xs); color: var(--text-muted); … }
/* navigation.css:654 — precedent, same pair */
the keyboard chip is `--text-muted` on `--surface-sunken` — 4.34:1 at 11px … the same repair
.lyra-kbd { color: var(--text-secondary); }
/* colors.css:91 */
[data-theme="dark"] {
```
```js
// workspace-switcher.browser.test.tsx:21
document.documentElement.toggleAttribute('data-theme', theme === 'dark');
// parity.mjs:485-503 (excerpt)
'lyra-wssw__pop--up',
… 'lyra-wssw__item',
'lyra-wssw__trigger',
// parity.mjs:1012 — unallowlisted package-only rule
`Extra declaration ${relPath} #${pIndex}: package has [${describe(pd)}] with no handoff counterpart`
```

## Uncertain

- Surface actually beneath `.lyra-wssw__meta` not directly verified: component source was outside the permitted file list. The recorded pair (#64748B on #F1F5F9 = 4.34, matching `--slate-500` on `--slate-100`) implies a sunken context; the `--text-secondary` repair follows the recorded ratio and the documented same-pair precedent, not my own placement measurement.
- Whether `.lyra-wssw__plan` needs the same color: it shares the rule at 275–276, but on `--surface-card` muted is ~4.76:1 (passing) and it is not implicated by the recorded violation — repair kept scoped to `__meta` per "metadata" task wording.
- Dark-activation conclusion rests on `colors.css` (only token file read); other token layers (base/effects) were not read, but the canonical dark override block uses the exact-value `[data-theme="dark"]` selector, which alone decides the question.
- Exact hover-assertion mechanics (locator vs `getComputedStyle` on `document.documentElement`-themed cascade) not verified against existing test helpers in this repo — `internal/test-axe` and sibling tests were not read.
