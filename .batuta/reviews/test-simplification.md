# Test simplification inventory

## Root `pnpm test` inventory

`package.json:14` is a serial `&&` chain. Its overlay command is the two-glob `node --test` invocation at `package.json:15`; therefore it reaches only the root policy file and immediate child test files, not deeper candidate, fixture, or modal/Wave 2 directories. The final recursive command is `pnpm -r --workspace-concurrency=1 --if-present run test` (`package.json:14`).

| Reachable suite / expansion | Requirement or caller | Classification and default-gate disposition |
| --- | --- | --- |
| `pnpm security:check` and `tools/security/check-lock.test.mjs` | Supply-chain lock policy; also an explicit CI lint step (`package.json:33`, `.github/workflows/ci.yml:40`). | **Keep in default.** The latter is an explicit tool-test proof; neither depends on the evaluation harness. |
| React and Alpine builds; `tools/phase0/check-artifacts.test.mjs`, `tools/bundle-baseline/measure.test.mjs`, `tools/file-upload-performance/measure.test.mjs`, `tools/phase1/browser-matrix.test.mjs`, `tools/phase1/browser-config.test.mjs`, and `tools/v1-release/check.test.mjs` | Current package/release, artifact, performance, and browser-configuration obligations, explicitly wired by `package.json:14`. Browser configuration also protects security-before-build ordering (`tools/phase1/browser-config.test.mjs:91-107`) and CI’s explicit security invocation (`:123-132`). | **Keep in default.** `pnpm test:browsers` is deliberately separate (`:85`) and CI calls it separately (`.github/workflows/ci.yml:102`). |
| Recursive workspace tests: `@lyra-ds/react` SSR; `@lyra-ds/docs`; `@lyra-ds/site`; `@lyra-ds/file-upload-evidence` | The only workspace manifests with `test`; exact scripts are `packages/react/package.json:791`, `apps/docs/package.json:11`, `apps/site/package.json:13`, and `tools/file-upload-evidence/package.json:7`. Docs and Site also invoke their documented `pretest` builds (`apps/docs/package.json:10`, `apps/site/package.json:9`). | **Keep in default.** This is the dynamic consumer expansion. Styles and Alpine have no `test` script; their browser scripts are CI’s separate browser suite. |
| `tools/overlay-foundation-evaluation/{repository-policy,candidates/{catalog,incumbent},contracts/{anchored,cells,menu,modal,protocol,spdx,tooltip,wave2},evidence/{identity,results},runner/{adapter-entry,artifacts,core,isolation,manifest,modal-cells,modal-fixture,modal,wave2-cells,wave2-fixture,wave2-ssr,wave2},scripts/{characterize-linux,check,create-behavioral-manifest,create-modal-manifest,incumbent,modal,registry-proxy,wave2-automation,wave2-command,wave2}}.test.mjs` | These 35 files are exactly the root plus immediate-child expansion of `package.json:15` (source enumeration: `find tools/overlay-foundation-evaluation -maxdepth 2 -type f -name '*.test.mjs' -print | sort`). They test the retained-but-suspended overlay comparison harness: candidate catalogs, contracts, evidence, runner isolation, diagnostics, and scripts. The current plan says the old 38-task loop and comparison experiment are suspended (`.batuta/plans/test-simplification.md:30-31`). | **Explicit suspended experiment**, except the one active policy subtest below. Do not infer that all overlay tests are obsolete: modal/Wave 2 commands remain explicit experiment commands (`package.json:16-20,47-50`) and must remain intact outside the ordinary gate. |
| `repository-policy.test.mjs`: “keeps experimental foundations out of workspace manifests” | Retaining the incumbent requires preventing experimental foundation dependencies from entering all workspace manifests; it scans the root and each immediate `packages/`, `apps/`, and `tools/` manifest (`tools/overlay-foundation-evaluation/repository-policy.test.mjs:106-151`; workspace patterns at `pnpm-workspace.yaml:3-5`). | **Keep in default, minimal retained entry proposed:** `node --test --test-name-pattern='^keeps experimental foundations out of workspace manifests$' tools/overlay-foundation-evaluation/repository-policy.test.mjs`. This preserves the concrete active prohibition without retaining the full harness suite. Task 2 must prove the changed chain, not treat this inventory as a pass claim. |
| Remaining `repository-policy.test.mjs` obligations: core-root-script wiring (`:77-100`), shallow-checkout mutation probe (`:153-232`), candidate metadata (`:234-288`), diagnostic and plan docs (`:290-348`), fail-closed harness threat-model docs (`:350-358`), and command forwarding (`:360-389`) | Each asserts an evaluation command, candidate/evidence record, or harness document. The threat boundary expressly applies before external candidates execute (`tools/overlay-foundation-evaluation/README.md:174-180`; design spec `docs/superpowers/specs/2026-08-31-overlay-foundation-evaluation-design.md:110-116`). | **Explicit suspended experiment.** The threat-model assertion is security-sensitive but scoped to the suspended harness; it is not evidence of a general product-security requirement. Preserve the files and explicit commands, but remove them from the ordinary contribution chain only through task 2’s scoped change. |

## Exclusions, surviving consumers, and recommendation

The exact proposed exclusion is `pnpm overlay:evaluate:core:test` from the root chain, **not** deletion of its script, its files, `overlay:evaluate:modal:test`, or `overlay:evaluate:wave2:test`. CI presently calls root test in the container, then separately calls browser and React-compat suites (`.github/workflows/ci.yml:86-103`); it has no separate call to overlay core. The root-order assertion and the policy file’s hard-coded root coupling (`tools/phase1/browser-config.test.mjs:91-107`, `tools/overlay-foundation-evaluation/repository-policy.test.mjs:77-100`) are therefore direct task-2 consumers that must be updated together.

**Task 2 recommendation:** replace the root’s broad overlay-core step with the minimal retained manifest-prohibition invocation above, immediately after `pnpm security:check`; update only the two already-scoped policy/order assertions to that contract. Retain security-before-build, explicit tool tests, and serialized recursive workspace testing. This is within the approved task-2 scope. A blocker exists only if that isolated subtest proves to require a suspended harness dependency or if preserving it demands a new security design; then stop and propose that exact dependency rather than broadening scope.

## Existing failure evidence and uncertainty

Fact: at `9384eb3`, macOS Node `24.18.0` / pnpm `11.13.1` ran the global chain and exited 1 after the evaluation suite reported 693 tests: 530 pass, 161 fail, 2 skipped (`.batuta/v1-loop-preflight.md:9-14`). Later chained suites were not shown to pass. A separate canonical-`TMPDIR` probe of only `evidence/results.test.mjs` exited 1 with 32 tests, 21 pass, 11 fail and `anchored evidence traversal through /proc/self/fd is unavailable` (`.batuta/v1-loop-preflight.md:12-18`). Raw-log identities are listed at `:20-23`.

Unknown: the evidence does not establish a common cause for all 161 failures, that every evaluation failure is unnecessary, that the proposed retained entry passes natively, or that removing the experiment makes the full root gate pass. No test, install, diagnostic, container, or external action was run for this inventory.

## Read-only evidence

- `sed` read `.batuta/profile.md`, the approved plan, preflight, review, `package.json`, workspace manifests, CI, and the two coupled test files.
- `rg` located root scripts, workspace `test`/`pretest` scripts, CI consumers, policy subtests, and threat-model references.
- `find tools/overlay-foundation-evaluation -maxdepth 2 -type f -name '*.test.mjs' -print | sort` enumerated the glob-reachable evaluation files.
- `git status --short` was read before writing; no pre-existing changes were reported.

## Task 2 implementation evidence

The root `pnpm test` chain now keeps `pnpm security:check` first, then runs only
the active manifest prohibition with the native Windows-compatible command
`node --test --test-name-pattern="^keeps experimental foundations out of workspace manifests$" tools/overlay-foundation-evaluation/repository-policy.test.mjs`.
The broad `overlay:evaluate:core:test` command remains defined as an explicit
suspended experiment command, together with the modal and Wave 2 commands.
The normal chain still builds React and Alpine before the existing tool-test
group and retains serial workspace tests (`--workspace-concurrency=1`).

Focused passing evidence on macOS, Node 24.18.0 and pnpm 11.13.1:

| Command | Exit | Result |
| --- | --- | --- |
| `node --test tools/phase1/browser-config.test.mjs` | 0 | 8 pass, including the security → manifest prohibition → build order and separate browser/serial workspace contract. |
| `node --test --test-name-pattern="^keeps experimental foundations out of workspace manifests$" tools/overlay-foundation-evaluation/repository-policy.test.mjs` | 0 | 1 pass: the retained active manifest prohibition. |
| `node --test --test-name-pattern="^keeps suspended evaluation commands explicit and the manifest prohibition in ordinary tests$" tools/overlay-foundation-evaluation/repository-policy.test.mjs` | 0 | 1 pass: explicit experiment commands remain intact while root omits core evaluation. |
| `node --test --test-name-pattern="^documents the cumulative local diagnostic boundary$" tools/overlay-foundation-evaluation/repository-policy.test.mjs` | 0 | 1 pass: the updated README retains required diagnostic-boundary documentation. |

Disposable command-chain failure probe (no source files were edited):

```sh
node -e "process.exit(23)" && node -e "process.exit(0)"
```

The command exited 23; the succeeding child did not run. This separately proves
native double-quoted child arguments preserve a failing child’s nonzero exit in
the `&&` chain.

Limitation: `pnpm test` was intentionally not run here. Full default-gate
verification remains controller-owned after its frozen installation; no global
PASS is claimed by this task. Suspended experiment diagnostics, Docker, and
Colima were not run.

## Task 2 controller verification

Full `pnpm test` exited 0 in 149.03 seconds on macOS with pinned Node24.18.0/pnpm11.13.1 after frozen installation in the owned task checkout. Working tree remained clean. Controller also reran browser-config (8 pass), explicit-command and README-boundary contracts (2 pass), and scoped Prettier (pass). A disposable package using the actual root command chain with its first child deliberately replaced by exit23 propagated exit23 through `pnpm test`; temporary root removed. Raw logs and command results: MAIN `.batuta/runs/test-simplification-execution/task2-controller-test.log`, `task2-controller-test.json`, `task2-chain-probe.json`.

Independent OpenCode/GLM review found no blocking source issue. Initial round could not read paths and is invalid; inline-evidence retry completed read-only. Its pending full-gate observation is now satisfied by the controller run. Its task3-not-started observation concerns the next plan task, not this change. Its generic-probe limitation was addressed by the actual pnpm-chain probe above; a passing suite alone would not prove failure propagation. No Linux/Windows or V1 qualification claim.
