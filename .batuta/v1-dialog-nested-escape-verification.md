# Nested Dialog Escape verification

Base e976cf3; implementation commit PENDING_COMMIT. Controller verdict: approved after final evidence completion.
Medium/Codex gpt-5.6-terra, one formatting-only retry, no escalation. No reasoning
override was passed; the CLI reported its inherited high effort.

## Reproduced scope

A child Dialog's Escape previously bubbled through React portal ancestry and
requested both child and parent close. closeOnEsc=false still closed the parent;
consumer preventDefault was ignored. The repair runs the consumer first, stops
only Escape propagation at the child panel, then honors defaultPrevented and
closeOnEsc. Non-Escape propagation, public API, focus owner and portal lifecycle
are unchanged. A React patch changeset records the compatible fix.

## Controller evidence

- Dedicated native StrictMode Escape proof: baseline0/10, current10/10 across
  Chromium151.0.7922.34 and WebKit26.5. Cases: normal, disabled, ignored close,
  panel cancellation and input cancellation. Normal close requests child once,
  leaves parent open, restores exactly the child's trigger after exit, then
  a second Escape requests parent close once. Page errors: zero.
- Current native runtime SHA256:
  0a1145cdaf94db928a483a1008cc94f0cae5c1cd9e000bbf780f1ea30e425970.
- Dialog/Drawer Chromium+SSR64/64; WebKit57/57. Six new nested browser cases
  preserve exact callback counts, return target and consumer/non-Escape ordering.
  Existing single-dialog and Drawer cases remain passing. No skips, only markers,
  mocked browser input, weakened assertions or product test flags were introduced.
- React TypeScript and scoped ESLint pass. Initial Prettier check failed on the
  new browser test; one same-executor retry ran only installed Prettier --write
  on that file. Final controller Prettier and ESLint pass; runtime hash is unchanged.
  The retry changed formatting only. After a review observation, the controller
  repeated Chromium/SSR, WebKit and TypeScript against the final test bytes; all pass.
- git diff --check passes. Product scope is exactly Dialog source, its browser
  test and .changeset/dialog-nested-escape.md. WORK/.batuta are managed state.

Commands and actual exit codes: .batuta/runs/v1-dialog-nested-escape/checks.json
and final-checks.json plus post-review-checks.json, with matching logs. Installed Node24.18.0 runs existing
Vitest, TypeScript, ESLint and Prettier; no install or pnpm invocation. Native
fixtures/runners and original/current JSON are retained in the same directory.
Existing invalid no-resolver composition warnings remain visible; the nested
suite asserts child restoration and does not claim parent opener restoration.
No build/docgen run was required for this internal keyboard behavior change.

## Initial probe failure and separate focus limitation

The original native runner combined Escape verdicts with an exploratory Tab
assertion. Contrary to the initial brief's statement, its retained baseline JSON
already records WebKit tabForward=false in all five variants. The same failures
occur with the fix. Diagnostic inspection shows forward Tab from the input reaches
BODY, while reverse Tab returns to the input. Chromium forward/reverse passes.
This is an existing focus-containment defect, not an Escape regression; its cause
and repair remain pending. No browser or operating-system settings were changed.

The original failed runner/results are preserved as run.mjs, red.json and
initial-green.json, with diagnostic-green.json recording the actual element.
The separate escape-run.mjs retains those Tab observations, evaluates the strict
Escape criteria independently, and checks child restoration/second parent close
on both engines. escape-red.json still fails all ten Escape cases; escape-green.json
passes all ten. It does not claim Tab containment passes or waive a focus requirement.
The brief's baseline statement was corrected explicitly; the original dispatch
wording remains in the run trail. A preliminary diagnostic command had a missing
log filename and was corrected before the probe ran; it was not a product failure.

## Boundaries and next work

Global sibling modal ordering, nested focus/inert coordination, the observed
WebKit Tab escape, initial-focus policy and other modal owners remain unqualified.
No P1 ledger entry or acceptance cell is promoted. Full packed Firefox/Linux
release qualification and the remaining incumbent backlog are still required.
No dependency, lockfile, Colima/Docker/configuration/resource change, experiment
integration, remote action, version bump or publication occurred.

## Independent review

Independent OpenCode/opencode/glm-5.3-flash review completed exit0, status/diff/
scoped-file SHA256 guard unchanged, three criteria DONE; Batuta verifier PASS.
Findings are preserved verbatim in .batuta/runs/2026-09-09-dialog-nested-escape.review.md.
- Accepted verification observation: final test bytes had only lint/format checks.
  Resolved by controller Chromium/SSR64, WebKit57 and TypeScript reruns after review,
  all exit0. No product edit or implementation escalation was needed.
- Declined WORK.md ownership concern: the controller created the active task line
  before dispatch; the executor did not edit managed state. It is the intended log.
No unresolved product findings. Raw review prompt/log, before/after guard and verifier
result are in the main checkout .batuta/runs/2026-09-09-dialog-nested-escape-review/.
A transient claude-mem availability hook blocked some read/poll commands; they
subsequently succeeded. No hook or service configuration was changed.
Owned browsers/servers exited; the two controller-owned dependency symlinks were
removed after verification. No foreign files or services were cleaned up.

