# BUG-20261019-expanding-navigation-loses-focus

- id: BUG-20261019-expanding-navigation-loses-focus
- title: Expanding the icon rail loses the focused navigation link
- status: fixed
- impact: Friction
- severity: Medium
- priority: P2
- first_observed: 2026-10-19
- persona: Keyboard navigator
- journey_step: J-navigate-workspace, changing the icon rail back to expanded navigation
- charter: CH-keyboard-workspace
- scenarios: NAV-keyboard-rail-links
- reproduction: Open https://docs.lyra-ds.dev/en/components/app-sidebar; activate
  Toggle navigation rail to collapse; focus Projects with the keyboard; press
  Ctrl+B (Cmd+B on macOS). Inspect focus before pressing another key.
- expected: Expansion preserves the focused Projects link or deliberately moves
  focus to the visible sidebar trigger; keyboard position remains identifiable.
- observed: Navigation expands but document.activeElement is BODY. The next Tab
  reaches Overview instead of continuing from Projects. A fresh-context replay
  reproduced the expansion loss. Collapsing a focused expanded link correctly
  returns focus to Toggle navigation rail.
- evidence: evidence/2026-10-19-functional-46349ec7-1f2a-456b-923b-f7add5041f93/nav-retry-before-expand.json;
  evidence/2026-10-19-functional-46349ec7-1f2a-456b-923b-f7add5041f93/nav-retry-after-expand.json;
  evidence/2026-10-19-functional-46349ec7-1f2a-456b-923b-f7add5041f93/nav-retry-after-expand.png;
  evidence/2026-10-19-functional-46349ec7-1f2a-456b-923b-f7add5041f93/events.json
- public_reread: Public expanded navigation and actual focused element after the
  shortcut; a subsequent Tab visibly reaches Overview. No durable server object.
- origin: native
- issue: https://github.com/lyra-ds/lyra/issues/306

## History

- 2026-10-19 — open; Keyboard navigator; CH-keyboard-workspace; 2026-10-19-functional-46349ec7-1f2a-456b-923b-f7add5041f93.md;
  fresh production page replay isolates loss on expansion. The first broad
  assertion expected focus on collapse after expansion had already lost it;
  that assertion did not isolate the cause, so both original and clean replay
  evidence are retained.

## Root cause and fix governance

The published composition replaces Tooltip/span ancestors while changing mode;
the shared requestSidebarChange helper previously protected only collapse.
The accepted bounded policy reconciles navigation focus to its eligible desktop
trigger before either toggle. The governed contract is
../../specs/2026-10-19-sidebar306-focus.md. Main-content focus, modal ownership,
trigger eligibility and hotkey arbitration are preserved.

## Fix evidence

- fix_commit: 8ebbfe099e13d1e8e753c6b941d886aa48aa8048
- regression_proof: packages/react/src/app-sidebar/controls.browser.test.tsx,
  four returns-rail-focus cases. The conductor ran all four against the unfixed
  helper and observed focus assertion failures; the same four passed with the
  repair. Full sidebar browser neighbors: 36/36 in each Chromium, Firefox and
  WebKit (108 passes); SSR 7/7; React build, typecheck, ESLint and formatting passed.
- Public persona replay: pending on the combined repaired build. The lifecycle
  remains fixed, not verified, until that walk succeeds.

### 2026-10-19 — fixed

Commit 8ebbfe099e13d1e8e753c6b941d886aa48aa8048; core source correction only in the shared helper, with focused
regressions, both locale paragraphs and a React patch changeset. Independent
review and repaired-build persona replay remain pending. The initial production
failure and report are retained unchanged.
