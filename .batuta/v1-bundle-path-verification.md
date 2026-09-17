# Bundle module-path portability — 2026-09-11

Status: bounded path normalization correction verified. Historical baseline acceptance remains open.

The collector received canonical macOS `/private/var/...` module IDs while its temporary fixture root used the equivalent `/var/...` spelling. Literal prefix comparison leaked machine-specific paths into reports. Normalization now considers literal and real filesystem paths per owner, with the fixture taking precedence over the repository. Existing complete-prefix boundaries, unmatched paths and virtual/query fallback behavior are preserved. No measurement formula, numeric budget, comparator, acceptance rule or historical evidence changed.

The first implementation checked all literal roots before canonical roots. Controller reproduction showed that a real repository parent could incorrectly win over an aliased fixture. One medium retry now checks both alternatives for the fixture before considering the repository; the real mixed-root case is in the regression.

Controller Node24.18.0: all29unit tests pass, including existing metric-drift and acceptance checks. Replacing the owner with its HEAD version fails the new real-symlink test; restoring the corrected owner passes both focused tests. Scoped Prettier and diff checks pass. Temporary fixtures and the controller's unique test cache were removed. The worker-created four-file npm cache was removed only after creation-time/content ownership checks; the user's shared cache was untouched.

Codex Terra medium205.80s plus one medium retry144.88s. The retry's full test run could not write its sandbox npm cache; direct controller tests with an owned writable cache passed. Independent GLM45.15s: three DONE, unchanged tracked/status guard and Batuta verifier pass. Controller disproved the suggested literal `#` path regression: literal matches still normalize before the optional canonical fallback. Bounded report-time filesystem calls were accepted as nonblocking; no global cache was added.

Raw evidence: MAIN `.batuta/runs/v1-focus-closure/`, baseline-path briefs/workers,29-test controller log, original/restored negatives, mixed-root counterexample, fragment proof, cache ownership/cleanup and review/adjudication. Fresh full collection follows separately. Actual bundle growth remains unwaived; FileUpload-only acceptance and the old current pointer were not changed.
