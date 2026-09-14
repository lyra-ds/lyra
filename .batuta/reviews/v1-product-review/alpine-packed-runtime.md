# Packed Alpine runtime verification — 2026-09-14

Candidate `1ed9c60c9b16980cdad36f4412adeb81d67b2989`. The existing public Alpine browser suites now have an observed run against the exact packed Alpine and Styles artifacts: **315 tests per engine, 945 total, all passed**. This is a bounded runtime proof, not full V1 acceptance.

## Executed proof

| Native engine | Public test files | Passed | Failed / pending | Duration |
| --- | --- | --- | --- | --- |
| Chromium | 32 | 315 | 0 / 0 | 84.17s |
| Firefox | 32 | 315 | 0 / 0 | 66.43s |
| WebKit | 32 | 315 | 0 / 0 | 65.59s |

All engines ran the same 315 uniquely named cases. Node24.18.0, pnpm11.13.1 and Playwright1.62.1 were used natively on macOS arm64. Browser engines are not evidence of three operating systems.

Alpine was freshly built and packed; Styles was freshly packed. Complete archive hashes match the earlier artifact qualification and the native bundle-budget measurement:

- Alpine0.6.0: `de296884efffe7bcad7f74af9a93595a74ce763edb8bb8e21587559cac09e8aa`
- Styles0.5.0: `74fd16fc24d58345b4fccdf30681b37218079dea0646f09c765727aa570489f3`

The archives were extracted into a temporary consumer under `.batuta/packed-alpine-consumer/node_modules/@lyra-ds/`. A temporary config reused the existing Alpine Vitest configuration, native Playwright provider, sequential execution, assertions, timeouts and diagnostics. It resolved the public package exports from that consumer and redirected existing test imports to those resolved files. All 32 test modules imported the extracted ESM; the public `describeRecurrence` helper was redirected to the same exported package entry. Styles imports resolved to the extracted Styles package.

The config rejected execution of Alpine production source modules. Module-load records in each engine identify the extracted ESM and CSS root with matching file hashes. ESM SHA256: `ec411e158a8cec2ab8b1d9b8b2a169ef05f3c5dfb6126bab8ddb8d37b691b3c3`. The test-only axe helper and the date-picker raw JSDoc fixture remained existing source inputs. The 7 source-only internal tests were excluded from the packed count; their earlier source-browser evidence remains separate. No tests or assertions were added or changed.

## Negative control and preservation

The existing Dropdown open/close case first passed against the extracted plugin. Replacing only that temporary extracted ESM with a no-op plugin made the same case fail with `Expected dropdown trigger` (exit1, exactly1 failed selected case,5.54s). The original ESM was restored byte-for-byte before the complete three-engine run. This proves the case depends on the extracted plugin rather than silently using source runtime.

The controller checked all 2151 tracked files against pre-run SHA256 values before writing this managed record: unchanged. Both archives and every extracted package file retained their original hashes after verification. The previous common-suite PASS from the native-budget lot remains applicable because tracked product/test/config/lock content is unchanged; no redundant full common-suite run was added.

## Scope and remaining work

This closes the observed public-component packed-Alpine runtime gap for these exact artifacts. It does not establish every family performance protocol, media/direction/coarse-pointer profile, physical-device result, native Linux/Windows result, or final V1 acceptance. The run uses installed pinned workspace test tools and the Alpine peer; it is not a fresh dependency-install compatibility matrix. No permanent runner or CI gate was introduced. No baseline reference was promoted.

Read-only Batuta research used OpenCode/`opencode/glm-5.3-flash`; the controller executed verification. The scout's claim that `describeRecurrence` must stay on source was corrected using its public export. Its bare-peer-import claim was not inferred from tsdown configuration. Raw evidence is retained in MAIN `.batuta/runs/alpine-packed-runtime-20260914/`: verification scope/config and invocation script, scout report, builds/packs, archive identities, all named-case reports, module-load logs, negative/restoration record and final proof. The temporary config and consumer were removed after hash verification; archives and evidence remain. Independent review is recorded alongside them.

No product/test/dependency/workflow/threshold edit, container/service/resource change, remote action, push, main merge, release, or restart of the old38-task loop.

Independent OpenCode/GLM review returned4/4 DONE with an unchanged-tree guard. Two minor observations about generalizing the temporary load guard were declined for this fixed, hash-verified artifact; the actual archive contains one JavaScript file and no static imports. Two informational notes were resolved or retained: the packed exports map is explicitly ESM-only, and the reviewer assessed supplied configuration/summaries while the controller executed and parsed the raw proofs. No claim of a general-purpose validator or independently repeated reviewer test run is made.
