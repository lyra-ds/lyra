# V1 final gate audit — local verification, qualification pending

The incumbent Styles/React/Alpine V1 qualification is still in progress. This run executes existing CI and release-policy gates and repairs demonstrated prerequisites. It does not publish or version the packages, qualify Blade, reset historical baselines, or turn missing release-matrix evidence into a pass.

## Candidate and scope

Started at a00b853. Verified local corrections: 5ff3aa8 adds the missing client boundary to the DataTable documentation example; 71ef227 preserves operational evidence outside product formatting; e36b88a isolates the Tooltip focused-expiry fixture from physical hover; 4b324ef makes usePresence fixture observation deterministic with native CSS events and a controlled fallback clock. Final browser candidate: 4b324eff4fb2464b109d8e8cfcd62e5ab9c5c9fa. No library runtime, CSS, dependency declarations, lockfile or size caps changed. The 453 generated files (302 runtime/declaration files plus source maps) match the approved6dacf7e artifact hashes exactly.

## Execution profile

Host Node24.18.0/pnpm11.13.1 on macOS arm64; the default shell Node26 was not used for controller gates. Browser/security-evidence checks use the CI-pinned Playwright1.62.1 Noble image digest dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e, Linux arm64, Node24.18.0 and a disposable exact source checkout. The Linux install is frozen and retains the original lockfile. Historical caches were privately cloned; no dependency was added to the project.

The initial container installation was OOM-killed. Reducing pnpm workers to1, child concurrency to1, network concurrency to2 and the package-manager heap to1024MiB allowed installation to pass. The unchanged React build script still OOM-killed in the VM; its host build passed. Complete host-generated dist was copied into the isolated checkout with all453 hashes verified, enabling remaining Linux tests without claiming a successful Linux build. Colima configuration, memory/CPU settings and other projects were not changed or stopped.

## Demonstrated corrections

- DataTable example: original production docs build failed because useState crossed a server-component boundary. The two-line client directive fixed the full docs build; docs lint/types and actual exported-page Atlas click/Orbit Enter behavior passed with no JavaScript errors. Initial diagnostic URLs were corrected to the actual /en/components/data-table page; no fixture or runtime workaround was introduced.
- Formatting: initial full lint reported616 files,216 tracked, all tracked failures confined to operational .batuta evidence and WORK.md. The ignore delta excludes operational .batuta and the generated Impeccable hook cache while retaining product/documentation coverage. WORK formatting was one blank line. Controller full lint passed; independent Codex final2DONE/no findings after correcting reviewer evidence-checkout and pre-existing-untracked-state context.
- Tooltip test: full Linux Chromium had817PASS/1FAIL. Physical hover moved from the first trigger onto the second during removal, so the fixture was not testing focus-only ownership. Instrumentation demonstrated native mouseover and absent warmth-expiry timer. Native pointer parking plus explicit no-hover assertions retained300/499/1ms boundaries. All13Tooltip cases passed in each engine. Disabling the real coordinator expiry in the disposable copy caused1expected failure; restoring source produced1pass. Production Tooltip was not changed.

- Presence tests: the monolithic rerun exposed wall-clock assumptions around120ms CSS exits and250ms fallback. Medium initial/retry did not flush React correctly and then deadlocked nested act/rerender; high corrected only the fixture by releasing committed paused CSS timelines inside act. Controller10tests passed perengine; four production faults each fail their corresponding DOM assertion, restored10PASS; types/lint/format/diff passed. Initial highFirefox disconnected after5passes; unchanged retry passed10. Independent GLM final3DONE/no findings with unchanged guard; initial external evidence access and formatting failures are retained. No runtime edits or larger animation windows. See presence-disposition.md in raw evidence.

## Completed non-matrix evidence

The13static commands have passing final results, using format-fixed.log for the original formatting failure. Of22build/packaging commands,21have passing final results, using docs-fixed build evidence; bundle-baseline remains failed. These are separate successful commands on the identified host, not a successful uninterrupted Linux CI job.

Linux core tests:691PASS/2existing opt-in skips; supporting tools201PASS. The opt-in native file then passed all35tests (including the2previously skipped cases) after the controller supplied the required OVERLAY_WAVE2_CONTAINER=1 alongside NATIVE_TEST=1 in the pinned container. Initial missing-marker failure34PASS/1FAIL remains. No comparative candidate evaluation was resumed. Host workspace package test leg passed: React99, docs316, site36, examples20, file-upload evidence349. Release-policy tests and host React18.3.1/19.2.8 compatibility runner passed. The latter covers FileUpload only.

Styles source browser suite passed89tests in each engine. Original React matrix817PASS/1TooltipFAIL; postTooltip monolithic rerun460PASS/2presenceFAIL/connectionloss, Alpine64partialPASS/connectionloss. These partial attempts remain failures. The proposed6-file matrix was interrupted after repeated browser disconnections: first two Chromium batches passed44+95tests; batches3/4 returned nonzero despite JSON success and contained files with zero executed assertions. A default+JSON reporter diagnostic confirmed another connection loss in a different file. Browser fileParallelism was already false; no serialization change is claimed. The82React/34Alpine-per-engine manifest is an intended inventory, not completed coverage. No full browser matrix pass is claimed.

## Interpretation

Root pnpm test on macOS cannot qualify the Linux security-evidence implementation: initial failures involved noncanonical /var paths; a canonical temporary-root run isolated the remaining /proc/self/fd Linux requirement. Both failures remain in raw evidence. Existing core tests are executed in the required Linux environment without weakening filesystem protections. Parallelism is reduced for resource safety; test assertions and source remain unchanged.

Existing v1-core and v1-release commands check policy and ledger consistency, not completion of every acceptance cell. The release ledger still has11P1 components with an empty acceptanceEvidence map and releaseStatus planning. The current React18/19 compatibility runner exercises FileUpload; it must not be described as qualification of all11P1 components. Under the existing Automated Core profile, missing manual AT evidence remains deferred-by-release-profile and is not a pass. Full-profile requirements remain intact.

## Remaining release conditions

- Historical bundle baseline drift is unwaived: actual artifact/lock changes coexist with architecture and macOS temporary-path representation differences. The accepted11standalone caps do not authorize a scenario/migration-delta/historical-baseline reset.
- Complete exact packed-candidate per-component evidence for the applicable23cells, including uncovered environment, hydration and React-version claims, and link migrations/compatibility evidence before updating qualification metadata.
- Record the full Linux build/CI job as unavailable in the existing VM until it can actually pass in an authorized environment. Successful host builds and split Linux tests do not constitute an uninterrupted CI job pass.
- No V1-stable/released claim, publication, version, push, merge or remote workflow dispatch is implied.

Raw evidence: MAIN .batuta/runs/v1-final-gates/. All initial failures, retries, source fault proofs and declared limitations are retained. Linux disposable source was tracked-clean at4b324ef before cleanup. All raw browser artifacts were moved to MAIN .batuta/runs/v1-final-gates/linux-artifacts/; the exact owned temporary root was removed and no own containers remained. Historical caches and foreign services were preserved; see linux-final-cleanup.json. Host comparison is recorded below; independent audit disposition is appended after review.

## Gate disposition

| Gate group | Local result | Qualification limit |
| --- | --- | --- |
| Static/security/policy/parity/icons | PASS after formatting correction | Policy success is not acceptance-cell completion |
| Host builds/types/docs/package exports/scans/pack smoke | PASS | Linux React build was killed; no Linux build pass |
| Standalone sizes | PASS,72entries | Historical/scenario/delta baseline unwaived |
| Bundle baseline check | FAIL | Preserve historical file and explain measured drift before any reset |
| Linux core/supporting tools; host workspace tests | PASS separately, native opt-ins also proven | Root host pnpm test failed on Linux-specific filesystem assumptions; no single Linux root command pass |
| Styles browser matrix | PASS,89perengine in pinned Linux | Source suite only |
| React/Alpine full Linux browser matrix | INCOMPLETE/FAIL | Repeated runner connection loss, including bounded batches |
| Focused Tooltip/usePresence fixes | PASS in all3engines, negative controls detect defects | Does not replace complete React/Alpine matrix |
| React18/19 compatibility runner | PASS on host | Existing FileUpload-only scope;11P1 qualification not established |
| V1 release acceptance ledger | PLANNING | Per-component exact packed evidence still incomplete |

## Required next work

1. Finish the pinned Linux browser matrix and Linux build in an authorized environment where these commands can complete. Diagnose the disconnection using preserved traces; do not assert OOM without evidence. Keep all resource/service boundaries in force.
2. Resolve the historical bundle baseline with a concrete reviewed measurement/decision. The accepted standalone cap update neither changes bytes nor authorizes resetting historical or scenario/delta expectations.
3. Bind the final packed artifacts to each applicable release cell, including environment, SSR/hydration, supported React versions and remaining anchored placement/ownership evidence. Preserve Automated Core manual deferral and Full requirements.

Task39 remains open. This audit makes no stable V1, Blade compatibility, published release or full CI claim.

## Host browser comparison — diagnostic, not Linux qualification

The full existing `pnpm run test:browsers` command ran on macOS arm64, Node24.18.0/pnpm11.13.1, candidate4b324ef, with CI unset (therefore without CI video recording). Exit1 after722.46seconds. This differs in OS and recording overhead from the pinned Linux run; success here cannot prove the cause of Linux disconnections.

| Package | Chromium | Firefox | WebKit |
| --- | --- | --- | --- |
| Styles | 89PASS/6files | 89PASS/6files | 89PASS/6files |
| React | 818PASS/82files | 818PASS/82files | 818PASS/82files |
| Alpine | 315PASS/34files | 315PASS/34files | 313PASS/2FAIL/34files |

Alpine WebKit failures are `accordion.browser.test.ts:166` (native Tab from second trigger expects the following button, receives BODY) and `date-picker.browser.test.ts:249` (mobile day selection closes the sheet, but expected opener focus receives BODY). Isolated rerun reproduces2FAIL/11PASS across the two files, exit1. They remain failures; no skipped test, permissive assertion or product change was introduced. Failure traces/screenshots are retained in host-alpine-failures/ alongside the complete command logs.

A standalone Playwright WebKit26.5 macOS control with plain native HTML and no Lyra reproduced two platform behaviors: Tab from a button skipped later buttons and reached an input; clicking an already-focused button moved focus to BODY. This demonstrates that the test's initial focus/Tab assumptions do not hold in this environment. It does not by itself qualify the actual DatePicker return-focus contract, waive either failure or establish correct behavior on all Safari configurations. Resolve these two native focus cases explicitly during the pending environment/ownership qualification.

Final453artifact SHA comparison at4b324ef matches the approved reference exactly (302runtime/declaration files,151maps); see final-artifact-identity.json.

The disposable DatePicker probe narrowed the actual focus path: `bottom-sheet.ts:118` captured BODY at opening; `restoreReturnFocus` received that BODY and classified it ineligible while the calendar button was active. Thus this failing case did not lose a successfully restored opener: no eligible opener was captured. The plain-click control reproduces the preceding focus reset. The default captured-focus contract versus an explicit logical trigger destination must be addressed with the intended pointer/keyboard behavior preserved, not by weakening the assertion. Raw datepicker-capture-final.log/json retain1expected diagnostic failure; scratch root removed. Earlier probe launch failures (pnpm auto-install attempted on borrowed links and aborted before removal; then incorrect package-local Vitest path) are retained, corrected by the existing root Vitest entry without installation. All probes were disposable; ACTIVE product files remain unchanged.

Independent GLM read-only localization148.81s confirmed ownership anchors and left runtime/contract qualification unclaimed. Its unsupported generalization about known WebKit inert quirks is not adopted; the native controls above supply the actual evidence.

## Independent audit disposition

GLM5.3Flash final195.04s,3DONE/no findings, tracked/status/report unchanged guard, Batuta verifierPASS. Initial102.39sStyles evidence finding was declined after supplying the exact missing Linux log prefix: all three Styles subcommands finished89/89 before the later React failure. No completed step or failing overall command was reclassified without evidence. Final pinned host formatting check passed9.66s. This approval covers the accuracy of this audit, not V1 qualification.
