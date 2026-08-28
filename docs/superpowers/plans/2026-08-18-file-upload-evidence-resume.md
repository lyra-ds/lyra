# Resume: FileUpload Evidence

## Active runbook

The approved
[Lyra V1 Core Beta Release Design](../specs/2026-08-27-lyra-v1-core-beta-release-design.md)
defines Automated Core as the active beta gate. It requires the exact validated
automation archive for `DF-FU-17` and `DF-FU-18`. Missing manual evidence is
non-blocking, is labeled `deferred-by-release-profile`, and is never represented
as passed.

1. Produce a passing revision-bound automation archive.
2. Run `pnpm evidence:file-upload:ingest --profile automated-core --automation "$automation_archive"`, where `automation_archive` is the exact validated workflow download.
3. Review the explicit manual deferral, run every automated release gate, and commit the generated evidence.

## Optional Full profile

The approved
[2026-08-26 FileUpload Evidence Simplification Design](../specs/2026-08-26-file-upload-evidence-simplification-design.md)
remains the optional stricter workflow. Collect `DF-FU-M01` on Windows with
NVDA and current Firefox or Chromium, collect `DF-FU-M02` on macOS with
VoiceOver and current Safari, obtain reviewer approval, and ingest those local
bundles with the exact automation archive:

```text
rtk pnpm evidence:file-upload:ingest --automation <path> --bundle <path> [--bundle <path>]
```

Full-profile completion requires one approved `PASS` for each manual scenario
and one derived `PASS` for each automated scenario. These manual procedures are
optional post-release evidence under Automated Core and do not appear in its
completion criteria.

## Superseded historical context

The 2026-08-18 Galaxy-oriented handoff is retained only as historical context.
It did not execute or pass `DF-FU-M03` or `DF-FU-M04`; those former manual
scenarios are superseded by automated `DF-FU-17` and `DF-FU-18` and are not
active work or release conditions.

- Previous preview ref: `evidence/file-upload-manual`.
- Previous preview implementation commit: `2d8880ccb7555a9df226203c1931a69d5847f99f`.
- The prior deployment smoke had a Function/static revision mismatch; it did
  not produce accepted M03/M04 evidence.
