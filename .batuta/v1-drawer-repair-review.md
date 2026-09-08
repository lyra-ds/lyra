# Drawer pointer-origin repair review — approved with baseline limitations

Medium/Codex gpt-5.6-terra implemented two planned stages (test then repair).
Independent OpenCode opencode/glm-5.3-flash reviewed source and controller evidence:
exit 0, unchanged HEAD/status/diff and evidence hashes, three DONE verdicts.
No implementation retry or escalation. Final verdict: scoped repair approved.

## Verbatim findings

packages/react/src/drawer/drawer.tsx:101 info: backdrop-press-drag-release-into-panel still closes via common-ancestor click; identical to accepted Dialog WR-02 semantics, precedent-consistent, no action required

## Adjudication and limits

The reverse gesture observation is declined as a blocker: backdrop-origin then
release inside is outside this repair's inside-origin defect and matches existing
Dialog behavior. No broadened dismissal contract or unverified runtime claim is
introduced. Preserve the observation for a separately scoped contract review.

Criterion 2 is accepted as no new regression, with explicit remaining baseline
failures: Chromium/SSR 43/43; WebKit 32 passed / same 6 failures as the original
30 passed / 6 failures. Two new tests pass. Firefox and pinned Linux release
qualification remain pending. No all-green WebKit or release claim.

The core parser rejected the initial bold verdict lines and one formatting-only
reissue with trailing prose. Controller performed a deterministic formatting
normalization: newline after each already-present `TASK n: DONE`, preserving
all explanations and findings. Raw reports retained. The normalized report passes
Batuta verifier 3/3 DONE; no verdict was invented or changed. Read-only guards
for both GLM calls passed. This serialization correction did not change code.

Source SHA-256 was compared with tested-hashes.json after review. The original
historical reproduction remains intact; repaired replay has separate evidence.
