# Plan — bounded V1 product review
<!-- inputs: profile.md@sha256:bd14c147316c routing.md@sha256:99f96b92331f -->

**Goal:** Start one identity-bound, packed React BottomSheet P1 slice using the established Dialog-profile pattern. Preserve every remaining old-38 obligation as a focused backlog item or a decision; do not construct a new audit system.
**Created:** 2026-09-13 · **Status:** done

## Tasks
- [x] 1. Implement and run the packed React BottomSheet P1 producer — testing/high
      Scope: tools/v1-profiles/bottom-sheet.mjs, tools/v1-profiles/fixtures/bottom-sheet.tsx, tools/v1-profiles/dialog.mjs, .batuta/reviews/v1-product-review/react-bottom-sheet.md
      Accept: Create the missing narrow BottomSheet producer and fixture by reusing the existing profile runner, recording source and packed tarball hashes, lock identity, tool and browser versions, named cases and actual exits; Run light-theme axe, dark-theme axe, forced colors, reduced motion, LTR and RTL profiles in Chromium Firefox and WebKit, with exact tarball and fresh output paths bound before invocation and controller-captured results; Demonstrate a discriminating fixture negative control is detected and restored, with independent read-only verification of behavior and evidence; Record any product defect with its trigger, observed result, narrow owner and separately proposed repair task, without changing product code

## Decisions and context

The maintainer approved this one-task slice on 2026-09-13. Execute BottomSheet only, then stop. Acceptance here is semantic and requires the conductor to bind actual tarball/output paths and run the producer, not execute placeholder commands or treat review prose as a shell proof. The existing Dialog CLI establishes the intended producer shape: `--react-tarball PATH --styles-tarball PATH --output PATH`, with optional `--browser chromium|firefox|webkit`. BottomSheet has no producer or fixture yet, so task 1 must create the narrow producer before running it; it must not claim an existing BottomSheet producer.

macOS-only native evidence is `pnpm test` exit 0 in 149.03s, `pnpm build` exit 0 in 50.22s, and the three-engine browser matrix exit 0 in 595.43s (Styles 91, React 818, Alpine 319 per engine; 3,684 cases). It does not qualify Linux, Windows, remote workflows, packed V1 artifacts, or release platforms. Dialog/Drawer 18/18 and named React18/19 P1 evidence are reusable only when source, packed artifact, tool, and environment identities match exactly. Preserve deferred Blade, manual and touch requirements, immutable baselines, the three accepted composition exceptions, and future ceilings.

## Remaining backlog — reassessed 2026-09-13

The BottomSheet task above is complete. The former preserved-38 task map is superseded by [V1 backlog triage](v1-backlog-triage.md), which maps every old ID once and replaces automatic component-producer work with evidence-gap review. The historical list remains in `v1-loop-review.md`; it is not executable authority. The subsequent bounded Popover producer was aborted, and only its separately reproduced reduced-motion CSS repair was integrated. Full Popover qualification remains pending.

No unattended queue is approved. Next is one read-only coverage-gap review before selecting an implementation lot. Existing release requirements, pending native Linux/Windows runs, physical/manual profile limits, baseline/runtime decisions and deferred Blade remain explicit in the triage.
