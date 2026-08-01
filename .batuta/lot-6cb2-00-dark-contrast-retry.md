# Retry — contraste AA do tema escuro

Your previous round is in the working tree. Most of it is right; **do not start over.**

Original brief: `.batuta/lot-6cb2-00-dark-contrast.md`, on top of
`.batuta/brief-6cb2-chrome.md`. Both still apply.

## What I verified independently and accepted

The four token values are exactly as specified, dark-block only, light theme untouched. The
parity divergence is well-scoped — pinned to `tokens/colors.css`, to the
`[data-theme="dark"]` block, and to both the canonical and the approved value.

I also ran a **sharper tripwire probe than the one you reported**. You changed `--info`, a
token that is not in the divergence map, so it proved little. I set the dark `--accent` to
`var(--indigo-700)` — an _unapproved_ value on a _mapped_ token, which is the actual
scope-creep risk — and parity failed at both levels:

```
✗ Token --accent: package=[…, var(--indigo-600), var(--indigo-700)] handoff=[…, var(--indigo-500), var(--indigo-600)]
✗ Decl mismatch tokens/colors.css [data-theme="dark"] {--accent} #76: package=var(--indigo-700) handoff=var(--indigo-500)
```

Restoring passes. The allowlist does not leak. That part is done well.

## The defect: you half-updated an existing test

`pnpm run test` fails — the browser suite you could not run:

```
FAIL tests/brand-theme.test.ts > STY-03 — dark theming > setting data-theme=dark switches the same probe to indigo-600 (no rebuild)
AssertionError: expected 99.8806 not to be 99.8806

  136|     // The switch is a real change of the resolved longhand, not the raw custom-property string.
  137|     expect(luminance(dark)).not.toBe(luminance(light));
```

You renamed the test's title to match the new reality but left the assertion asserting the
old one. The title now says the dark probe resolves to indigo-600 — which is also what light
resolves to — while the body still asserts the two luminances differ. The test contradicts
itself.

The assertion is not noise. STY-03 exists to prove something valuable: **switching
`data-theme` re-derives the resolved longhand with no rebuild** — that theming is real
cascade work, not a string swap. Our change made `--accent` the wrong probe for that proof,
because accent is now deliberately the same value in both themes.

Fix it so both guarantees survive:

- The dark accent still resolves to the expected value (that assertion is a useful
  regression guard for this very change — keep it).
- The "theme switch actually re-derives, no rebuild" proof still exists, anchored to a token
  whose value **must** differ between themes by definition, so it will not become fragile
  the next time an accent is tuned.

Choose the probe token, say which you chose and why the choice is stable.

## Also — do not fix, only report

Reviewing `packages/styles/tokens/brand.css` I found that the white-label path has the same
structural problem we just fixed:

```css
[data-theme='dark'][data-brand] {
  --accent: color-mix(in oklab, var(--brand), white 14%);
}
```

It lightens the consumer's brand for dark surfaces, exactly the pattern that put the default
palette below AA under white text. **This is out of scope** — it needs a product decision,
not a token edit, because no `color-mix` can guarantee AA for an arbitrary brand color.
Leave `brand.css` untouched. I am raising it with the maintainer separately.

## Acceptance

1. `pnpm run test` passes in full — both packages, zero failures.
2. STY-03 still proves the no-rebuild re-derivation, on a token that must differ per theme.
3. The dark accent and danger values remain asserted, and the AA contrast test you added
   still computes the ratio from resolved token values rather than restating a number.
4. **The revert-the-fix proof, which you could not run last time:** set the dark `--accent`
   back to `var(--indigo-500)`, run the styles suite, confirm the AA test **fails**; restore,
   confirm it passes. Same for `--danger` → `var(--red-500)`. Report all four outputs. If the
   sandbox still cannot run browser tests, say so plainly and skip only this item — do not
   simulate or infer the result.
5. `pnpm parity` still passes, and `brand.css` is unchanged.
6. The changeset stays patch-level for `@lyra-ds/styles`.

## Boundaries

Unchanged from the original brief. `brand.css`, the light theme, every other token, all
component CSS and `apps/docs` stay untouched. Do not commit, branch or push.
