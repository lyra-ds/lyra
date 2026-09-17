# Evidence suite runner contention

Windows job105050793493 on c533acb timed out only stale-recovery serialization at5000ms;348 other tests passed. A failed-job retry105210625851 on the same commit passed that case in1778ms but timed out stage-preview real bundling at5000ms; again348 passed. Local original recovery case passed in314ms. This supports resource contention between integration files, not a deterministic recovery failure.

OpenCode/opencode/glm-5.3-flash read-only scout identified the runner/helper deadline overlap. Its speculative Windows PID-liveness change was rejected: no direct evidence, and the unchanged recovery case passed in Windows. No runtime or timeout change was made.

The low-lane executor set fileParallelism:false only in tools/file-upload-evidence/vitest.config.ts. Real builds, bundling and subprocess integration files now run sequentially on every OS. Internal concurrent lock actors, all assertions, default timeouts and all349 tests remain.

Controller verification: complete evidence suite349/349 across13 files,15.10s, exit0; prettier and diff checks pass. Remote validation pending new push. Raw evidence in controller .batuta/runs/pr223-followup/windows-timeout-retry.log, windows-timeout-scout.log, evidence-concurrency-fix.log and evidence-serial-tests.log.
