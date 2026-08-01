# Retry 2 — Lote 2: no preview isolado, só o primeiro clique funciona

The mirroring opt-out was the right call and it works. **Do not undo it.** There is a second
defect underneath, and it is not where you would look first.

Files: `.batuta/lot-6cb3-02-retry.md`, `.batuta/lot-6cb3-02-system-nav.md`,
`.batuta/brief-6cb3-docs.md`, `.batuta/brief-phase06b-fanout.md`.

## What I verified independently and accepted

- The `ThemeProvider` example no longer follows the host: with the host on `dark`, clicking
  `Light` now renders the frame light. The opt-out does what it should.
- **Other isolated previews still mirror.** The `Shell` preview followed a host toggle from
  `light` to `dark`.
- **The reader is safe.** Site theme and `lyra-docs-theme` are untouched after interacting
  with the examples; the example persists to its own key.
- Per-preview document titles are in place, `typecheck`, `lint` and `build` pass, and your
  dismissal of `landmark-one-main` / `page-has-heading-one` inside preview fragments is
  reasoned and I accept it.

## The defect: the example stops responding after its first interaction

Reproduced on a **fresh page load** for each sequence, dev server, real browser:

```
[Dark]          Dark→dark                    ok
[Light]         Light→light                  ok
[Light, Dark]   Light→light   Dark→light     ✗ second click ignored
[Dark, Light]   Dark→dark     Light→dark     ✗ second click ignored
```

The first click always applies. Every click after it is ignored — the frame keeps whatever
the first one set. No console error, no reload: the iframe element keeps its identity across
the clicks, and the theme does not reset to the default, it simply freezes.

**This is not a `ThemeProvider` bug.** The control rules that out — the docs site's own theme
toggle, driven by the same component, alternates correctly four times in a row:

```
clique 1: light -> dark   mudou
clique 2: dark  -> light  mudou
clique 3: light -> dark   mudou
clique 4: dark  -> light  mudou
```

So the component is fine and something about the isolated preview makes the example's React
tree stop reacting after its first state update. The preview route
(`app/example-preview/[slug]/[id]/page.tsx`) and the `IsolatedPreview` effect in
`example-view.tsx` are yours; the cause is in one of them.

**Find the root cause before changing anything.** A workaround that makes the symptom go
away — remounting the frame on every interaction, forcing a reload, keying the iframe on the
theme — would trade a visible bug for a slower, subtler one. Say what the cause was.

Worth knowing: this is the **first interactive example inside an isolated preview**. `Shell`,
`Navbar`, `Footer` and `PageHeader` are static, so nothing has exercised this path before, and
whatever you find will apply to every interactive isolated preview after it.

## Acceptance

1. The four sequences above all behave: `[Light,Dark]` ends dark, `[Dark,Light]` ends light,
   and repeated alternation keeps working. Report the runs.
2. The root cause is stated, and the fix addresses it rather than the symptom.
3. Everything already verified stays true: the opt-out, mirroring on other previews, the site
   theme and `lyra-docs-theme` untouched, per-preview titles.
4. axe stays at zero on the host pages at 1440/900/375 in both locales, and inside the frames
   nothing new appears.
5. `pnpm typecheck`, `pnpm lint`, `pnpm build` pass with real output.

## Boundaries

`packages/` is read-only, and this time the evidence says it should be: `ThemeProvider` is
demonstrably fine. Do not touch Lot 3's components. Do not commit, branch or push.
