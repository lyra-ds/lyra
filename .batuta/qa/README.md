# Lyra functional QA

This living tree records bounded public-product sessions, not a replacement for
component tests or release qualification. Project documents use English.

## Scope and entry points

- NAV: AppSidebar navigation, icon rail, shortcut, and mobile offcanvas.
- OVL: Dialog, Popover, Tooltip, and adjacent Dropdown dismissal and focus.
- MSG: ToastProvider confirmation, pause, persistence, and dismissal.
- Public product: https://docs.lyra-ds.dev/en/components/app-sidebar and its
  linked component pages. No account or server writes are needed.
- Public examples are the product surface; do not invent a fixture to turn an
  unavailable capability into a pass. React-only companions do not imply
  Alpine or Blade feature parity. This round does not qualify those runtimes.
- No local server is needed. Main CI is required green before sessions.
- Browser: installed Playwright, headless Chromium; keyboard desktop and
  touch-emulated mobile. Native touch hardware and spoken screen-reader
  output require human verification and are explicitly excluded from claims.

## Persistence and conventions

Journeys own flows and true end states. Charters are immutable missions;
reports own session results. Scenario frontmatter owns the latest verdict.
Bug files own symptom identity and lifecycle; GitHub issues link to these ids.
Run ids are UUID v4; never overwrite a previous report or evidence directory.

Raw JSON, screenshots, and transcripts live in the ignored per-run evidence
directory. Preserve them in the workspace recovery archive before retiring
this delivery worktree; report the canonical location in the run report.
`state.csv` is a disposable generated scenario index. All other QA records
are committed. Existing component browser suites remain the automation
baseline; add backlog entries only for demonstrated gaps.

## Historical context

Issue fixes, releases, starter adoption, and workspace organization were
completed before this round; see ../current-state.md. Suspended comparative
experiments are outside scope and must remain suspended.
