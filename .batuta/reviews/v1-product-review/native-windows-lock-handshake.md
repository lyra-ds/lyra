# Native Windows transaction-lock test correction — 2026-09-17

PR230 at9207dac failed the native Windows contributor job105403775958: the cooperative-writer test expected its first writer to acquire a real filesystem lock within100ms. That elapsed-time assumption was unrelated to the exclusion guarantee being tested.

The existing test now waits for its journal-write readiness signal, or detects the first writer completing/failing before that signal. The second-writer rejection and all transaction/output assertions remain unchanged. The existing finally block releases and drains the first writer. There is no larger local timer, retry loop, skipped assertion, platform branch or production change. The normal Vitest test deadline remains in force.

Controller verification at `d43932303c67b77c558298dac309936e28a72b76`:

- Injecting150ms before the journal write makes the original100ms logic fail and the corrected handshake pass. The exact corrected file was restored afterwards.
- All349 evidence-tool tests pass after the normal React/Alpine build prerequisites. An initial run in the fresh checkout lacked those build outputs and failed two preview-build cases; it remains recorded as a setup failure.
- All27 Dialog cases pass in the three native browser engines after adding the public Dropdown trigger class and explicit button role. The historical review now names its original source revision and points to the superseding report.
- Formatting and diff checks pass. Published product files and the previously measured Stylesf88b5ada/Reactae3cf003/Alpine09c6351 artifacts are unchanged, so the existing package/budget evidence is retained.

OpenCode/GLM low implemented both bounded corrections; the controller inspected the diffs and ran the proofs. New native Windows CI is still required; this local result is not a Windows execution claim. Raw logs are under controller `.batuta/runs/pr223-followup/dialog-lock-*` and `dialog-overlay-windows-failure.log`. No release or Version Packages action was taken.
