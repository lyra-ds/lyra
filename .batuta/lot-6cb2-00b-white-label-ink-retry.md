# Retry — tinta automática do white-label: a guarda `@supports`

Your round is in the working tree and is largely right. **Do not start over.** One defect,
and it is mine — the original brief specified the derivation without the guard it needs.

Original brief: `.batuta/lot-6cb2-00b-white-label-ink.md`, on top of
`.batuta/brief-6cb2-chrome.md`.

## What I verified independently and accepted

58 styles tests pass (up from 23), 465 React tests pass, parity passes, and the guides read
well in both languages — the pt-BR one uses "cor-base" correctly and states the `#E11D48`
4.47 limit with its number instead of hiding it.

I also ran the **mutation proof you could not run**. Reverting `--on-accent` to
`var(--brand-contrast, #FFFFFF)` fails at the AA-large level across eight seeds
(`#0D9488`, `#FACC15`, `#84CC16`, `#EC4899`, `#22D3EE`, `#059669`, `#F97316`, `#0EA5E9`);
restoring passes. The test earns its keep.

## The defect: the degradation path is worse than doing nothing

The original brief claimed the derivation "degrades to today's behavior" in an engine
without relative color syntax. **That claim was wrong, and I proved it in a browser.**

When the function is unsupported, `--on-accent` becomes invalid at computed-value time, so
`color: var(--on-accent)` is invalid at computed-value time too, and `color` falls back to
its **inherited** value — the page's body text color. Measured:

```
unguarded declaration, unsupported function:  color = rgb(18, 52, 86)   <- inherited body text
with an @supports guard:                      color = oklch(1 0 …)      <- white, today's behavior
```

Dark-blue body text on a navy primary fill is less legible than the white it replaced. The
feature would make old engines worse, not neutral.

## What to fix

Keep an unconditional, always-valid base declaration, and apply the derivation only where the
engine supports it:

```css
[data-brand] {
  --on-accent: var(--brand-contrast, #FFFFFF);
}

@supports (color: oklch(from red l c h)) {
  [data-brand] {
    --on-accent: var(--brand-contrast, oklch(from var(--accent) clamp(0, (l / 0.58 - 1) * -infinity, 1) 0 h));
  }
}
```

Exact structure is yours to choose as long as the two properties hold: an engine without
relative color syntax lands on `var(--brand-contrast, #FFFFFF)`, and an engine with it lands
on the derivation. Add a comment saying why the duplication exists, so nobody "simplifies"
it back into one declaration later.

Relative color syntax is Baseline 2024. I verified the derivation resolves correctly in
**Chromium and Firefox** (yellow seed → black ink, navy seed → white ink). WebKit could not
launch on this machine, so treat Safari as unverified — which is exactly why the guard is
not optional.

## Acceptance

1. `brand.css` carries both the unguarded base and the `@supports`-guarded derivation, with a
   comment explaining the pair.
2. A test asserts **both halves exist in the shipped stylesheet** — read the CSS through the
   CSSOM (or the source) and assert that a `[data-brand]` rule sets `--on-accent` to the
   plain `var(--brand-contrast, #FFFFFF)` form outside any `@supports`, and that an
   `@supports` block sets the derived form. This is the only way to catch someone collapsing
   the two; a computed-value test in a supporting browser cannot see the difference.
3. Every existing assertion still passes: the AA-large guarantee for all seeds, AA except the
   enumerated crossover, the `≥ 4.4` floor on that exemption, and the `--brand-contrast`
   override.
4. `pnpm parity` passes. The `@supports` block is a **new at-rule ancestry** in a file the
   gate compares against the handoff, so the pinned divergence needs to cover the added
   structure, not only the changed value. Keep it enumerated and exact — a different
   `--on-accent` value must still fail. Re-run the tripwire proof (a wrong threshold, e.g.
   `0.57`) and report both outputs.
5. `pnpm --filter @lyra-ds/styles run lint:css` passes — check that stylelint does not object
   to the duplicate selector across the `@supports` boundary; if it does, resolve it the way
   this repo already resolves that rule and say how.
6. The guides do not need to change again. If the wording "combinações de cor-base e tema
   compatíveis" now reads as vague, tighten it to name the engine support explicitly — one
   sentence, both languages, or leave it.
7. All four CI jobs' commands run, with real output reported and anything unrunnable named.
   The changeset stays minor for `@lyra-ds/styles`; extend its text to mention the fallback.

## Boundaries

Unchanged. Only `--on-accent` in `brand.css`, the parity pin, the test, and optionally the
two guide sentences. Do not commit, branch or push.
