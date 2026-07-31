# Lot 1/5 — second retry, one defect

Your previous round fixed all six items correctly and every gate I can run is green:
464 tests pass, `parity` (with the tripwire proof), `docgen --check` (47 components),
`lint:css`, eslint, typecheck, build, `size-limit` (Shell 353 B / 1 kB). The prose fidelity
restoration, the rail semantics props, the docgen regeneration and the page-mode topbar are
all right.

I also ran the revert-the-fix proof on your aside-only test: deleting the new 1100px line
fails exactly that test and restoring it passes. That test earns its keep.

**One defect remains, found by opening the built docs in a browser.** It is not something
your previous feedback mentioned, so this is a targeted fix, not a repeat.

## The defect: the sidebar never stacks — a specificity bug

Measured on the built docs site at a 375px viewport:

```
.lyra-shell computed grid-template-columns:  220px 83px
document.documentElement.scrollWidth:        467   (viewport 375)
```

The main column is 83px wide and the page scrolls sideways by 92px.

Cause — media queries add **no specificity**, so the collapse rules lose to the base rules:

| selector | specificity | where |
| --- | --- | --- |
| `.lyra-shell--has-sidebar.lyra-shell--has-aside` | 0,2,0 | base |
| `.lyra-shell--page.lyra-shell--has-sidebar.lyra-shell--has-aside` | 0,3,0 | `@media (max-width: 1100px)` |
| `.lyra-shell--page` | **0,1,0** | `@media (max-width: 900px)` |

At 375px every one of those matches, and the winner is the 1100px rule at 0,3,0 —
`var(--shell-sidebar) minmax(0, 1fr)`. The 900px stacking rule can never apply to a Shell
that has both rails, which is precisely the docs configuration.

## Why the test suite did not catch it

`it('stacks the sidebar at 900px')` renders `<Shell sidebar="Navigation">` — sidebar only.
That element carries `.lyra-shell--has-sidebar` (0,1,0) against `.lyra-shell--page` (0,1,0),
a tie broken by source order in the stacking rule's favour. So the test passes while the
real configuration is broken.

This is the failure mode this project keeps paying for: a green test that does not prove the
behavior. The collapse tests must cover the **both-rails** shape, which is the one consumers
actually build.

## What to fix

1. Make the collapse rules win in every rail combination, at both breakpoints. How you
   resolve the specificity is yours to choose — say what you chose and why.
2. Extend the responsive tests to the **both-rails** Shell at 900px and below (assert the
   single-column track **and** that the sidebar is no longer sticky), and keep the existing
   single-rail cases.
3. Prove the new tests are not vacuous the way this project requires: break the fix, watch
   the test fail, restore it, watch it pass. Report both outputs.
4. Re-verify on the built docs, not only in unit tests: at 375px,
   `document.documentElement.scrollWidth` must equal the viewport width. If you cannot run a
   browser, say so — I will re-run it.

## Not yours to fix — do not touch

While verifying I also found a **pre-existing** critical axe violation at 375px:
`button-name` on `.lw-search`, the docs site's own search trigger. Below 720px its label and
shortcut are hidden by CSS, leaving the button with no accessible name. Your diff does not
touch `.lw-search` (confirmed: zero occurrences in the `site.css` diff), it predates this
lot, and it is already covered by Lot 3's brief, which replaces that button with
`CommandPalette.Trigger`. **Leave it alone.**

## Acceptance

1. On the built docs at 375px: no horizontal scroll, and the sidebar is stacked above the
   content, not beside it.
2. The both-rails Shell collapses correctly at 1100px and at 900px, each covered by a test
   that fails when the rule is removed.
3. All previously green gates stay green: full test suite, parity + tripwire, `docgen
   --check`, `lint:css`, eslint, typecheck, build, `size-limit`.

Everything else from `.batuta/lot-6cb2-01-shell-prose.md`, its first retry file and the
shared brief still applies. Do not expand scope. Do not commit, branch or push.
