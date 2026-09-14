# Current artifact validation — 2026-09-14

Candidate `dc9d54f`. Verification-only lot: package shape, types, existing packed consumers, React18/19 compatibility and current size budgets pass. Exact historical bundle comparison fails and remains unaccepted. No product, dependency, test, validator, budget, canonical evidence or acceptance pointer changed.

## Executed evidence

| Existing proof | Result |
| --- | --- |
| publint Styles, React, Alpine | PASS for all3 packages |
| attw packed React/node16; Alpine/node16 with the existing CI cjs-resolves-to-esm advisory exception | PASS; Alpine remains ESM-only |
| Alpine published interfaces, React use-client directive and no-CDN distribution scans | PASS |
| React and Alpine configured size-limit checks | PASS |
| pnpm pack-smoke | PASS: actual Styles tarball allowlist/install/Vite CSS consumer |
| pnpm smoke | PASS: same React/Styles tarballs, Vite/Next/CommonJS and existing consumer assertions |
| pnpm test:react-compat | PASS: React18.3.1 and19.2.8, each types/build/SSR/hydration/browser/P1SSR/P1browser |
| Existing bundle collector and unchanged --check comparison | Collection completed;72/72 installed-tarball size-limit entries PASS; historical comparison FAIL |

All four captured P1 reports contain exactly the expected11 named components, each passed, no failed/pending cases:44/44 across two phases and two React versions. Compatibility browser phases use Chromium, as configured by the existing producer; they are not a new three-engine qualification. Installed React/ReactDOM versions, fixture locks, tarballs and JSON reports were copied into raw evidence before each producer's ordinary temporary cleanup. No producer was modified.

Built React/Alpine artifacts and Styles source files remained byte-identical through the commands, including producer-triggered rebuilds. The controller recorded hashes for the complete pre-run file inventories and compared them afterwards. The already-passing common pnpm test and Alpine docgen result were reused from the immediately preceding lots with matching product state; the only intervening commit corrected Tabs metadata. No extra browser suite or full common rerun was needed for this verification-only task.

## Exact artifacts

- @lyra-ds/react@0.5.0: `658d9faf2987c5401baf2e665b92ad9b12d7b2f507d6385035006cd06c18a5da`
- @lyra-ds/alpine@0.6.0: `de296884efffe7bcad7f74af9a93595a74ce763edb8bb8e21587559cac09e8aa`
- @lyra-ds/styles@0.5.0: `74fd16fc24d58345b4fccdf30681b37218079dea0646f09c765727aa570489f3`

React and Styles hashes match across smoke, compatibility and bundle collection (Styles also matches pack-smoke). Alpine was packed and installed in the existing bundle consumer; its exports/types/size checks pass. Existing public consumer runtime proofs cover React/Styles, not Alpine execution in an installed consumer DOM. Prior Alpine966 source-browser passes remain separate evidence; this task does not invent a packed Alpine runtime PASS.

## Historical comparison — FAIL, retained

The effective reference resolves through `current.json` to `0003123e22ec57d21946b3f6f383fd2da7d1bd0a`. The unchanged comparison reports466 leaf differences across environment, standalone, scenarios and CSS. Differences include x64→arm64 architecture, root lockfile identity, all three tarball hashes, previously recorded limits and emitted sizes/module contributions. Node24.18.0 and pnpm11.13.1 remain pinned. The mismatch is not solely an operating-system issue; rerunning on Linux would not erase changed source/artifact identities.

The72 current manifest budgets pass; Alpine is23335bytes against24200. The collector also measured five fixed composition scenarios and four CSS entries. Measurement success is not historical acceptance or proof of every composition/runtime requirement. No threshold was raised and no comparison field was dropped to obtain a PASS.

For retention, the controller invoked the existing exported runBundleBaselineCli with --check and its unchanged collectBaseline, copying the returned measurement to raw JSON before the ordinary comparison. Default reference resolution, comparison and exit semantics were preserved. This is output capture, not a replacement producer or canonical baseline write. Complete reference/current JSON and all466 differences are archived. Next: reconcile the historical reference with already-approved implementation/budget changes and the cross-platform evidence policy before any separately scoped acceptance update; do not automatically regenerate or promote the baseline.

## Routing, scope and limits

OpenCode/GLM research151.42s, unchanged guard; controller ran all verification. The scout's assertion that a docs-only latest commit makes the old baseline byte-valid was rejected: it establishes only unchanged product since f535a07. Its suggestion to compare only measurements was not used. Controller checked actual script ownership and used the full existing portable comparison.

Source tree, manifests, locks, baseline files and pointers were unchanged before recording this managed report. Common evidence reused: MAIN `.batuta/runs/tabs-ledger-reference-20260914/` and `.batuta/runs/alpine-dropdown-typeahead-20260914/`. Current commands, exits, source/file inventories, captured reports/tarballs, cleanup records, research adjudication and final commit: MAIN `.batuta/runs/current-artifact-validation-20260914/`.

This closes execution of the current package-verification lot with explicit passing and failing results. Historical bundle acceptance, Alpine packed runtime, Linux/Windows observations, broader media/touch and final V1 qualification remain pending. No container/service changes, remote workflows, push, main merge, release, code repair or next lot.
