# Lote — contraste AA do tema escuro

Sits on top of the shared brief `.batuta/brief-6cb2-chrome.md`. Read that first, in full —
the project rules, the gates, the test laws and the evidence contract all apply unchanged.
Ignore its "What 6c-b2 is" section; this is a separate, smaller task.

## Goal

Make the dark theme's solid accent and danger fills pass WCAG AA (4.5:1) for the text
rendered on them, by moving each one step down the existing palette scale. No new color, no
new token.

## Context

### The finding

Measured with axe-core on the built docs site, dark theme, after a 1.2s settle so CSS
transitions could not skew the sample:

| pairing                                            | ratio    | AA (4.5:1) |
| -------------------------------------------------- | -------- | ---------- |
| `#FFFFFF` on `--accent` (`--indigo-500` `#6E6ADE`) | **4.39** | fails      |
| `#FFFFFF` on `--danger` (`--red-500` `#EF4444`)    | **3.76** | fails      |

The light theme already passes — `--indigo-600` gives 5.37 and `--red-600` gives 4.83.

The cause is structural, not accidental: the dark block lightens the accent by one step
(600 → 500). That convention is right when the accent is used as **text or border on a dark
background**, and wrong when it is a **fill underneath white text**. The same token serves
both jobs, and only one of them works.

### Why not simply darken the ink instead

`#6E6ADE` is a mid-tone. Its contrast ceiling is **4.78 against pure black** — and the
system's own darkest indigo, `--indigo-950` `#121430`, only reaches 4.09. Keeping the fill
and darkening the text would leave a 0.28 margin and force a near-black ink. That path was
considered and rejected.

### The decision (already taken — implement it, do not re-open)

Shift the dark theme's accent ramp and danger one step down the existing scale:

```
[data-theme='dark']
  --accent:        var(--indigo-500)  ->  var(--indigo-600)   /* 4.39 -> 5.37 */
  --accent-hover:  var(--indigo-400)  ->  var(--indigo-500)
  --accent-active: var(--indigo-300)  ->  var(--indigo-400)
  --danger:        var(--red-500)     ->  var(--red-600)      /* 3.76 -> 4.83 */
```

`--accent-hover` and `--accent-active` move too, so the ramp keeps its one-step rhythm and
its direction: in dark, hover and active lighten. Leaving them where they are would put
hover two steps away from the new accent.

**The light theme does not change.** Nothing outside the `[data-theme='dark']` block
changes.

### Blast radius — verified before deciding

Only three rules render text on an accent fill, and one on a danger fill:

- `packages/styles/components/buttons/buttons.css` — `.lyra-btn--primary`, and
  `.lyra-btn--danger` (which uses a literal `#fff`, not `--on-accent`)
- `packages/styles/components/navigation/navigation.css` — `.lyra-step--active
.lyra-step__dot` and `.lyra-page--active`

Every other `background: var(--accent)` is a non-text surface (Switch track, Progress fill,
Stepper line, Checkbox) and is unaffected by the contrast question, though it will shift
shade with the token.

### The parity gate will fight you, and that is the point

`pnpm parity` compares `packages/styles` against `handoff/` declaration by declaration, so
changing a token value **will** fail the gate — correctly, because a silent value change is
exactly what the gate exists to catch.

`handoff/` is read-only. The resolution is an **approved, pinned divergence**, which this
codebase already has precedent for: see `MASK_DIVERGENCE` and
`OVERLAY_ENTRANCE_DIVERGENCE` in `tools/parity/parity.mjs`, each a small map pinning the
exact canonical value alongside the approved replacement, with a comment saying why.

Follow that established shape. The requirement is an outcome:

- `pnpm parity` passes.
- The divergence is **enumerated and pinned to these exact four tokens**, with the handoff's
  canonical value recorded next to the approved one and a comment stating the reason
  (WCAG AA on solid fills in dark).
- The gate still bites: a _different_ token value drifting from the handoff must still fail.
  **Prove it** — temporarily change some other token's value (e.g. a light-theme color),
  run `pnpm parity`, confirm it fails, revert, confirm it passes. Report both outputs.
- Regenerate `tools/parity/baseline.json` in the same commit if the gate requires it, and
  report the diff.

## Acceptance criteria

1. The four dark-theme token values are exactly as specified above. No other token changes,
   and no light-theme change at all.
2. Contrast, measured and reported as numbers, not claimed: white on the new `--accent`
   ≥ 4.5:1 and white on the new `--danger` ≥ 4.5:1.
3. `pnpm parity` passes with the divergence pinned and enumerated, and the tripwire proof
   above is reported with both outputs.
4. A test asserts the AA thresholds so this cannot silently regress. `packages/styles/tests`
   is the natural home — read what is there and follow its shape. The test must compute the
   ratio from the token values, not restate a hardcoded number, and it must cover **both**
   the accent and the danger pairing.
5. Prove that test is not vacuous: revert one token to its old value, watch the test fail,
   restore it, watch it pass. Report both outputs.
6. `--accent-soft` in the dark block is a literal `rgba(110, 106, 222, 0.16)` — the old
   indigo-500. It is a tint behind `--accent-soft-text`, not a fill under white text, so it
   is **out of scope**. Do not change it. Say in your report whether leaving it creates a
   visible incoherence with the new accent, so the maestro can judge; do not act on that.
7. All four CI jobs' commands run, with real output reported and anything unrunnable named.
8. A changeset exists, **patch** for `@lyra-ds/styles` (this is a fix, not a feature),
   written for a consumer: what changed in dark mode and why.

## Boundaries — do not touch

- The light theme, and every token outside the four named above.
- `handoff/` — entirely read-only for this task. No new file, no edit.
- Any component CSS. This is a token change; if a component needs editing to pass, stop and
  report instead.
- `apps/docs`.
- The shared brief's global boundaries. Do not commit, branch or push.
