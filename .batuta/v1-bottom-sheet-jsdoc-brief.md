You are the implementation worker already delegated by Batuta, not a conductor. Edit directly, no delegation, orchestration, worktree creation, commands using package managers, services, commits or remote writes. Read only the scoped file and this brief.
# BottomSheet captured-target JSDoc — documentation/low
## Goal
Clarify that the captured focus fallback must still be eligible. Documentation only.
## Context
Runtime shared owner and complete docs are verified in88c5211/899ed10. Independent review found the returnFocusTo prop JSDoc says the captured opener is used without explicitly repeating its eligibility condition. The generated reference mirrors this text. Controller will rebuild/regenerate after this source-only edit.
## Conventions
Use English. Preserve all existing code and formatting outside this comment. Keep prose concise. No tests or runtime changes needed for this comment-only correction. Do not read WORK, history, other skills or raw evidence.
- Follow the existing code style of the files you touch — naming, formatting, import order.
- Change only what the brief asks. Every changed line must trace directly back to the brief.
- Clean up only your own mess; leave pre-existing code alone.
- Keep functions small and names descriptive; prefer clarity over cleverness.
- Comments only for constraints the code cannot express — never to narrate what a line does.
Never: reformat unrelated code; add dependencies; drive-by refactors; touch CI/license/config; silence signals.
Work test-first from the acceptance criteria. Investigate root cause before fixing a bug; never silence a signal (cast, suppression, empty catch, sleep) instead of fixing its source — if you must, mark WORKAROUND and say so. This documentation-only proof is an exact diff review.
## Acceptance criteria
Replace only the returnFocusTo JSDoc with concise wording: resolver result is used only when eligible; otherwise an eligible previously focused opener is the fallback; composition supplies a meaningful successor when the opener can disappear or become ineligible. No change to type or runtime. Proof: git diff --check and exact single-comment diff. Controller regenerates API and compares compiled runtime bytes.
## Boundaries
No other source/tests/examples/docs/metadata changes, no installs or services. Do not edit generated outputs by hand. Do not modify WORK or .batuta.
## Scope
packages/react/src/bottom-sheet/bottom-sheet.tsx — only returnFocusTo prop JSDoc.
Do not change anything outside this list; if the task requires it, stop and report.
## Expected evidence
Changed line range and actual git diff --check result. Report generation as controller-owned pending.
## Stop conditions
Code contradicts brief; same command fails twice; wider scope required.
For criterion1 print isolated BATUTA-PROGRESS 1 START before editing and BATUTA-PROGRESS 1 DONE after proof passes.
