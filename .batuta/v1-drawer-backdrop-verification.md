# Drawer backdrop fixture verification

Base: c3c392cd12d0617080dffc3276bde41561b11e39. Scope: one React browser test; no runtime, CSS, dependencies or asset changes.

## Cause and repair
Pinned Linux WebKit at 333x720 delivered trusted native down/up/click to the Drawer header after its entrance animation; the full-width panel leaves no exposed backdrop. At 1280x720 the same point hits the overlay and closes correctly. Pre-click geometry alone was misleading during entrance. The existing explicit mouse backdrop fixture now uses 1280x720 only in its backdrop branch, checks panel exclusion and elementFromPoint, captures the actual native click target, and restores viewport and listener in finally. Escape/button cases, unprepared opener and strict declared-target focus assertions remain.

## Proof
- Codex Terra medium 194.79s, no retry, exactly one allowed file.
- Controller 20 cases per engine on host and pinned Linux; all six runs exit0. Format, ESLint, types and diff check exit0.
- Removing the actual useReturnFocus resolver option in the disposable Linux copy causes native backdrop closure followed by wrong button focus; restored source passes. Original runtime restored byte-for-byte.
- All450 React dist files match the pre-existing Linux reference after the fresh host bundle collector rebuilt them.
- GLM independent review23.51s; verdict-format correction4.24s, three DONE, unchanged tracked/status guards and verifier PASS. Its only informational finding about pre-click entrance geometry is already mitigated by actual event-target capture; no further edit warranted.

## Full browser coverage and limits
React Linux Chromium and Firefox each818 cases/82files PASS. WebKit continuous run and shard4 retain resource-related connection failures. Shards1-3 plus all20 fourth-shard files rerun separately now cover exactly82 unique files/818 cases, with expected per-file counts, successful process exits and no omitted/pending/failed assertions. This is complete partitioned coverage, not a claim that the original continuous command passed. Alpine full Linux319cases/34files per engine PASS.

Raw controller evidence: MAIN .batuta/runs/v1-focus-closure/drawer-*, linux-drawer-final.*, linux-webkit-resumed-results.json and linux-webkit-complete-coverage.json. Prior failures remain retained. V1 remains unqualified pending exact Linux build, historical bundle/scenario disposition and formal P1 evidence.
