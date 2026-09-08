# Task 1 — critical correction
## Goal
Complete the approved Dialog/shared-owner task after initial delivery and one retry failed controller verification.
## Context
The original Task 1 brief and verbatim approved contract remain authoritative, same five-file scope. Initial executor recursively attempted delegation, then implemented; controller interrupted repeated sandbox pnpm failures. Retry completed without checks. Controller current Chromium/SSR48/49 and WebKit44/45: StrictMode restoration RED. Independent GLM review unchanged guard confirms parent opening effect resets capture guard after child capture. The real keyboard StrictMode probe also fails both engines. Independent review additionally identifies the test's invalid bare-WebKit-mouse assumption and formatting failures. All three findings accepted.
Browser focusability.log and tabindex.log prove negative tabindex, native button with invalid tabindex, first summary after a non-summary sibling are eligible in both engines; the filter currently rejects them. No dependency or resource issue requires changes.
## Conventions
Original brief conventions and method apply. Critical/self controller implements only the narrow proven correction, with test-first behavior. Test the behavior, never the mock. A failing test means fix the code, not the test. No test-only flags or branches in production code.
## Acceptance criteria
Original four criteria unchanged. New focused tests must fail for legitimate programmatic targets before repair. StrictMode keyboard probe and test must turn GREEN; all owner/Dialog Chromium/WebKit/SSR suites, types/lint/format and independent review must pass. Trusted unprepared mouse all12 cases must remain green.
## Boundaries
Original boundaries unchanged. No reset or destructive worktree cleanup: preserve raw evidence and managed records; retry source is copied into managed evidence before edits. No pnpm/download/Colima/Docker/config/dependency changes.
## Scope
packages/react/src/internal/use-return-focus.ts
packages/react/src/internal/use-return-focus.browser.test.tsx
packages/react/src/dialog/dialog.tsx
packages/react/src/dialog/dialog.browser.test.tsx
packages/react/src/dialog/dialog.ssr.test.ts
Do not change anything outside this list; if the task requires it, stop and report.
## Expected evidence
Controller logs, RED/GREEN probes, final independent read-only review, criterion verdict and atomic commit.
## Stop conditions
Contradiction, need beyond scope, or repeated post-escalation unresolved failure requires renewed diagnosis rather than another blind patch.
