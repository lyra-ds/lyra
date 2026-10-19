# BUG-20261019-notification-examples-cover-actions

- id: BUG-20261019-notification-examples-cover-actions
- title: The persistent reminder covers the confirmation's close control
- status: verified
- impact: Friction
- severity: Medium
- priority: P2
- first_observed: 2026-10-19
- persona: Integrating developer
- journey_step: J-read-notification, dismissing the first example after trying the second
- charter: CH-readable-notifications
- scenarios: MSG-coexisting-example-controls
- reproduction: Open https://docs.lyra-ds.dev/en/components/toast-provider at
  1280×900; click Publish project, then Add reminder before the confirmation
  expires; try to click Close notification in Project confirmations.
- expected: Both independently documented examples remain readable and their
  notification actions remain reachable when the visitor tries both.
- observed: Both fixed stacks occupy the bottom-right corner. The reminder
  intercepts pointer events intended for the confirmation's Close notification.
  The confirmation region measured x=976, y=831, 280×45; the reminder measured
  x=880.6875, y=812, 375.3125×64. A fresh-context replay reproduced the blocked
  click. Dismissing the reminder with Done restores access to the confirmation.
- evidence: evidence/2026-10-19-functional-46349ec7-1f2a-456b-923b-f7add5041f93/toast-two-public-examples-active.png;
  evidence/2026-10-19-functional-46349ec7-1f2a-456b-923b-f7add5041f93/toast-confirmation-close-blocked.png;
  evidence/2026-10-19-functional-46349ec7-1f2a-456b-923b-f7add5041f93/toast-clean-retry-overlap.png;
  evidence/2026-10-19-functional-46349ec7-1f2a-456b-923b-f7add5041f93/toast-overlap-recovery.json;
  evidence/2026-10-19-functional-46349ec7-1f2a-456b-923b-f7add5041f93/events.json
- public_reread: Independent rendered bounds, browser pointer hit-test result,
  and successful confirmation dismissal after Done removes the covering reminder.
  No server data is created by these demonstration controls.
- origin: native
- issue: https://github.com/lyra-ds/lyra/issues/307

## History

- 2026-10-19 — open; Integrating developer; CH-readable-notifications;
  2026-10-19-functional-46349ec7-1f2a-456b-923b-f7add5041f93.md; same-page public example collision reproduced once in a clean
  browser context. Default timing and persistence themselves passed.

## Root cause and fix governance

Both independent providers correctly use the same library viewport anchor.
The documentation inserted them in the same ordinary preview document without
separating their layout. The governed correction wraps only ToastProvider
previews in docs-owned markup and scopes normal-flow CSS there. Package CSS,
original consumer examples and provider state/timing remain unchanged.

## Fix evidence

- fix_commit: 68b2e22ef2ff6edf5ee2eea67e7ac7af75ccfbb0
- regression_proof: documented visual replay in 2026-10-19-fixes-5e4ed134-2a4c-4cdd-9b1a-9c06df56a180.md.
  Before: original public page and one clean retry block the confirmation Close
  control. After: both normal pointer dismissals and independent region rereads
  pass on the real static export. Existing Node assertions cannot establish
  pointer hit testing; the visual replay exception is bounded by the linked
  automation-backlog/notification-preview-reachability.md intent.
- Adjacent proof: real public Toast invitation stack retains fixed placement;
  Popover open/Escape/focus passes. Native coarse-pointer320px replay follows.

### 2026-10-19 — fixed

Commit 68b2e22ef2ff6edf5ee2eea67e7ac7af75ccfbb0; four docs-owned files only. Full parent pnpm test,
formatting and docs ESLint passed on identical source candidate95d2831.

### 2026-10-19 — verified on repaired candidate

Integrating developer; CH-readable-notifications; 2026-10-19-fixes-5e4ed134-2a4c-4cdd-9b1a-9c06df56a180.md;
both independent Close actions, Done/focus, hover/focus pauses and remaining
expiry passed. Original evidence remains retained. Hosted production reread is
still a delivery step after CI and deployment, not an already performed claim.
