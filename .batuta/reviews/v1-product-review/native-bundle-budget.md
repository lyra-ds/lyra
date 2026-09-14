# Native bundle budget gate — 2026-09-14

Implemented the maintainer-approved [acceptance amendment](../../specs/2026-09-14-v1-acceptance-policy-amendment.md). `pnpm baseline:bundles --check-budgets` now validates current packed artifacts against the approved numerical policy and returns a structured budget report. CI's existing build job uses this command. Exact reproduction remains available as `pnpm baseline:bundles --check`; no baseline was promoted and no runtime/release qualification is asserted.

## Behavior

- Reuses the existing frozen consumer, collector and immutable historical reference. Validates 71 React entries, one Alpine entry, five scenarios and four CSS entries; missing/duplicate/invalid data fail explicitly.
- Enforces approved absolute caps independently of candidate `passed` flags or raised manifest limits. Nine standalone and three composition exceptions are pinned to reference `0003123e`; exceeding an exception by one byte fails. Default simple/complex ceilings remain 1500/3000 bytes; reruns do not reset the reference.
- Allows the approved Tabs import transition and Alpine aggregate category. Unaccounted imports, toolchain, fixture fingerprint, externals or root-lock changes fail comparability. CSS/module measurements and drift remain in the report; no invented CSS JavaScript ceiling.
- Preserves actual architecture, OS, toolchain/configuration, candidate revision, package hashes, entry deltas and decisions. Historical architecture/package equality is not a budget criterion. Selection/extraction checks bind metadata to the actual archive, including a post-extraction checksum check and installed package name/version.
- Invokes either the pnpm JavaScript entry or native executable without a shell. Fixture fingerprint labels normalize separators and LF/CRLF. This does not prove native Linux/Windows execution; those workflow observations remain pending. The documented public entry is the pnpm command; no Docker/WSL or historical-host prerequisite was introduced.
- Preserves historical metadata property order and emits the new fixture fingerprint only for the budget command. Seven existing reproduction/acceptance function bodies remain byte-identical, including strict comparison, immutable writing/reference resolution and FileUpload runtime pairing/acceptance.

## Controller verification

Candidate `603c133` contains the final tool/test code. Fresh public command output is retained as `verified-budget-report.json`; all three tarball identities equal the previously verified candidate pair/triple, and the prior controller collection's standalone/scenario/CSS measurements match the product candidate. Budget PASS is distinct from historical exact-reproduction FAIL.

| Command | Exit | Seconds | Evidence |
| --- | ---: | ---: | --- |
| pnpm baseline:bundles --check-budgets | 0 | 47.97 | 72 standalone / 5 scenarios / 4 CSS; full public JSON retained |
| node --test tools/bundle-baseline/measure.test.mjs | 0 | 6.50 | 39/39 existing and focused regression cases |
| pnpm exec prettier --check tools/bundle-baseline/measure.mjs tools/bundle-baseline/budgets.mjs tools/bundle-baseline/measure.test.mjs .github/workflows/ci.yml docs/superpowers/baselines/lyra-v1/README.md | 0 | 1.67 | Scoped source/test/workflow/README formatting |
| actionlint .github/workflows/ci.yml | 0 | 0.23 | Existing workflow parses and validates |
| pnpm test | 0 | 161.08 | Full common project suite |

Controller replay additionally rejects missing revision, unsupported schema, missing modules/files, negative rendered bytes and Drawer exception+1. A complete record and a different-architecture record pass the numerical check; this is comparator behavior proof, not a Windows execution claim. Two critical regression cases fail before repair and pass after: actual native-program invocation and historical environment-field shape. Existing FileUpload and immutability tests remain in the passing focused/common suites.

Scope proof checks 511 protected tracked files: only the explicitly scoped active baseline README differs; production source, manifests, lock and immutable evidence/pointers are identical. The complete CI file differs by exactly one bundle-command substitution. No release/version/dependency change, container/resource/service operation, push, merge to main or remote dispatch.

## Batuta routing and failed attempts

Read-only GLM research 90.72s. Codex/gpt-5.6-terra high 685.45s produced the first candidate; its focused checks did not catch the missing fixture fingerprint in actual producer output. Controller collection failed after 63.94s, with the same actual product sizes/hashes retained. One high-lane correction 369.32s repaired validation/reporting but the real public command then failed after 2.22s because this host's pnpm is a native executable, not JavaScript. That failed attempt remains evidence.

Escalated to the conductor/critical lane: reproduced the executable failure with a real child process, added two regression cases, then fixed only launcher selection and budget-only fingerprint placement. Critical work used a second isolated checkout so the preceding candidate remained stable for independent review. No further executor loop or weakening of numerical policy.

First independent review was invalid after the provider resolved relative paths into an outer directory and denied access. A read-only full review 465.26s inspected the candidate and corroborated the historical-shape defect; its findings block was truncated, so it was not treated as a clean approval. Final bounded critical review 71.76s returned 3 DONE and a complete findings block, with unchanged-tree guard. Declined its low-priority shared-string-constant suggestion: a future label mismatch already fails closed and is not a current defect. Controller proof, not the executor's initial DONE claims, determines the final verdict.

## Remaining boundary

The native numerical gate is complete. Historical reproduction still targets old artifact identities and is not relabeled PASS. Core baseline promotion remains unavailable until applicable family runtime protocols/thresholds and exact-artifact evidence are approved and passing; the FileUpload-only acceptance path is preserved. Existing platform/media/packed Alpine runtime gaps remain separate. No new benchmark framework, automated replacement queue or resumption of the old 38-task loop follows from this delivery.

Raw brief/approval, executor logs, failed and passing collections, exact public report, scope/protected-file proof, regressions, independent review and final integration identity: MAIN `.batuta/runs/native-bundle-budget-20260914/`.
