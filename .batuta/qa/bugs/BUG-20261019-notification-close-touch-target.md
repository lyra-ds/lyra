# BUG-20261019-notification-close-touch-target

- id: BUG-20261019-notification-close-touch-target
- title: Notification Close has a tiny target on a coarse-pointer screen
- status: invalid
- impact: Friction
- severity: Medium
- priority: P2
- first_observed: 2026-10-19
- persona: Mobile teammate
- journey_step: J-read-notification, touching Close notification
- charter: CH-mobile-notification-controls
- scenarios: none (invalid observation; historical association MSG-mobile-preview-controls)
- reproduction: Open the actual ToastProvider component page in a touch-emulated
  coarse-pointer Chromium context at320×812. Publish project and Add reminder.
  Read the rendered Close notification button bounds; compare Done.
- expected: The close control provides a usable coarse-pointer target consistent
  with the44px targets of adjacent actions, while fine-pointer geometry remains
  unchanged.
- observed: Both Close controls measured about11.8×19px; Done measured70.3×44px.
  Exact-center automated taps succeed, but the target is unusually small for a
  finger. This is a reachability/friction finding, not a lost notification.
- evidence: evidence/2026-10-19-fixes-5e4ed134-2a4c-4cdd-9b1a-9c06df56a180/toast-coarse-320-both-examples.png;
  evidence/2026-10-19-fixes-5e4ed134-2a4c-4cdd-9b1a-9c06df56a180/events.json (mobileToastTargets measurements)
- public_reread: Actual rendered button boxes and normal touch activation;
  both independent provider states were reread after dismissal. No server data.
- origin: native
- issue: https://github.com/lyra-ds/lyra/issues/308

## History

- 2026-10-19 — open; Mobile teammate; CH-mobile-notification-controls;
  2026-10-19-fixes-5e4ed134-2a4c-4cdd-9b1a-9c06df56a180.md; observed while checking the repaired docs layout. Independent
  actions, focus return, no horizontal overflow, and revisit passed, but target
  size is a sharp paper cut. The initial raw event said Pass before the
  evaluator judged the measured target; this registry and report retain the
  final Fail verdict without deleting that earlier observation.

## Root cause and fix governance

The original evaluation measured only the visible button box. Existing additive
CSS already creates a pointer-active ::after with inset:-12px, yielding about
35.8×43px without enlarging the12×19 glyph. The existing comment bounds that
extension to avoid intercepting adjacent message taps. Production and repaired
preview hit testing resolves all four points10px outside the glyph to the close
button, and ordinary touch at each point dismisses the notification. The first
probe ran during entry animation; final probes explicitly awaited completion.
There is no reproduced tiny12×19 effective target or blocked close action.
The proposed44px expectation was an unvalidated evaluator assumption, not an
established unmet public promise. No source correction is justified.

## Fix evidence

No product fix or fix commit: this is an invalid measurement finding. The UI
replay validates the existing effective hit area; it is not a repaired behavior.

### 2026-10-19 — re-found on hosted production

One clean coarse-pointer320px production retry measured the same11.8×19px Close
control and normal tap dismissal succeeded. This confirms a pre-existing shared
sizing issue, not a regression introduced by the docs preview wrapper. Evidence:
toast-close-original-production-coarse.* and events.json in the current replay
run. No target-sizing repair has been applied yet.

### 2026-10-19 — invalid after effective-area verification

Eight stable edge probes (four on hosted production, four on the repaired real
static export) identified Close notification and dismissed successfully. Existing
CSS and package source remain unchanged. Evidence: toast-effective-target-
production-inspection._, toast-real-hit-area-production._,
toast-real-hit-area-candidate.*, and events.json. The original glyph-only
observation and its earlier Fail judgment remain in history; no deferred fix is
queued. The current scenario removes this invalid record from active bug_ids.
