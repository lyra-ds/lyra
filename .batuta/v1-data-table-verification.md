# DataTable semantic cell actions — 2026-09-10

Status: accepted locally; GLM three criteria DONE, no findings, unchanged1980-file guard, Batuta verifierPASS. Task28 local acceptance only; core/Alpine V1 qualification remains Task39.

## Change and routing
The retired pointer-only onRowClick prop and row handler are removed. Existing opaque ReactNode cells carry native consumer-owned buttons/links, with table, sorting, checkbox selection, ref/native root props and explicit hover preserved. The existing DataTableBasic and both current public MDX snippets show selected project name/owner. A React minor changeset documents the pre1 unsafe-contract exception and manual migration. No new action API, grid, dependency, CSS or Alpine/Blade runtime change.

Native baseline15/15 reproduced missing native row keyboard entry and nested button double actions despite source7/7 per engine. GLM scout69.25s and selected-design review402.93s informed the bounded existing-cell replacement; design3DONE/unchanged guard/verifierPASS. Locale concern declined per explicit English rule; explicit-hover regression accepted. Implementation Codex gpt-5.6-terra/high285.17s, one same-lane retry74.68s for real detail text, precise compatibility prose and an exact diagnostic assertion. No escalation. Existing untracked .impeccable/hook.cache.json changed through executor hooks and is retained unstaged; no hook configuration change or byte-preservation claim.

## Controller proofs
1. Source10 tests per Chromium/WebKit/Firefox, SSR2, React types/lint/build and root/subpath public declaration fixture pass. Old declarations produced two TS2344 failures; current declarations reject the retired prop. Deliberately stale JavaScript input gets exactly React's expected warning, with no row activation/implicit hover; original source fails the regression and exact-byte restoration passes. Native table/ref/data and existing source coverage remain; no skips/only/new dependency mocks or weakened old assertions.
2. Actual compiled native66/66 across three engines, zero page/console errors. Includes pointer/Tab/ShiftTab/Enter/Space, sort/checkbox independence, controlled refusal, reorder identity, native disabled/cancellation/link navigation, real example and both exact snippets. Four actual ReactDOMServer outputs hydrate without mismatch. Small375px dark consumer screenshots inspected. Initial verification-harness Vite SSR CommonJS resolution was corrected using an actual Node server render. Initial WebKit ShiftTab assertion incorrectly assumed native checkbox keyboard eligibility; final proof asserts reverse traversal away and forward return to the native action without adding commands. No runtime or browser preference modification.
3. Scoped Prettier, git diff --check, docs types/lint, MDX2compile, protected frontmatter/Example IDs/StackApi/Alpine and Blade suffixes,303stack tests, owning docgen generation/drift check all pass. Final source/snippet/compiled DataTable hashes bind the recorded proof. Protected Alpine artifact hashes remain unchanged.

Full existing React size pipeline: DataTable1661 ->1638bytes (-23), unchanged2250byte limit PASS. Existing12React overages remain failures; size command exits1, not waived. WholeAlpine23051/21200bytes remains separate Task10. No V1, packedLinux, React18/19, manualAT, remote or publication qualification claimed.

## Evidence and next
Main checkout .batuta/runs/v1-data-table contains verbatim briefs/executor/reviewer logs, original source/types/native proofs, checks-result.json, final-native/result.json, negative-result.json, size-before/after.json and final-artifact-proof.json. Active worktree branch feat/v1-incumbent-stabilization remains isolated; no push, merge, version, publication or resource/service change. Next Tasks31 modal ownership and38Popover, then10size and39exact core/Alpine qualification. Blade is deferred until core/Alpine V1 closes.

## Final independent review
OpenCode opencode/glm-5.3-flash73.13s, three criteria DONE, findings none,1980-file hash guard unchanged and Batuta verifierPASS. Exact design/brief/source/diff/proofs supplied inline. Controller accepts all three criteria.
