# Dependabot disposition — 2026-09-09

The maintainer asked whether existing dependency updates belong in current V1 stabilization. Compatible maintenance should be evaluated before final candidate measurement, so qualification targets the final lockfile. Do not merge the grouped PR merely because its label says minor/patch. No dependency changes or remote writes have happened in this audit.

## Current PRs and evidence

| PR | Observed head | Disposition |
| --- | --- | --- |
| [221](https://github.com/lyra-ds/lyra/pull/221) | ef0dee1b01deee506f318c59ccd610b05765dff1 | Split compatible maintenance from pinned browser/Vite evidence migrations. Test/build red in run 34271808655; diagnose below before integrating. |
| [220](https://github.com/lyra-ds/lyra/pull/220) | 5c333c213c80c924372753f0aa6e41890d5cb3df | Suitable bounded CI-only update after obsolete experimental checkout-freeze gate is repaired. pnpm/action-setup 6.0.10 to 6.1.0 adds pnpm 12 support; repository remains pinned to 11.13.1. Run 34270734805: lint/typecheck/build pass; test fails on frozen workflow-tree hash. |
| [203](https://github.com/lyra-ds/lyra/pull/203) | 3733d02c2fe07cc985e1c6c58459dda594aebfb3 | Defer migration to a separate release-tooling task. Changesets action 2 requires CLI 3, renames inputs and requires github-token instead of GITHUB_TOKEN env. Existing release workflow still uses old inputs and env token. Green ordinary CI does not exercise publication. |
| [202](https://github.com/lyra-ds/lyra/pull/202) | 8a310c56e050816c21079534c814a9bcdb4c42e9 | Defer with Changesets migration. Changelog package 1.0.0 is ESM and changes Node support; compatibility must be verified with the selected CLI/config. |
| [201](https://github.com/lyra-ds/lyra/pull/201) | caa867006ee7b6906155c49f498444bb60873b3c | Defer with Changesets migration. CLI 3 changes tag command, no-op exit status, private-package/version behavior and peer-dependent bump policy. None is needed to repair current component defects. |
| [199](https://github.com/lyra-ds/lyra/pull/199) | 29636700328adc98dc122082a44c3d0c4c91403b | Separate CI-only migration; inspect intermediate major compatibility and artifact consumers before adoption. Not a runtime library or V1 component prerequisite. |

## Grouped maintenance failure diagnosis

The root experimental repository-policy test hardcodes dependency values and git objects for packages, workflows and lockfile. It rejects legitimate committed maintenance and will also reject current incumbent product commits. Preserve actual historical experiment artifacts and their no-integration controls while removing the unintended freeze of unrelated ongoing maintenance; do not refresh hardcoded snapshots each time or simply skip the test. The shallow-clone regression must keep meaningful coverage.

The native touch/Unicode bridges require exact Playwright 1.62.1, and Vite-backed evidence requires 8.2.1. CI pins the matching Playwright 1.62.1 image by digest. Hold these two versions until their coordinated migration is independently qualified. Do not relax version assertions to accept unverified tools.

PR 221's build completed workspace builds, packing, cold consumers, size-limit and bundle measurement. The reported final baseline drift binds the changed lockfile and React/Alpine tarball hashes. This is not proof of a runtime regression or a zero-size change. Remeasure and review final artifacts after selected updates and component fixes; never replace expected hashes without measurements.

Selected candidate maintenance from PR 221, pending actual installation/checks: @types/react-dom 19.2.7, eslint 10.10.0, publint 0.3.24, stylelint 17.15.0, typescript-eslint 8.69.0, vitest-browser-react 2.3.0, wrangler 4.129.0, lucide-react 1.41.0, fumadocs-core 16.15.7, fumadocs-mdx 15.4.0, next 16.3.4, next-intl 4.14.2. tsdown 0.23.0 and Alpine 3.17.1/CSP 3.17.1 require targeted build/runtime compatibility before selection. No new dependency names or experimental foundation integrations.

## Primary sources and retained raw evidence

- [pnpm action 6.1.0](https://github.com/pnpm/action-setup/releases/tag/v6.1.0)
- [Changesets action 2.0.0 migration](https://github.com/changesets/action/releases/tag/v2.0.0)
- [Changesets CLI 3.0.0](https://github.com/changesets/changesets/releases/tag/%40changesets/cli%403.0.0)
- [Changelog GitHub 1.0.0](https://github.com/changesets/changesets/releases/tag/%40changesets/changelog-github%401.0.0)
- [Upload artifact 7](https://github.com/actions/upload-artifact/releases/tag/v7.0.0)

Raw gh JSON, diffs and failed-job logs are preserved in the main checkout's .batuta/runs/v1-dependency-triage/. They were read-only requests. Do not report pending candidate updates as installed or approved by tests.

## Selected first maintenance batch

After inspecting coupled fixture pins, select11 existing tooling/docs updates: @types/react-dom19.2.7, eslint10.10.0, publint0.3.24, stylelint17.15.0, typescript-eslint8.69.0, vitest-browser-react2.3.0, wrangler4.129.0, fumadocs-core16.15.7, fumadocs-mdx15.4.0, next16.3.4, next-intl4.14.2. Apply consistently in root, docs, site and file-upload-evidence manifests where each already exists. These remain candidates until installed and verified.

Hold the remaining six PR221 updates for separate coordinated qualification: Playwright/Vite have exact native-evidence/image pins; lucide-react1.30.0 and Alpine3.15.12/CSP3.15.12 are pinned by the packed React18/19 and bundle-consumer fixture locks; tsdown0.22.14 is the current artifact compiler. This first batch keeps published React runtime dependency and Alpine runtime/test baseline versions stable while addressing tooling and docs maintenance. Fixture pins are in tools/react-compat/fixtures/{react18,react19}/package.json and their locks, tools/bundle-baseline/fixture/package.json and lock, and tools/react-compat/file-upload.test.mjs. No claim that those held updates are broken; they require a larger coordinated artifact/fixture comparison than this selected batch. No new dependency names or foundation work.

The primary run-status proof requested by independent review is now retained as main .batuta/runs/v1-dependency-triage/run-34270734805-status.json: exact PR220 head, testfailure, lint/typecheck/buildsuccess. The maintenance freeze was independently repaired in1b7629e (policy10/10, release108/108 plus CLI); this does not qualify any selected library update.

## Selected maintenance integrated locally — 2026-09-09

PR220 workflow action update is committed in87f7775. The selected11 existing-library batch is verified:16 manifest entries, generated frozen pnpm11.13.1 lock/install, four builds, recursive types, all linters, React765, evidence349 (including actual Pages Functions compilation), docs316+36, site20 and publint3 pass. Public importers and all453 generated public files remain identical. The old ESLint peer warning remains;9 React size-budget failures are identical with old/new dependency graphs and separately attributed to incumbent source stabilization. They remain release blockers under Task10. See .batuta/v1-library-maintenance-verification.md. No remote PR merge/push, new public runtime dependency or release performed. Held six PR221 updates and separate Changesets/artifact-action migration dispositions remain unchanged.

## Evening recheck — September9,2026
Read-only GitHub PR list confirms the same six open Dependabot PRs. PR221 remains ef0dee1b01deee506f318c59ccd610b05765dff1; PR220 remains5c333c213c80c924372753f0aa6e41890d5cb3df. Existing11-library/action dispositions remain current; no new batch/merge/publication. Raw main .batuta/runs/v1-dependency-triage/open-prs-2026-09-09-evening.json.
