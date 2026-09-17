# Alpine Dropdown typeahead — 2026-09-14

Base `7bbb2e0`. The existing Alpine Dropdown now searches rendered command labels case-insensitively, accumulates a prefix, wraps from the current item and cycles repeated characters. Decorative aria-hidden text is excluded; aria-disabled matches remain discoverable. A 500ms buffer clears on ordinary close/open, external open=false and destroy. Existing key cancellation, modified/composing input, Space activation, arrow/Home/End/Escape/Tab navigation, selection and placement behavior remain intact. No new public options, bindings, item variants, CSS, dependencies or generic keyboard owner. An Alpine patch changeset describes this correction only.

## Controller evidence

- Initial focused source cases: 11/11 in each engine. Replacing only dropdown.ts with original source, retaining the initial new tests, fails matching and expiry cases in Chromium/Firefox/WebKit (2 expected failures and 9 passes each); source restored exactly.
- Removing only destroy cleanup makes the cleanup case fail in Chromium. The first external-close test incorrectly exercised outside-mousedown cleanup first: removing watcher cleanup still passed. One bounded retry changes only external button activation to focus plus native Enter, retaining all three new cases. Removing only watcher cleanup now fails that case in all three engines; exact source restoration recorded.
- Final complete Alpine suite: 322/322 Chromium, 322/322 Firefox, 322/322 WebKit (966 total), including all 33 focused cases. These final runs occurred after the last source restoration and test correction.
- Scoped Prettier, Alpine typecheck/build and Alpine docgen check PASS. Size23.35kB minified/Brotli against the unchanged24.2kB cap. Full common `pnpm test` PASS, exit0/298.45s.
- Scope, preserved assertions, no skips/exclusive markers/mock focus/type suppressions, source/test hashes and clean candidate checked. Native macOS Node24.18.0/pnpm11.13.1. ASCII matching uses native keyboard input; Unicode/modifier/composition and the locally controlled timer probe use explicitly bounded live-DOM synthetic input, not a claim of native Unicode typing.

## Routing and adjudication

Codex/gpt-5.6-terra medium, initial delivery403.05s and one four-line test-proof retry. Controller interrupted the retry after mistaking extra Batuta brief preparation for nested execution; no nested executor invocation was found. A31.49s same-model completion returned scoped static verification without further edits. Raw interruption and its correction remain recorded. No escalation or product implementation rewrite.

Independent OpenCode/GLM-5.3-Flash review119.58s: three DONE lines, unchanged-tree guard. One low timing observation is retained: long browser-command delays can let the real500ms buffer expire during a test. The proposed callback-between-spy-and-destroy false-positive sequence is declined because those operations execute synchronously without an event-loop yield. Actual original-source and cleanup mutations discriminate the behavior. Reviewer incorrectly described destroy-removal evidence as three-engine; it was Chromium only. Watcher-removal and original-source negatives were three-engine. No extra framework or unrelated tests were added for that observation.

Raw briefs, executor logs, first weak proof, corrected negative/positive reports, source hashes, review findings/adjudication and final commit: MAIN `.batuta/runs/alpine-dropdown-typeahead-20260914/`.

## Limits and next work

This closes the concrete Alpine typeahead implementation gap identified by the contract reconciliation; it does not qualify the complete OF-MENU family or add disabled activation, a new roving model or submenu APIs. The canonical Tabs ledger update remains separate. Final-candidate Alpine package/platform qualification must bind this new source; build/size/source tests do not qualify every release obligation. No Docker/Colima, remote dispatch, push, main merge, baseline promotion or release action.
