# Bounded React build verification

Base a6c0edb. Canonical `pnpm --filter @lyra-ds/react run build` now runs `node scripts/build.mjs`. The runner imports the actual tsdown config, builds its75named entries sequentially in fresh Node processes with512MiB heap, and calls existing use-client once after success. Existing config option/entry order, index-only clean, maps, dual formats, declarations, externalization and Tabs specifier rewrite remain unchanged. All other manifest fields and dependency graph are unchanged.

## Controller evidence
- Disposable supported-filter prototype51.28s:75entries/450files exactly equal to canonical host output, then original config/dist restored.
- Codex Terra medium142.18s/no retry, exactly package build field, config label and new runner. New-file status guard included.
- Actual new canonical host build39.81s and clean pinned Linux build51.73s:450files SHA-identical to reference. All ESM/CJS/declarations/maps compared, not just JavaScript payload.
- Actual invalid input source in disposable Linux copy makes canonical build exit1 in2.39s. Index reexports input, so the first entry fails and leaves zero output files. Instrumented postprocess marker is absent, proving no postprocess execution. Source and postprocess restored byte-for-byte; full recovery build50.41s emits the same450files.
- Scoped format, full React ESLint, React types, diff, publint and attw node16 all exit0.
- GLM independent review21.74s,3DONE/unchanged tracked/status guards/verifier PASS; all findings informational confirmations. Reviewer Node26 metadata read is not the build proof: controller execution used pinned Node24.18.0.

No Colima configuration, VM, service, CPU/memory/disk allocation or foreign project changed. Only per-process Node heap is bounded; Linux parent retained the existing384MiB harness setting, children use explicit512MiB CLI flag. Prior failed unmodified builds remain historical failures; the corrected canonical command now passes.

Raw MAIN .batuta/runs/v1-focus-closure/bounded-build-* and linux-bounded-build-probe.*. This task adds no assets or public API changes and does not qualify the outstanding V1 ledger or historical composition baseline.

## Separate P1 compatibility blocker
The five-file high-lane draft is preserved in MAIN raw p1-proposal-attempt1, not integrated. Actual frozen React18 consumer TypeScript fails with missing BufferEncoding through vitest/browser; the fixture lacks @types/node. A controller mock also proved omitting p1-browser still succeeds, so the proposed fail-closed guard is insufficient. Retry must provide explicit per-component execution evidence and reject missing/skipped checks, not merely unknown check names. The maintainer was asked asynchronously about @types/node24.13.3 only in the two test fixtures and their own locks; no dependency change is made without that exception. Existing FileUpload source files stayed unchanged. No P1 compatibility PASS is claimed.
