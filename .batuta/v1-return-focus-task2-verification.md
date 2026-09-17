# Task 2 verification — Drawer return focus

Approved. Codex gpt-5.6-terra/medium, one test correction retry, no escalation. Shared owner unchanged from00d2ded; integration adds optional returnFocusTo and keys capture on open transitions.

1. Public API/SSR/types: three scoped Drawer files only; consumes prop and calls shared owner. Controller Chromium/SSR70/70, types and scoped ESLint/Prettier pass (all exit0).
2. Trusted real Chromium/WebKit mouse:12/12 close-path × stable trigger/successor cases pass, compared with9/12 baseline failures. Focus asserted after panel removal. Existing pointer-origin and omitted valid-opener regressions preserved.
3. Rapid reopen proves same panel identity, focus re-entry, second opener capture and exactly two resolver calls; isolated mount-only dependency fault makes that test fail (mount-only-red.log); original bytes restored. Final WebKit63/63. StrictMode keyboard and ignored-close cases pass. Initial failed test incorrectly used unprepared mouse with null resolver and did not guarantee presence reuse; retry corrected the fixture contract, not runtime assertions.

Independent OpenCode/GLM5.3Flash:3/3 DONE, no findings, unchanged source/status/diff guard; Batuta verifier PASS. Test hygiene clean. Runtime dependency count unchanged. No Colima/Docker/resource/config/remote/release changes. Firefox/Linux release proof remains pending.

Controller used pinned Node24.18.0 directly with installed Vitest4.1.10: run --project 'browser (chromium)' --project ssr src/internal/use-return-focus.browser.test.tsx src/dialog/ src/drawer/; same browser inputs with --project 'browser (webkit)'; tsc --noEmit, scoped eslint and prettier --check. Exact logs and trusted fixture remain in .batuta/runs/v1-return-focus-task2/.
