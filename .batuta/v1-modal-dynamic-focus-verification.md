# React modal dynamic focus recovery — 2026-09-10

Status: accepted locally; final GLM delta review3DONE/no findings, unchanged1986-file guard and Batuta verifierPASS. This completes a bounded Task31 slice only. Background isolation/topmost/parent-child ownership and core/Alpine V1 qualification remain open.

## Change
The existing shared useFocusTrap now recovers actual owned focus after local DOM/attribute changes make its control unavailable. It selects a currently eligible owned successor/predecessor or replacement, then the panel. A moved but eligible anchor is restored after native body blur; a valid destination in another modal/application wins and revokes previous recovery ownership. Observed programmatic headings retain focus without becoming new Tab stops. Native Tab cancellation/boundaries, initial/return focus and logical close remain intact. No public API, global observer/registry, dependency, CSS, Alpine or Blade change.

Remembered candidates must belong to the complete freshly queried eligible set, not merely remain visible. Neutral body/html are never treated as meaningful destinations, even with tabindex. Both focusout and mutation observation can relinquish ownership; this handles DOM removal before an ordinary focusout is delivered. Resources are local and disposed per active cycle. Global stylesheet/media-only changes without local mutation are outside this observer's guarantee.

## Routing and diagnosis
Codex gpt-5.6-terra/high367.14s initial +399.85s one retry, then critical/controller completion after pinned formatting failure. Initial source146/148 and native ownership0/6 exposed reordered focus loss, stale moved candidate eligibility and parent-child focus authority. Critical completion fixed neutral document roots with2RED→PASS tests and corrected test DOM identity, exact focus assertions, TypeScript and lint issues without casts/suppressions. All failures and executor reports retained verbatim. The retry used pnpm exec prettier despite the pinned-Node brief; controller ran the required pinned formatter and verified scope. Hook cache changed through executor hooks, retained unstaged; no hook configuration/dependency/lockfile changes.

Technical GLM reviews265.53s/150.75s refined deterministic neighborhood, semantic eligibility and lifecycle proof; every finding accepted. A full implementation review174.23s was3DONE/no findings, unchanged1986-file guard. Subsequent controller audit found href-less remembered-link and missed-focusout authority gaps, reproduced each with a real source regression and the link case in all three compiled engines. The two bounded corrections received fresh full verification and final delta review below; the earlier review alone is not final acceptance.

## Final controller proof
- Shared hook35/35tests in Chromium/WebKit/Firefox on final bytes; four modal owners121/121each engine on final bytes. SSR14PASS. Scoped Prettier/diff/TypeScript/ESLint/build/docgen drift PASS. No authored skip/only, mocked focus/MutationObserver, hidden console error or weakened existing assertion.
- Compiled native171recovery +9neighbor eligibility +12logical-close +60initial/return/StrictMode/reopen =252/252PASS, zero page/console errors. Includes same-batch parent/child loss, moving successor outside, document tabindex fallback and native fieldset/hidden/style/class/inert/aria-hidden behavior. Complete transitive React artifact manifest and exact source hashes bind every suite. BottomSheet accessible-name harness corrected from aria-label-only to actual aria-labelledby naming; actual panel fallback was already correct. No product naming change.
- Original pre-task hook substituted temporarily:2selected removal regressionsRED; exact-byte restoration2PASS. Critical predicate/authority regressions independently4RED→PASS (document roots2, lost-href neighbor1, observed transfer1). Filtered negatives report unselected tests as skipped; no authored skips added.
- Scope exactly shared hook/browser test/React patch changeset plus managed Batuta state. Public declarations/catalogs and all protected Alpine artifacts unchanged. No new private helper was needed.

## Size and qualification
Existing full configured React pipeline still exits1 with12overages; none waived. Measured final deltas:
- import { Drawer } from '@lyra-ds/react/drawer': 2616→3226B (+610), unchanged 2000B cap.
- import { BottomSheet } from '@lyra-ds/react/bottom-sheet': 2640→3257B (+617), unchanged 2000B cap.
- import { CreateWorkspaceDialog } from '@lyra-ds/react/create-workspace-dialog': 5119→5713B (+594), unchanged 3200B cap.
- import { TimePicker } from '@lyra-ds/react/time-picker': 4883→5480B (+597), unchanged 4000B cap.
- import { DatePicker } from '@lyra-ds/react/date-picker': 5997→6594B (+597), unchanged 5000B cap.
- import { DateRangePicker } from '@lyra-ds/react/date-range-picker': 6085→6680B (+595), unchanged 5000B cap.
- CommandPalette (curated icon registry + portal): 10409→11004B (+595), unchanged 9500B cap.
- RecurrenceSelector (DatePicker composition): 7725→8321B (+596), unchanged 7000B cap.
- WeeklyScheduleEditor (Popover and local inputs): 15143→15695B (+552), unchanged 14500B cap.

Alpine remains23051/21200B and was not rebuilt. Size resolution stays Task10. Source/browser proof here is local; no Linux/packedReact18/19/manualAT/fullV1/release qualification is claimed.

## Evidence and continuation
Main .batuta/runs/v1-modal-dynamic-focus contains exact briefs/reports, failures, checks-result.json, finish-checks-result.json, negative proofs, final-artifact-proof.json, all-artifacts.json, final size inputs/deltas and native results. Active feat/v1-incumbent-stabilization remains isolated. No push, merge, version, publication or resource/service change. Next Task31 background inert/topmost/parent-child ownership, Task38Popover, Task10size and Task39exact core/Alpine qualification. Blade remains deferred.

## Final independent review
GLM opencode/glm-5.3-flash124.49s,3DONE/no findings;1986-file guard unchanged and Batuta verifierPASS. Exact contract, previous full review, final source/delta and controller evidence supplied inline. All acceptance criteria approved by controller. Reviewer prose says size is "within limits" in one sentence; this is declined as inaccurate: the full measurement exits1 with12existing overages, detailed above and explicitly UNWAIVED. Its recorded failure counts and qualification boundary agree with the controller; no size approval is inferred.
