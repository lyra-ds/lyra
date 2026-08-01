# Lote — tinta automática do white-label

Sits on top of the shared brief `.batuta/brief-6cb2-chrome.md`. Read that first, in full —
the project rules, the gates, the test laws and the evidence contract apply unchanged.
Ignore its "What 6c-b2 is" section; this is a separate task.

## Goal

Make the white-label contract carry a real contrast guarantee: derive `--on-accent` from the
resolved `--accent` instead of defaulting to white, so a consumer who sets only `--brand`
gets legible text on primary fills in both themes — in pure CSS, with no runtime.

## Context

### The problem, measured

`tokens/brand.css` today ends with `--on-accent: var(--brand-contrast, #FFFFFF)`. White ink
is right only for dark brand seeds. Measured in a real browser across 7 representative
seeds, white on the resolved `--accent`:

| seed             | light   | dark   |
| ---------------- | ------- | ------ |
| `#0D9488` teal   | 3.74 ✗  | 3.02 ✗ |
| `#FACC15` yellow | 1.53 ✗  | 1.43 ✗ |
| `#2563EB` blue   | 5.17 ✓  | 3.90 ✗ |
| `#84CC16` lime   | 1.98 ✗  | 1.78 ✗ |
| `#EC4899` pink   | 3.53 ✗  | 2.89 ✗ |
| `#1E3A8A` navy   | 10.36 ✓ | 7.03 ✓ |
| `#22D3EE` cyan   | 1.81 ✗  | 1.65 ✗ |

**5 of 7 fail AA in light, 6 of 7 in dark.** This is not a dark-mode bug; the white-label
path has never had a contrast guarantee.

### The chosen fix (decided — implement it, do not re-open)

Derive the ink from the accent's own lightness, using relative color syntax:

```css
[data-brand] {
  --on-accent: var(
    --brand-contrast,
    oklch(from var(--accent) clamp(0, (l / 0.58 - 1) * -infinity, 1) 0 h)
  );
}
```

Reading it: `l` is the resolved accent's oklch lightness. `(l / 0.58 - 1)` is negative below
the threshold and positive above; multiplying by `-infinity` and clamping to `[0, 1]` yields
lightness `1` (white ink) for dark accents and `0` (black ink) for light ones. Chroma is
forced to `0` so the ink is neutral, and `h` is carried through harmlessly.

Three properties that made this the choice:

1. **`--brand-contrast` still wins.** It stays the first argument of `var()`, so a consumer
   who wants to pin the ink still can. The contract does not lose an escape hatch, it gains
   a correct default.
2. **It self-adapts per theme with one declaration.** `--accent` is redefined in
   `[data-theme="dark"][data-brand]`, and the derivation reads whatever `--accent` resolved
   to. Do **not** add a second `--on-accent` declaration to the dark block.
3. **It degrades to today's behavior.** In an engine without relative color syntax the
   declaration is invalid at computed-value time and the property falls back — no broken
   page, just the current white ink.

### The threshold is measured, not guessed

`0.58` came from sweeping 18 brand seeds × 2 themes × 7 candidate thresholds:

| threshold | AA (4.5) failures | worst ratio |
| --------- | ----------------- | ----------- |
| 0.50      | 7/36              | 3.48        |
| 0.55      | 3/36              | 4.27        |
| **0.58**  | **1/36**          | **4.47**    |
| 0.62      | 6/36              | 3.74        |
| 0.65      | 9/36              | 3.09        |

Use `0.58`. Do not "improve" it without the same measurement.

### The one honest limit

At `0.58` a single seed lands just under AA: `#E11D48` (rose-600) in light, at **4.47** —
0.03 short. It is a crossover color, where neither ink clears 4.5 by much. At every
threshold tested up to 0.65, **all 36 combinations clear AA-large (3.0)**.

Do not hide this and do not cherry-pick the seed list to make it disappear. The guarantee to
state and test is: **AA-large always; AA for everything except enumerated crossover seeds.**

## Acceptance criteria

1. `tokens/brand.css` derives `--on-accent` exactly as specified, in the `[data-brand]`
   block only. No second declaration in the dark block. `--brand-contrast` still takes
   precedence.
2. `pnpm parity` passes. `brand.css` has a handoff counterpart, so this is a value change
   the gate will catch — pin it as an **approved, enumerated divergence** following the
   pattern established for the dark tokens (`DARK_FILL_CONTRAST_DIVERGENCES` in
   `tools/parity/parity.mjs`), with the canonical and approved values and a comment giving
   the reason. Regenerate the baseline if required and report the diff.
3. The tripwire still bites: a **different, unapproved** value for `--on-accent` in
   `brand.css` must still fail parity. Prove it — change it, run, confirm failure, restore,
   confirm pass. Report both outputs.
4. A test covers the guarantee, driven by data rather than restated numbers:
   - a list of brand seeds — include at minimum the 7 in the table above plus `#DC2626`,
     `#7C3AED`, `#059669`, `#F97316`, `#0EA5E9`, `#A16207`, `#BE185D`, `#111827`, `#E11D48`,
     `#65A30D`;
   - for each seed, in **both** themes: compute the WCAG ratio between the resolved
     `--on-accent` and the resolved `--accent`;
   - assert **≥ 3.0 for every single combination**, with no exceptions;
   - assert **≥ 4.5 for every combination except an explicitly enumerated
     `KNOWN_BELOW_AA` list**, which must contain `#E11D48` in light and nothing that is not
     genuinely below;
   - assert the entries in that list are still **≥ 4.4**, so a real regression there still
     fails instead of hiding behind the exemption.

   `packages/styles/tests/brand-theme.test.ts` already has a canvas-based `parseColor` that
   resolves any color notation — including the `oklab(...)` and `color(srgb …)` forms these
   derivations compute to. Use it; a naive regex parser reads those as garbage.

5. Prove the test is not vacuous: revert `--on-accent` to `var(--brand-contrast, #FFFFFF)`,
   run the styles suite, confirm it **fails** and report which seeds failed; restore, confirm
   it passes. Report both outputs.
6. Verify `--brand-contrast` still overrides the derivation, with a test.
7. **The white-label guide is now wrong and must be corrected**, in both languages:
   `apps/docs/content/docs/en/guides/white-label.mdx` and the `pt-BR` counterpart. Today it
   instructs the reader to set `--brand-contrast` "whenever the seed is light enough that
   white text would not be readable" (line ~23) and warns that the label "can become
   illegible" without it (line ~73). That is no longer true: the ink is derived. Rewrite
   those passages so they say the ink is automatic and `--brand-contrast` is an override for
   when the consumer wants a specific one — and state the honest limit from the section
   above. Follow the project's pt-BR terminology rules in `.batuta/profile.md`; the seed
   token is called **"cor-base"** in Portuguese, never "semente".
8. All four CI jobs' commands run, with real output reported and anything unrunnable named.
9. A changeset exists, **minor** for `@lyra-ds/styles` (consumers gain a guarantee), written
   in the user-facing voice.

## Boundaries — do not touch

- The default (non-white-label) palette. `tokens/colors.css` is finished; the dark-fill fix
  landed already.
- Any other token in `brand.css` — only `--on-accent` changes. In particular, leave
  `--accent-soft-text`, `--text-link` and the dark `color-mix` accent derivations exactly as
  they are; their contrast is a separate question and is **not** in this lot.
- Component CSS, `packages/react`, and everything in `apps/docs` except the two guide files.
- The shared brief's global boundaries. Do not commit, branch or push.
