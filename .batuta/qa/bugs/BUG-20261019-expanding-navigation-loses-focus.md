# BUG-20261019-expanding-navigation-loses-focus

- id: BUG-20261019-expanding-navigation-loses-focus
- title: Expanding the icon rail loses the focused navigation link
- status: open
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

Not yet investigated. Session has ended; no product edit or fix claim.

## Fix evidence

No fix commit or regression proof yet.
