# Plan — Lyra 1.0.1 release follow-up
<!-- inputs: profile.md@sha256:bd14c147316c routing.md@sha256:99f96b92331f -->

**Goal:** Correct the verified AppSidebar/Shell/WorkspaceSwitcher regressions and stale compatibility documentation discovered after the published Lyra 1.0.1 release, while preserving the fixes already delivered by 1.0.1.
**Created:** 2026-09-20 · **Status:** proposed — implementation requires explicit approval in the new session
**Base:** `origin/main` at `0b76f55d2f6f972e4e6a863cf9b53984727ff296` (`@lyra-ds/styles@1.0.1`, `@lyra-ds/react@1.0.1`, `@lyra-ds/alpine@1.0.0`).

## Verified starting point

The 1.0.1 release genuinely fixed its announced React composition path:

- a content-scroll `Shell` follows a direct React `AppSidebar` at 260px expanded and 64px collapsed;
- an expanded `WorkspaceSwitcher` fits the AppSidebar brand slot;
- the standalone Dialog Size Limit budget exists and passes at 5.04 kB against 5.3 kB;
- build, typecheck, unit tests, parity, Styles lint, size-limit and published CI passed on the release commit.

Independent post-release browser reproduction found the following current gaps:

1. The documented CSS-only `.lyra-appsidebar` markup has no width declaration or `--appsidebar-width` fallback. In a content-scroll Shell whose direct child is an AppSidebar, the rail switches to `width: auto` and measured approximately 136px instead of the previous 220px Shell track or the React AppSidebar's 260px default.
2. A `WorkspaceSwitcher` used as the AppSidebar brand is compressed in the 64px icon rail. The root retains `min-width: 220px`, while the brand clips it; after transition completion the measured root was approximately 23px wide with overflowing internal content.
3. `.lyra-appsidebar` still transitions `width` under `prefers-reduced-motion: reduce`, now moving the Shell's main column with it.
4. `Shell.sidebarWidth` is ignored when a direct AppSidebar owns the content-scroll rail width. This matches the current CSS comment and 1.0.1 implementation, but the precedence is not stated in the React API or component documentation.
5. The English and Portuguese compatibility guides still identify all packages as 1.0.0 instead of the published and tested tuple Styles 1.0.1 + React 1.0.1 + Alpine 1.0.0. The support guides also retain pre-release wording about a later 1.0.0 release.

Diagnostic artifacts live outside the repository at:

- `/home/francisross/Projects/open-design-local/LYRA-1.0.1-VALIDATION-RESULT.md`
- `/home/francisross/Projects/open-design-local/data/projects/lyra-1-0-1-validation-claude/`

They are supporting observations, not product authority. Current source, public contracts and repository-owned tests remain authoritative.

## Proposed contract decisions

Approval of this plan approves these bounded decisions. If the maintainer wants different ownership, stop before Task 2 and revise the plan rather than implementing an ambiguous compromise.

1. **AppSidebar owns its width when it is the direct child of a content-scroll Shell rail.** `AppSidebar.width` / `--appsidebar-width` wins in that composition. `Shell.sidebarWidth` continues to size ordinary sidebar content and page-scroll Shell tracks. Document this precedence instead of making two width controls compete.
2. **CSS-only AppSidebar receives the same defaults as React.** Expanded defaults to 260px; `.lyra-appsidebar--rail` defaults to 64px; a consumer may override `--appsidebar-width`. React's inline custom property remains supported and authoritative.
3. **A WorkspaceSwitcher in an icon rail becomes a compact trigger, not a clipped full trigger.** Keep the avatar/identity icon as the visible owner, hide text and chevron visually, preserve the native button's accessible name and a minimum 44×44 coarse-pointer target, and allow the opened popover to use a usable full width without overflowing the viewport.
4. **Reduced motion removes the sidebar width transition.** State still changes immediately; only interpolation is removed.
5. **Historical 1.0.0 migration content remains historical.** Update current-version and support statements, not the documented 0.x → 1.0.0 migration commands or evidence.

## Tasks

- [ ] 1. Add discriminating regression coverage for the published gaps — testing/high
      Scope: `packages/styles/tests/` with a focused AppSidebar/Shell test file or a bounded extension of an existing Styles browser test; `packages/react/src/app-sidebar/app-sidebar.browser.test.tsx`; only shared test helpers already present in the repository.
      Accept: repository-owned browser assertions reproduce the original 1.0.1 behavior before the fix and pass afterward; cover CSS-only expanded width 260px, CSS-only rail width 64px, custom `--appsidebar-width`, direct-child Shell ownership, ordinary `Shell.sidebarWidth`, reduced-motion transition duration 0s, compact WorkspaceSwitcher trigger geometry, usable opened popover geometry, keyboard opening/Escape/focus return, light/dark, LTR/RTL and 320px viewport; the negative proof fails for the intended original declarations rather than for timing or font metrics.

- [ ] 2. Restore the CSS-only AppSidebar width contract and make ownership explicit — styles/high
      Depends on: 1
      Scope: `packages/styles/components/navigation/navigation.css`, `packages/styles/components/chrome/chrome.css`, `tools/parity/parity.mjs` or its baseline only if the established additive-extension mechanism requires it.
      Accept: `.lyra-appsidebar` resolves to 260px without React or inline styles; `.lyra-appsidebar--rail` resolves to 64px; consumer `--appsidebar-width` overrides remain effective; the direct-child content-scroll Shell follows the AppSidebar; ordinary Shell rails continue to honor `--shell-sidebar`; page-scroll Shell behavior and the 900px/1100px responsive boundaries are unchanged; no selector is broadened to wrappers without a separate reproduced requirement.

- [ ] 3. Define and implement the WorkspaceSwitcher icon-rail presentation — styles/high
      Depends on: 1, 2
      Scope: `packages/styles/components/navigation/navigation.css`, existing WorkspaceSwitcher/AppSidebar browser fixtures, parity metadata only if required by the existing additive CSS contract.
      Accept: the collapsed AppSidebar brand has no horizontal overflow; the trigger keeps an accessible name and visible avatar/identity owner; hidden text and chevron do not consume layout; the trigger remains keyboard reachable and at least 44×44 under coarse-pointer media; opening from the rail produces a usable popover width, remains within a 320px viewport in LTR and RTL, and preserves selection, Escape and focus-return behavior; expanded WorkspaceSwitcher geometry from 1.0.1 remains passing.

- [ ] 4. Honor reduced motion for AppSidebar collapse and expansion — styles/medium
      Depends on: 2
      Scope: `packages/styles/components/navigation/navigation.css` and the repository-owned media-emulation regression from Task 1.
      Accept: normal motion retains the existing width transition; `prefers-reduced-motion: reduce` computes `transition-duration: 0s` or `transition-property: none` for AppSidebar width; state, 260px/64px final geometry and Shell layout remain correct; no unrelated navigation transitions are disabled.

- [ ] 5. Document width precedence, CSS-only defaults and the compact brand contract — documentation/medium
      Depends on: 2, 3, 4
      Scope: `packages/react/src/app-sidebar/app-sidebar.tsx`, `packages/react/src/shell/shell.tsx`, generated docgen outputs owned by the repository, `apps/docs/content/docs/{en,pt-BR}/components/app-sidebar.mdx`, and the narrow WorkspaceSwitcher/Shell references required to keep the two locales accurate.
      Accept: `AppSidebar.width` states that it owns a direct content-scroll Shell rail; `Shell.sidebarWidth` states when it applies and when a direct AppSidebar owns the rail; both locales show CSS-only expanded/rail custom-property usage and describe the compact WorkspaceSwitcher brand behavior; generated API artifacts match source; examples use no remote assets and preserve valid landmarks and native controls.

- [ ] 6. Update published compatibility and support statements — documentation/low
      Scope: `apps/docs/content/docs/{en,pt-BR}/guides/compatibility.mdx`, `apps/docs/content/docs/{en,pt-BR}/guides/support.mdx`; other current-version claims only when a repository search proves they are stale.
      Accept: current versions read Styles 1.0.1, React 1.0.1 and Alpine 1.0.0; the tested tuple records exactly `=1.0.1`, `=1.0.1`, `=1.0.0`; support prose no longer describes 1.0.0 as future; the historical migration guide remains about migration to 1.0.0; EN/PT-BR claims remain semantically aligned.

- [ ] 7. Add the release note metadata for the actual changed package surfaces — release/medium
      Depends on: 2, 3, 4, 5, 6
      Scope: one or more new `.changeset/*.md` files and package changelog inputs only; do not run `changeset version`.
      Accept: Styles receives a patch changeset for the CSS behavior corrections; React receives a patch changeset only if its shipped source/JSDoc or generated package API changes materially; Alpine remains unchanged unless an independently reproduced Alpine-owned change is required; `pnpm exec changeset status` reports only justified packages; no package version is changed in this task.

- [ ] 8. Run the bounded and full repository qualification — verification/critical
      Depends on: 1, 2, 3, 4, 5, 6, 7
      Scope: exact final working tree, pinned Node 24.18.0 and pnpm 11.13.1, current `.github/workflows/ci.yml` commands and Playwright 1.62.1 environment.
      Accept: focused Styles and React browser regressions pass in Chromium, Firefox and WebKit; `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm test:browsers`, `pnpm parity`, Styles lint, React/Alpine size-limit, docgen drift, docs build, publint/attw/pack-smoke/smoke and applicable distribution scans pass; a deliberate rollback of each product correction makes its focused regression fail and restoration passes; final `git diff --check` passes; record unsupported or unavailable gates honestly instead of substituting host-only evidence.

- [ ] 9. Produce the Batuta verification handoff and stop before remote or release actions — documentation/critical
      Depends on: 8
      Scope: a focused `.batuta/v1-0-1-release-follow-up-verification.md`, any bounded raw output path already permitted by repository practice, and `WORK.md` only if the current project convention requires a checkpoint entry.
      Accept: the handoff records exact base/head commits, changed files, package surfaces, commands, exits, browser totals, negative proofs, remaining limitations and changeset disposition; independent read-only review checks every acceptance criterion against the final tree; working tree contains only the intended implementation and evidence; stop without commit, push, PR, merge, versioning or publication unless the maintainer separately authorizes those actions.

## Execution boundaries

- Work on a dedicated feature branch/worktree created from the exact base above; never implement directly on `main`.
- Follow `.batuta/profile.md`, `.batuta/routing.md`, `.claude/CLAUDE.md`, the complete current `.github/workflows/ci.yml`, and the CSS handoff/parity rules.
- Run sequentially. Announce the Batuta lane/domain/model before delegated execution. High tasks use Codex `gpt-5.6-terra`; critical verification remains with the conducting session; independent read-only review uses the configured low/research lane.
- Do not add dependencies, introduce a new audit framework, alter Docker/Colima or other services, modify Blade/imported snapshots, rewrite immutable V1 evidence, regenerate accepted baselines without an intended source change, or broaden this patch into Tabs work.
- The host-only Chromium RTL Tabs failures observed during the audit are explicitly out of scope: the same cases passed in the pinned Playwright CI image and do not establish a Lyra defect.
- Preserve the 1.0.1 fixes and Dialog budget. Do not weaken assertions, hide overflow, remove accessibility names, or treat clipping as a compact design.
- No authorization is granted here for commit, push, PR creation, merge, version bump, npm publication or remote workflow dispatch. Those remain separate maintainer actions.

## New-session kickoff

Start from the repository root and read this file, `.batuta/profile.md`, `.batuta/routing.md`, `.claude/CLAUDE.md`, the complete `.github/workflows/ci.yml`, and the current implementations/tests named in Tasks 1–6. Verify that `HEAD` still descends from `0b76f55d2f6f972e4e6a863cf9b53984727ff296`; if `origin/main` advanced, rebase the plan against the new source and reproduce the gaps before editing. Then create the dedicated branch/worktree, execute Tasks 1–9 in order, and stop at the authorization boundary.
