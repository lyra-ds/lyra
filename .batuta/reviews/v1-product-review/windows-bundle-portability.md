# Native Windows bundle-tool correction — 2026-09-16

PR223 initial native Windows run35156762370 failed five existing support tests. Linux/macOS native jobs and ordinary lint/types/build passed; browser CI remained running at repair time. Windows success is not claimed until the follow-up native run completes.

The scoped correction normalizes separators only after a recognized module-root prefix; preserves canonical baseline LF checkout via .gitattributes without relaxing byte comparisons; starts Vite with durable repository cwd while retaining explicit fixture root; and invokes the real Windows npm.cmd pack through a shell with a quoted destination. No component, package manifest, budget or immutable evidence file changes.

Controller reproduced esbuild retaining the disposable fixture cwd, even with the first proposed cache relocation. That proposal was rejected. Corrected fresh-process inspection confirms the esbuild child cwd is the repository, with no shared-process termination. The existing cwd-independence and real CSS/pack tests pass.

Verification: common pnpm test PASS; final focused tool suite40/40 PASS; complete public native budget gate PASS; original module implementation fails the new Windows-path regression, corrected bytes restored; actual Git checkout with core.autocrlf=true preserves three baseline/comparison peers byte-for-byte. Formatting, scope and diff checks pass. The permanent attribute-introspection assertion was removed as redundant; the actual checkout proof remains raw evidence.

Codex/Terra medium plus one corrective retry; independent GLM review3DONE with unchanged status guard. Informational shell-metacharacter caveat retained: fixed generated fixture paths are covered, arbitrary percent-containing Windows temp roots were not qualified. Native Windows execution remains the decisive follow-up; no full V1 acceptance or merge claim. Raw MAIN .batuta/runs/pr223-ci/ retains first failures, both executor logs, review, checkout/process proofs and gate logs.
