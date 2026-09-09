You are the implementation worker already delegated by Batuta. Edit directly; no further delegation/orchestration/worktrees/package managers/hooks/config/ignores/services/commits.
# Tooltip timing/ownership — react/high
## Goal
Implement the approved incumbent Tooltip timing/ownership contract in .batuta/specs/2026-09-09-tooltip-timing-design.md. Read it fully; it is the exact task contract.
## Context
Current source is e287941 plus managed state only. Complete React Chromium/SSR780, WebKit683, Firefox683 pass. Guarded source scout and controller12 native failures establish current immediate-hover, no leave grace, lost combined ownership, all-tooltip Escape and unhoverable bubble defects. Read .batuta/v1-tooltip-timing-diagnosis.md. Existing hidden description/pseudo visual/placement stays; no new foundation or API.
## Conventions
React TypeScript/CSS-first, packages/react/CONVENTIONS.md, tests-after, exact current tools. CSS handoff must remain verbatim; additive changes at END of feedback.css, existing parity ADDITIVE_EXTENSIONS only if needed. Do not run Impeccable or configure hooks/ignores; no new component/demo is being introduced. Runtime lib list/exports unchanged. Documentation English. Browser runner cannot bind in your sandbox, controller runs actual tests; do not claim browser pass. Static checks may invoke Node24.18.0 directly if accessible, never configure/bypass a denial.
## Acceptance criteria
1. Implement design's per-document warm coordinator and exact500/300/100 clocks, immediate focus/warm, combined ownership, final-owner cleanup and distinct-document isolation. Keep each instance's cold/leave timer independent. Add meaningful tests using controlled clocks for boundaries; native controller clock will replay exact boundaries independently. If Vitest fake timers are used, restrict to timer functions and restore before cleanup; do not let real browser userEvent or React flush hang. Test the behavior, not private method names.
2. Preserve native actions/consumer callbacks and cancellation; actual pseudo-bubble hoverability and open-state CSS, no closed hitbox, topmost Escape exactly once, stale timer cleanup on close/tip change/target removal/unmount. Keep original placement/description/SSR/theme/keyboard tests. Add tests for representative negative paths, not only opening happy paths. No source skips/only, lax assertions, runtime mocks, platform branches or artificial option/bubble focus.
3. Only scoped files change; no dependency/API/export/variant/placement rewrite/budget/hash changes. Add React+styles patch changeset. Current style handoff/parity and public conventions must remain. Controller build/types/lint/format/stylelint/parity/docgen/three-engine/native/size proof and independent review pending. If pseudo hit testing cannot satisfy real content hover, stop/report before replacing the visual DOM. Do not claim broader packed/Linux/P1/assistive-technology qualification.
## Boundaries
No tools config/settings/ignores/hooks, package managers/install, WORK/.batuta edits, Colima/Docker/foreign services, remote actions, commits or further delegation. No new runtime dependency/global overlay framework. No change outside the declared files. Preserve all unrelated work.
## Scope
packages/react/src/tooltip/tooltip.tsx
packages/react/src/tooltip/tooltip.browser.test.tsx
packages/react/src/tooltip/tooltip.ssr.test.ts
packages/react/src/internal/tooltip-coordinator.ts (optional single private owner)
packages/styles/components/feedback/feedback.css (additive end only)
tools/parity/parity.mjs (only if additive CSS requires an allowlist update)
.changeset/tooltip-timing-ownership.md
## Expected evidence
Changed paths and precise implementation summary. Report actual static checks, limitations and any unimplemented criterion honestly. Controller alone provides independent browser/native/build proof. Full design applies verbatim beyond this compact brief.
## Stop conditions
A public API/foundation/visual DOM migration is required, pseudo hit testing contradicts the design, an out-of-scope owner needs changes, or the same unexpected failure repeats twice. Stop/report and preserve current edits.
