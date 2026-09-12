# Accepted one-time composition budget decision

**Status: approved by the maintainer on 2026-09-12.** After the exact-byte proposal and decimal kB clarification, the maintainer replied “de acordo, terminando roda o batuta pause para pode limpar a sessao”. This accepts only the three numerical exceptions below; no baseline pointer or release status has changed. Scope: incumbent Lyra Styles/React/Alpine V1, before Blade.

## Accepted decision

Accept the following three measured increases as one-time exceptions to the default 3000-byte Brotli ceiling for composition growth. These are exact measured increases, without an additional maintenance allowance.

| Composition | Accepted historical bytes | Current bytes | Approved exception: increase | Amount above the default ceiling |
| --- | ---: | ---: | ---: | ---: |
| overlays | 4912 | 11030 | 6118 | 3118 |
| application-shell | 12644 | 16954 | 4310 | 1310 |
| scheduling | 19594 | 24084 | 4490 | 1490 |

All values are Brotli bytes of JavaScript in the unchanged canonical Vite scenarios. They are not whole-page payloads or estimated download times. The form scenario remains 1878 bytes; files-data decreased from 15158 to 11315 bytes. Neither needs this exception. The 72 standalone caps already pass and are not being changed.

Keep the default 1500/3000-byte simple/complex-or-composition migration ceilings for future changes. Do not add a 5% composition allowance. Accepting these existing sizes adds no bytes to current assets.

## Benefit and rejected alternatives

Retain the verified incumbent contracts: dynamic focus recovery, background inert isolation, ownership of nested and topmost overlays, focus restoration after accepted dismissal, and Tooltip timing and ownership. Previous native regression probes demonstrate failures when the owning fixes are removed. This does not assign an additive compressed cost to each individual fix.

The accepted private icon optimizations are already included. Bounded focus/timer/scan deduplication prototypes saved only 12–30 bytes; shared-panel extraction and root-import variants increased the measured output. Those prototypes are not shipped. Native-only and alternate-foundation replacements were not qualified as equivalent, and comparative foundation work remains suspended under the incumbent V1 direction. These findings do not imply that every possible optimization has been exhausted.

Supporting records: ACTIVE `.batuta/v1-budget-foundation.md`, `v1-size-limit-evaluation.md`, `v1-remaining-size-limits.md`, and `specs/2026-09-11-v1-standalone-budget-decision.md`. The larger-increase approval requirement is section 7 of `docs/superpowers/specs/2026-08-30-lyra-v1-deliberate-release-design.md`.

## Final measurement

The canonical collector completed in 57.34 seconds at revision `7ba835cf7adf72e2638a5c4985e4c5f98abcd7d3`, using Node 24.18.0, pnpm 11.13.1 and a frozen cold consumer on macOS arm64. The historical reference is `0003123e22ec57d21946b3f6f383fd2da7d1bd0a`. Architecture, historical lock and package differences remain explicit; no lock was changed in this task.

All five scenario JavaScript measurements match the preceding collection. The Dialog focus correction adds only 22 Brotli bytes to the full shared CSS, from 13723 to 13745 bytes; its minified increase is 113 bytes. All 450 React outputs remain identical. All 1109 module labels are portable.

Exact package SHA256 values:

- React: `658d9faf2987c5401baf2e665b92ad9b12d7b2f507d6385035006cd06c18a5da`
- Styles: `3ab24cd7af1d955093f759ec648cb108ddf0bd62619cb725b7b8d5cf2c7ab9be`
- Alpine: `4542140bfea092c97e010f2c14b21afcea1914273402aed27486a6f4a42d1230`

Raw `baseline-dialog-final-{actual,expected,summary,result}.json` and the command log retain the measurements and the existing check's failure.

## Conditions before accepting a new baseline

Approval of these three numbers alone does not make the historical check pass. The remaining entry deltas still need disposition. Final qualification must bind the exact packages and environment to approved family runtime datasets, thresholds and passing evidence. A separately reviewed immutable core acceptance mechanism must preserve the existing FileUpload pointer, comparisons and runtime validation; existing evidence must not be rewritten.

The representative mobile lab remains diagnostic context, not a family SLA or field INP qualification. No unfinished release cell becomes PASS through this decision. No dependency, feature, versioning, merge, publication or Blade action is authorized by this decision.

## Evidence location and enactment

The unchanged original proposal and raw collector outputs are retained in `/Volumes/Home/francisross/Projects/lyra/lyra/.batuta/runs/v1-focus-closure/`. This record documents numerical approval; implementation of the separate immutable core acceptance mechanism and final qualification remain pending. No asset or executable budget configuration was modified when recording approval.
