# PR 219 review resolution

Date: 2026-09-06. Scope: the five initial CodeRabbit review threads.

| Finding                                           | Disposition                                                                                                                                                                                                          | Verification                                                                                                                                                                                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Render errors leave readiness pending             | Fixed in `247cc4f`: both React roots reject caught/uncaught errors; failure cleanup also covers deferred hydration and preserves flat cleanup errors.                                                                | Controller: 25 runtime tests pass. Original source fails the new root-callback regressions. Independent GLM review: four criteria complete.                                                                                                  |
| Restored tracker remains globally cached          | Fixed in `c2d2f7a`: restore releases the cache; reinstall accounts new activity and stale restoration does not disable the new tracker.                                                                              | Controller: 3 shared tracker tests pass; original source fails both new regression tests.                                                                                                                                                    |
| Symlinked temporary roots fail bundle containment | Fixed in `69b8905`: canonicalize the isolated bundle root before comparing Vite module paths.                                                                                                                        | Controller: 88 anchored/menu/tooltip tests pass with `TMPDIR=/tmp`; original source fails the anchored containment test.                                                                                                                     |
| Declared-path assertions mask validation failures | Fixed in this follow-up: exact error messages, valid derived files, and a genuinely wrong declared family for modal; regular-file checks remain separate.                                                            | Controller: 19/19 entry tests pass; bypassing declaration validation makes the suite fail. Resolver restored byte-for-byte. Independent Codex review: three criteria complete, no findings.                                                  |
| Enable strict resource reconciliation for modal   | Declined to preserve the explicitly approved modal compatibility contract. The legacy protocol accepts resource-free snapshots and validates resource shapes when present; Wave 2 opts into stricter reconciliation. | Controller: original modal protocol passes 15/15; binding the same tests to `requireResources:true` fails 4/15. The flag additionally requires lifecycle fields and changes JSON validation. Rationale posted in the original review thread. |

The render correction used Codex / `gpt-5.6-terra`, followed by controller
verification and independent OpenCode / `opencode/glm-5.3-flash` review.
The first executor attempt recursed into delegation and delivered no code;
an explicit executor-role retry delivered the fix. Controller review caught
duplicate aggregation of cleanup failures, corrected before commit.
The three smaller corrections use OpenCode / `opencode/glm-5.3-flash`.

Independent render-review notes were adjudicated: retrying an already failed
fixture is outside the shipped single-pass evaluation; warning-accounting
behavior was preserved rather than changed. The new recoverable-error test
proves readiness, not exhaustive warning counts. These limits are not claims
of new coverage. The callback/cleanup regressions use the existing injected
root interfaces; this is not a new live-browser render-failure experiment.

Run 10 and its manifest remain immutable evidence for `ce36f32`; the original
13 gates remain bound to `cd08797`. Review corrections do not relabel those
artifacts as a fresh evaluation. No diagnostic rerun, foundation selection,
production migration, deployment, release, or merge is included.

## Consolidated verification

Controller reran 144 modal/shared/Wave 2 fixture, protocol, and entry tests:
144 passed, no skips. All 88 candidate adapter tests also passed with the
symlinked `/tmp` prefix. Formatting and diff checks passed for the changed files.

The full core suite on macOS reported 625 passes, 66 failures, and two guarded
skips. Of those failures, 63 explicitly report the pre-existing Linux `/proc/self/fd`
evidence traversal unavailable on this host; three assert a later error shape
that was not reached. Evidence and modal-runner implementations are unchanged.
This is not a green full-suite claim. The Linux CI run on the new PR HEAD is
the complete gate; prior green CI belongs to earlier commits.

The entry-test executor's external temporary-backup command was automatically
denied. The controller completed the mutation proof using an in-memory backup
and a finally-based byte-for-byte restore. One feedback pass corrected the
modal wrong-family case. Tests use `TMPDIR=/private/tmp` on macOS to avoid
pre-existing lexical-versus-canonical path assertions in other entry cases.
