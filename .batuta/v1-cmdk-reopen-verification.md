# CommandPalette retained-panel test — 2026-09-11

Status: bounded fixture correction verified; full React matrix is running separately.

The complete Linux Chromium run reached 818 cases without disconnecting, but the rapid-reopen test assumed that several asynchronous steps would finish before the real exit animation or 250 ms fallback removed its saved panel. An isolated 350 ms delay proved that the old panel legitimately disconnected and a new open panel appeared. This was a fixture scheduling defect.

The test now pauses the real CSS exit animation and controls only the fallback timer. It verifies the same connected panel at 249 ms, reopens, settles the real focus animation frame, crosses the former deadline by 1 ms and retains the exact panel. Stale/latest/fresh resolver counts and each captured opener remain strict. The second close releases the actual panel animation and verifies its event target, currentTarget and name. Styles, fake timers and the scoped React act environment are restored.

## Controller proof

- Final complete CommandPalette file: 31 tests per engine on host and pinned Linux, all passed with no introduced act-environment warnings.
- Removing actual production presence retention fails; restoring it passes. Removing the actual CommandPalette return resolver fails the exact call-count assertion; restoring it passes.
- The new fixture passes a disposable 350 ms real scheduling delay that exposed the old assumption. This delay is not in committed tests.
- React types, scoped ESLint/Prettier and diff checks pass. Only the test file changes; all 450 React generated artifacts remain identical.

Codex Terra medium initial448.17s, one medium retry133.21s, high107.26s for scoped act ownership. Initial controller failures (premature focus assertion, unreleased important CSS animation, then actual act warnings) remain in raw evidence. Four owned sandbox pnpm wrapper processes were stopped after hanging without output; direct pinned controller checks passed.

Independent GLM5.3Flash review29.48s: three DONE, unchanged tracked/status guard and Batuta verifier pass. Two low observations remain nonblocking: assertions inside the native event listener may add a timeout to an unexpected-event failure, and this deliberately normal-motion animation-path test is not a reduced-motion proof. Controller adjudication is retained. The 249+1 retention assertion does not claim sole-cause cancellation of an old timeout while open; internal usePresence tests cover that hook separately.

Raw evidence is MAIN `.batuta/runs/v1-focus-closure/`: cmdk worker/retry/high reports, final host/Linux logs, native negative/restored and delayed-reopen logs, artifact proof and review. No runtime, CSS, API, dependency, cap, historical baseline, VM/service, Blade or remote change.

## Separate Alpine gate milestone

After Accordion40d8084 and DatePicker040f210, the complete Alpine source matrix passed in the pinned Linux Playwright container: 319 tests across34files in each of Chromium, Firefox and WebKit. Runs used Node24.18.0/pnpm11.13.1 with384MiBheap; no connection loss or service/resource change. DatePicker's declared source/test overlay exactly matches040f210. This completes that browser gate, not the full P1 packed qualification ledger.
