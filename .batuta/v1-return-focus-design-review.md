# Modal return-focus design verification

Date: 2026-09-08. Source base b6a3c6c. Critical/self contract draft;
independent OpenCode opencode/glm-5.3-flash review. One revision, no escalation.
Both read-only rounds exit0 with unchanged HEAD/status/diff and design hashes.
Final Batuta verifier PASS: 2/2 DONE. Technical drafting task approved;
**the public API proposal still requires maintainer approval**.

Initial findings and adjudication are preserved in
v1-return-focus-design-feedback.md: closing-subtree exclusion, Drawer fresh-open
capture and example availability-state selection were addressed. The suggested
late runtime refocus was declined in favor of explicit target exclusion plus
a verification recheck after exit; the reviewer accepted this resolution.

No runtime/API, tests, dependencies, workflow, ledger or prior normative spec
changed. Source remains b6a3c6c behavior. No browser/test/build/install/Colima/Docker
operation was needed for this documentation task. Existing source anchors were
checked; proposal scope, example, eligibility, lifecycle, compatibility and
invalid-composition limits were reviewed. Scoped formatting and whitespace checks
are required before the local commit; no release-qualification claim follows.

## Final reviewer report (verbatim)

TASK 1: DONE
TASK 2: DONE

Adjudication of prior findings (all three resolved, verified against source at b6a3c6c):

1. Major, old :79 — subtree exclusion: Resolved. Design doc :99–101 now adds "MUST NOT be the closing overlay/panel or a DOM descendant of either, even if exit presence keeps it connected and visible" plus :101 composition-disposal exclusion. Verification :171–175 rejects in-panel targets while exit animation keeps them mounted and asserts focus on external destination after panel removal, explicitly framed as verification recheck, not delayed second focus attempt. Source confirms panels stay mounted through exit (dialog.tsx:257, drawer.tsx:164 — usePresence), so exclusion-at-resolution is the correct runtime prevention. Declining blanket late runtime refocus/retry is sound: with subtree targets rejected at resolution, the silent body-fall hazard cannot occur, and a late retry would violate :89 single-attempt semantics and risk post-navigation focus steal. Stronger than the originally suggested fix, internally consistent.

2. Minor, old :134 — Drawer capture re-key: Resolved. :158–161 explicitly states Drawer captures on mount only and requires keying capture on every accepted open transition as Dialog does, framing it as part of this lifecycle rather than an assumption. Source confirms the asymmetry: drawer.tsx:75–81 deps [panelRef, captureOpener] (mount-only) vs dialog.tsx:120–127 keyed on `open`, and drawer.tsx:169 nulls openerRef on close. Point 5 fresh-cycle rule (:90–93) now has a named mechanism.

3. Minor, old :45 — example state-conditional pick: Resolved. :55–57 resolver now branches on canReturnToTrigger (true → trigger ?? successor, false → successor), :66–72 prose explains the disabled-trigger branch and null-ref fallback, and the example is now a complete component body. Matches the prose mandate.

Internal consistency review: eligibility list (:95–105) is a superset of the normative opener criteria (connected/visible/enabled/non-inert/meaningful) and matches the no-body requirement at :121–129, which mirrors overlay-family-design.md:235–238 successor order and no-silent-body clause. Capture timing :76–77 matches normative "captured immediately before focus moves into the modal". Nested/owned-portal declared out of slice and unqualified (:102–103) — a scoped non-claim, not a contradiction of the normative nested clause, since Status :3–4 and :190–191 leave approved requirements unamended. Single-attempt (:89), fresh cycle (:90–93), ignored-close/initial-mount/identity rules (:79–82) and StrictMode/rapid-reopen verification (:181–183) are mutually consistent. Example resolver side-effect-free per :107–110.

Scope check: git porcelain shows only untracked docs/superpowers/specs/2026-09-08-modal-return-focus-design.md plus .batuta/ artifacts (brief, feedback, runs); zero modifications to source, tests, deps, or config; no Colima/Docker/delegation. Feedback file records per-finding dispositions; approval boundary is precise (proposed, maintainer pending, type/docs/examples agreement required before delivered).

<<<FINDINGS
none
FINDINGS>>>

