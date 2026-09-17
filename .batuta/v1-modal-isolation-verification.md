# React modal branch isolation — local verification

Task31's remaining background isolation, topmost defaults and parent/child lifetime slice is implemented in the existing Dialog, Drawer, BottomSheet and modal CommandPalette owners. One private shared React-tree context and document registry coordinates independently built root/subpath entries. The registry shares background/retained-exit inert claims and scroll locks, elects a coherent active branch, restores exact owned attributes/styles, and disconnects its observer after the last active layer. Accepted ancestor close suppresses retained descendants without changing consumer state; suspension preserves palette query and revokes stale gestures. Public signatures, CSS, dependencies, build/export configuration and Alpine bytes are unchanged.

## Controller proof
- Nine source suites:201/201 each Chromium, WebKit and Firefox; SSR14/14. Scoped format/diff/types/lint, React build and docgen check PASS.
- Eight native runners on the same450 React compiled files:342/342 scenarios, zero probe/page errors. Mixed independently compiled entries6; branch/lifetime/StrictMode/query qualification45; owning-document isolation/Tab/scroll9; current initial/inert/removal baseline30; prior dynamic recovery171 and eligibility9; logical-close12; initial/return lifecycle60.
-153 protected declaration/Alpine files remain byte-identical. Exact source and artifact hashes, per-run results and manifest digest are bound in final-artifact-proof.json. These are local current-source/build checks, not final packed Linux/React18/19/manual-accessibility release qualification.
- Fresh source RED→GREEN proves preserved inert values, suspended gesture/shortcut defaults, captured task-action restoration, disconnected portal recovery, coherent stacking and branch promotion, sibling-portal opener capture, container-remount activation stability, foreign-document isolation/scroll, retained exit stacking, palette query preservation, and accepted-close focusin with no intermediate parent destination. Original executor snapshots and all RED logs remain immutable.
- Fixture corrections are explicit: custom-host focus waits identify the nearest active modal rather than parent.contains(child); only CommandPalette receives onOpen; standards DOCTYPE removes actual quirks warnings; prior outside-focus recovery now asserts that inert rejects the background focus attempt before removal. No console signal was suppressed.

## Size disposition
Same pinned size-limit pipeline exits1:12 React failures remain unwaived Task10. Modal-bearing entries grow1729–1897bytes. Drawer4989/2000B, BottomSheet5030/2000B, CreateWorkspaceDialog7476/3200B and CommandPalette12901/9500B. Alpine23051/21200B remains unchanged. Full per-entry before/after is retained in size-delta.json; no limit changed.

## Execution and review
Batuta guarded GLM scout/design review, then Codex gpt-5.6-terra/high initial601.24s and one446.33s retry, then critical/controller diagnosis and completion. Initial/retry reports did not substitute for controller tests. Failed nested worker initialization attempts were incidental executor behavior, not additional controller dispatches. Hook-generated .impeccable/hook.cache.json changes were audited and remain outside product staging.

Final independent GLM review80.86s:3/3DONE, no findings,1995-file unchanged guard; Batuta verifier PASS. The previous valid review's missing suspended-sibling proof and intermediate accepted-close focus were corrected and proven. Declined its missing-reopen-proof observation using the existing exact three-engine hit-test rows; final reviewer sustained the disposition. Removed unread private layer fields. Two earlier empty responses hit the model's output limit; exact metadata and the23.44s resumed findings are preserved. No approval was inferred from an empty response.

✅ Approved locally for the bounded Task31 slice. Task38 Popover, Task10 measured size resolution and Task39 exact final core/Alpine qualification remain open; Blade is deferred.

Raw proof: main checkout .batuta/runs/v1-modal-isolation/. Contract: .batuta/specs/2026-09-10-modal-isolation-design.md. Exact scope/routing/corrections: v1-modal-isolation-brief.md, v1-modal-isolation-retry.md and v1-modal-isolation-critical.md. No remote, publication, dependency, Blade or resource action.
