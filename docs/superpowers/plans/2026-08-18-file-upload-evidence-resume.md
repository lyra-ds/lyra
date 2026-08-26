# Resume: FileUpload Evidence

## Active runbook

The approved [2026-08-26 FileUpload Evidence Simplification Design](../specs/2026-08-26-file-upload-evidence-simplification-design.md)
defines the active gate: `DF-FU-M01` and `DF-FU-M02` use actual assistive-
technology environments, local media, reviewer approval, and local evidence
ZIPs; `DF-FU-17` and `DF-FU-18` use the exact immutable deployment revision and
workflow ZIP. Completion requires one `PASS` for each ID, one revision, one
immutable deployment, and successful `evidence:file-upload:ingest` ingestion.

1. Dispatch the evidence preview workflow for the reviewed evidence ref.
2. Download file-upload-automation-<revision-prefix>.zip from that passing run.
3. Open the immutable URL on Windows/NVDA and macOS/VoiceOver Safari.
4. Download one local evidence ZIP from each machine.
5. Run the ingestion command with the automation ZIP and both manual bundles.
6. Review the generated diff, run Task 10 gates, obtain M01/M02 approval, and commit.

```text
rtk pnpm evidence:file-upload:ingest --automation <path> --bundle <path> --bundle <path>
```

## Superseded historical context

The 2026-08-18 Galaxy-oriented handoff is retained only as historical context.
It did not execute or pass `DF-FU-M03` or `DF-FU-M04`; those former manual
scenarios are superseded by automated `DF-FU-17` and `DF-FU-18` and are not
active work or release conditions.

- Previous preview ref: `evidence/file-upload-manual`.
- Previous preview implementation commit: `2d8880ccb7555a9df226203c1931a69d5847f99f`.
- The prior deployment smoke had a Function/static revision mismatch; it did
  not produce accepted M03/M04 evidence.
