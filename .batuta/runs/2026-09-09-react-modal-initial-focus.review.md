# React initial focus — independent review

OpenCode/GLM5.3Flash, three lenses and3/3TASKDONE. Exit0, unchanged HEAD/status/diff/scoped SHA guard, Batuta verifierPASS.

<<<FINDINGS
Unverified controller checks (accepted as evidence, not rerun per read-only protocol): pinned types/ESLint/Prettier/build/docgen, native API 60/60, lifecycle 42/42 + 12 ignored-close, exception 9+3, whitespace 9/9, original-hidden 9/9, cross-escape 48/48, helper 17/17 per engine (.batuta/runs/v1-react-modal-initial-focus-*, v1-react-modal-initial-focus-lifecycle-native, v1-modal-ownership-native, v1-cross-modal-escape-native); size gate failing with 12 React + 1 Alpine overages tracked, not waived.

Design "minor changeset" corrected to patch — VERSIONING.md:26-27 mandates patch for 0.x additive; correction disclosed in controller proof, correct, not a failure.

Static verification passed: typed option in all four props interfaces with exact JSDoc; eligibility (same-doc HTMLElement, connected, panel containment, closest modal-ancestor equality, :disabled/fieldset, hidden/inert/aria-hidden ancestry, programmatic focusability, computed display/visibility/rects); numeric default filter handles " -2"/"\t-2" via reflected tabIndex; declared negative target accepted; resolver called once, throw → panel.focus() + exact rethrow; completedRef set before consumer code; committed resolverRef updated in effect only; open=false resets; StrictMode guard + CP frame cancel/reschedule; CP owned RAF capture-before-focus, uncaught error path; CP panel tabIndex=-1 modal-only; Escape containment: input preventDefault → panel handler skips duplicate close, panel Escape closes once and stops propagation; inline never invokes resolver; SSR resolver 0; no prop leak to DOM; exactly 15 product + changeset + 2 generated paths touched, shared helpers/package/index untouched; no suppressions/any in new code.

none
FINDINGS>>>

## Controller adjudication

No concrete defect returned. The reviewer appropriately did not rerun the controller checks in its read-only session; the controller reproduced them as documented, so that observation is not a missing proof. Accepted metadata precision: patch is required by the current0.x convention. The narrative path count is imprecise: actual scope is15product including the changeset plus2generated,17total; controller exact set/SHA gate verifies that count. Source-level observations match the final diff. Size failures remain Task10 and no fullmodal/V1 qualification is implied.
