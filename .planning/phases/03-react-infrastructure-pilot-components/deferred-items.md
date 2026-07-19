# Deferred Items — Phase 03

Out-of-scope discoveries logged during execution. Not fixed here; carried forward for a
dedicated decision/plan.

## Frozen dark-theme brand-token contrast just under WCAG AA (discovered plan 03-05)

- **Found during:** 03-05 Task 1 (Button pilot browser axe smoke matrix — first time axe
  `color-contrast` runs against the frozen tokens; Phase 2 verified color values via canvas
  luminance, not contrast ratios).
- **Finding:** In `[data-theme="dark"]`, enabled text buttons using `--accent` = `indigo-500`
  (`#6E6ADE`) with `--on-accent` = `#FFFFFF` measure **4.39:1**, just below the AA `4.5:1`
  threshold. Affects `variant="primary"` and `variant="danger"` (danger dark also resolves to a
  white-on-accent-family pair) at all three sizes. Light theme passes (`indigo-600` `#5B5BD6`).
  Disabled (loading) and icon-only (no text) buttons are exempt from the rule and pass.
- **Why not fixed here:** The color tokens are LOCKED by project constraint ("cores… são finais —
  preservar pixel a pixel") and live in `@lyra-ds/styles` (Phase 2), outside this plan's
  `files_modified`. Editing them would violate the CSS-first frozen-fidelity lock and the scope
  boundary (only auto-fix issues directly caused by the current task's changes).
- **How the pilot tests handle it:** The Button smoke-matrix axe assertion allows ONLY this known
  `color-contrast` finding (via an explicit, documented filter) while enforcing every other axe
  rule at full strength. Any structural/aria/name violation — or any NEW color-contrast target
  beyond the frozen accent — still fails the suite. Icon-only and loading fixtures keep the full
  ruleset (including `color-contrast`) with zero allowances.
- **Suggested resolution (future decision):** A design decision for the token owners — either
  darken the dark `--accent` by one indigo step for enabled-button text, adjust `--on-accent`, or
  formally accept the 4.39:1 as a documented AA-shortfall for the brand color. Requires touching
  frozen Phase-2 CSS, so it needs an explicit token-change decision, not a wrapper change.
