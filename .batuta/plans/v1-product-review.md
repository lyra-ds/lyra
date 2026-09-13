# Plan — bounded V1 product review
<!-- inputs: profile.md@sha256:bd14c147316c routing.md@sha256:99f96b92331f -->

**Goal:** Start one identity-bound, packed React BottomSheet P1 slice using the established Dialog-profile pattern. Preserve every remaining old-38 obligation as a focused backlog item or a decision; do not construct a new audit system.
**Created:** 2026-09-13 · **Status:** approved

## Tasks
- [ ] 1. Implement and run the packed React BottomSheet P1 producer — testing/high
      Scope: tools/v1-profiles/bottom-sheet.mjs, tools/v1-profiles/fixtures/bottom-sheet.tsx, tools/v1-profiles/dialog.mjs, .batuta/reviews/v1-product-review/react-bottom-sheet.md
      Accept: Create the missing narrow BottomSheet producer and fixture by reusing the existing profile runner, recording source and packed tarball hashes, lock identity, tool and browser versions, named cases and actual exits; Run light-theme axe, dark-theme axe, forced colors, reduced motion, LTR and RTL profiles in Chromium Firefox and WebKit, with exact tarball and fresh output paths bound before invocation and controller-captured results; Demonstrate a discriminating fixture negative control is detected and restored, with independent read-only verification of behavior and evidence; Record any product defect with its trigger, observed result, narrow owner and separately proposed repair task, without changing product code

## Decisions and context

The maintainer approved this one-task slice on 2026-09-13. Execute BottomSheet only, then stop. Acceptance here is semantic and requires the conductor to bind actual tarball/output paths and run the producer, not execute placeholder commands or treat review prose as a shell proof. The existing Dialog CLI establishes the intended producer shape: `--react-tarball PATH --styles-tarball PATH --output PATH`, with optional `--browser chromium|firefox|webkit`. BottomSheet has no producer or fixture yet, so task 1 must create the narrow producer before running it; it must not claim an existing BottomSheet producer.

macOS-only native evidence is `pnpm test` exit 0 in 149.03s, `pnpm build` exit 0 in 50.22s, and the three-engine browser matrix exit 0 in 595.43s (Styles 91, React 818, Alpine 319 per engine; 3,684 cases). It does not qualify Linux, Windows, remote workflows, packed V1 artifacts, or release platforms. Dialog/Drawer 18/18 and named React18/19 P1 evidence are reusable only when source, packed artifact, tool, and environment identities match exactly. Preserve deferred Blade, manual and touch requirements, immutable baselines, the three accepted composition exceptions, and future ceilings.

## Old-38 obligation map

| Old task | Disposition | Preserved requirement / next home |
| --- | --- | --- |
| 1 | Pending decision | No audit runner, check, registry, validator, or new report contract; use existing producers and focused evidence only. |
| 2 | Pending follow-up | Bind each future product review to committed source, packed artifact, lock, tool, and environment identity. |
| 3 | Conditional reuse | Dialog/Drawer 18/18 host-profile evidence, only after exact identity inspection. |
| 4 | Next slice | Task 1: packed React BottomSheet P1 producer and review. |
| 5 | Pending follow-up | Bounded packed React Popover P1 review. |
| 6 | Pending follow-up | Bounded packed React Dropdown P1 review. |
| 7 | Pending follow-up | Bounded packed React Tooltip P1 review. |
| 8 | Pending follow-up | Bounded packed React CommandPalette P1 review. |
| 9 | Pending follow-up | Bounded packed React WorkspaceSwitcher P1 review. |
| 10 | Pending follow-up | Bounded packed React CreateWorkspaceDialog P1 review. |
| 11 | Pending follow-up | Bounded packed React Tabs P1 review. |
| 12 | Pending follow-up | Bounded packed React DataTable P1 review. |
| 13 | Pending decision | Determine whether Alpine Dialog evidence has exact identity; otherwise propose one bounded Alpine P1 review. |
| 14 | Pending decision | Determine whether Alpine Drawer evidence has exact identity; otherwise propose one bounded Alpine P1 review. |
| 15 | Pending follow-up | Bounded packed Alpine BottomSheet P1 review. |
| 16 | Pending follow-up | Bounded packed Alpine Popover P1 review. |
| 17 | Pending follow-up | Bounded packed Alpine Dropdown P1 review. |
| 18 | Pending follow-up | Bounded packed Alpine Tooltip P1 review. |
| 19 | Pending follow-up | Bounded packed Alpine CommandPalette P1 review. |
| 20 | Pending follow-up | Bounded packed Alpine WorkspaceSwitcher P1 review. |
| 21 | Pending follow-up | Bounded packed Alpine Tabs P1 review. |
| 22 | Pending follow-up | Bounded packed Alpine DataTable P1 review. |
| 23 | Pending decision | Preserve modal-family physical touch/manual proof; emulation is not device proof. |
| 24 | Pending decision | Preserve anchored-family physical touch/manual proof; no invented target threshold. |
| 25 | Pending decision | Preserve composed-family physical touch/manual proof; no invented target threshold. |
| 26 | Pending decision | Preserve selection-family physical touch/manual proof; no invented target threshold. |
| 27 | Pending follow-up | Existing bundle collector and immutable baselines, including three accepted exceptions and future ceilings. |
| 28 | Pending decision | Runtime-family datasets and thresholds require separate approval; invent neither baseline nor SLA. |
| 29 | Pending decision | Immutable core acceptance remains a policy decision; no implementation. |
| 30 | Pending follow-up | Exact Linux CI/build qualification; container reference is not a contributor prerequisite. |
| 31 | Pending follow-up | Exact Linux Styles browser qualification. |
| 32 | Pending follow-up | Exact Linux React browser qualification. |
| 33 | Pending follow-up | Exact Linux Alpine browser qualification. |
| 34 | Conditional reuse | Named React18/19 P1 evidence, only after exact identity inspection. |
| 35 | Pending follow-up | Existing pack-smoke, smoke, publint, attw, and distribution scans. |
| 36 | Pending follow-up | Migration/docs and stack-compatibility review; Blade remains deferred and read-only. |
| 37 | Pending follow-up | Preserve all 11 P1 × 23 acceptance obligations in existing acceptance records and focused-report mapping; coverage remains pending until checked, with no registry, validator, or automatic canonical-ledger promotion. |
| 38 | Pending follow-up | Future consolidated product verdict and separately approved atomic repair proposal; never automatic approval. |

After task 1, stop. Tasks 2–3 and 5–38 remain pending, as do Linux/Windows native runs, remote workflow execution, V1 artifact/platform qualification, manual/touch evidence, baseline and runtime-policy decisions, package qualification, migration review, and Blade.
